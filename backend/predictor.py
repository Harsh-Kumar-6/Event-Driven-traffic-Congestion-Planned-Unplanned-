import torch
import joblib
import numpy as np
from dataclasses import asdict
from recommender import build_plan, DURATION_FALLBACK

_gat_model    = None
_xgb_model    = None
_encoders     = None
_feature_meta = None
_df_clean     = None
_graph_data   = None
_device       = None

SEVERITY_LABEL = {0: 'Low', 1: 'Moderate', 2: 'High', 3: 'Critical'}
MODEL_DIR      = 'models'


def load_models():
    global _gat_model, _xgb_model, _encoders, _feature_meta
    global _df_clean, _graph_data, _device

    import torch.nn as nn
    import torch.nn.functional as F
    from torch_geometric.nn import GATConv

    _device       = torch.device('cpu')   # Railway free tier is CPU only
    _feature_meta = joblib.load(f'{MODEL_DIR}/feature_meta.pkl')
    _encoders     = joblib.load(f'{MODEL_DIR}/encoders.pkl')
    _df_clean     = joblib.load(f'{MODEL_DIR}/df_clean.pkl')
    _graph_data   = torch.load(
        f'{MODEL_DIR}/graph_data.pt', map_location=_device, weights_only=False)

    class GATFusionNet(nn.Module):
        def __init__(self, n_event_feats, n_graph_feats, n_history_feats,
                     hidden=64, gat_heads=4, dropout=0.3, n_classes=4):
            super().__init__()
            self.dropout = dropout
            self.event_mlp = nn.Sequential(
                nn.Linear(n_event_feats, 128), nn.BatchNorm1d(128), nn.ReLU(),
                nn.Dropout(dropout), nn.Linear(128, hidden), nn.ReLU(),
            )
            self.gat1    = GATConv(n_graph_feats, hidden // gat_heads,
                                   heads=gat_heads, dropout=dropout, concat=True)
            self.gat2    = GATConv(hidden, hidden, heads=1, dropout=dropout, concat=False)
            self.gat_bn1 = nn.BatchNorm1d(hidden)
            self.gat_bn2 = nn.BatchNorm1d(hidden)
            self.history_mlp = nn.Sequential(
                nn.Linear(n_history_feats, 64), nn.BatchNorm1d(64), nn.ReLU(),
                nn.Dropout(dropout), nn.Linear(64, 32), nn.ReLU(),
            )
            self.fusion = nn.Sequential(
                nn.Linear(hidden + hidden + 32, 128), nn.BatchNorm1d(128), nn.ReLU(),
                nn.Dropout(dropout), nn.Linear(128, 64), nn.ReLU(),
                nn.Linear(64, n_classes),
            )

        def forward(self, data):
            e = self.event_mlp(data.event_x)
            g = F.elu(self.gat_bn1(self.gat1(data.x, data.edge_index)))
            g = F.dropout(g, p=self.dropout, training=self.training)
            g = F.elu(self.gat_bn2(self.gat2(g, data.edge_index)))
            h = self.history_mlp(data.history_x)
            return self.fusion(torch.cat([e, g, h], dim=1))

    ckpt       = torch.load(
        f'{MODEL_DIR}/gat_model.pt', map_location=_device, weights_only=False)
    cfg        = ckpt['model_config']
    _gat_model = GATFusionNet(**cfg).to(_device)
    _gat_model.load_state_dict(ckpt['model_state_dict'])
    _gat_model.eval()

    _xgb_model = joblib.load(f'{MODEL_DIR}/xgb_baseline.pkl')
    print(f'✅ GAT + XGBoost loaded on {_device}')


def _encode_event(event: dict) -> dict:
    enc  = _encoders
    meta = _feature_meta

    def safe_encode(encoder, val):
        v = str(val).strip().lower()
        classes = list(encoder.classes_)
        return classes.index(v) if v in classes else 0

    cause_enc    = safe_encode(enc['event_cause'], event.get('event_cause', 'others'))
    etype_enc    = safe_encode(enc['event_type'],  event.get('event_type',  'unplanned'))
    veh_enc      = safe_encode(enc['veh_type'],    event.get('veh_type',    'unknown'))
    corridor_enc = safe_encode(enc['corridor'],    event.get('corridor',    ''))
    zone_enc     = safe_encode(enc['zone'],        event.get('zone',        ''))

    hour     = int(event.get('hour', 12))
    dow      = int(event.get('dow',  0))
    hour_sin = np.sin(2 * np.pi * hour / 24)
    hour_cos = np.cos(2 * np.pi * hour / 24)
    dow_sin  = np.sin(2 * np.pi * dow  / 7)
    dow_cos  = np.cos(2 * np.pi * dow  / 7)
    is_peak  = 1 if (7 <= hour <= 10 or 17 <= hour <= 21) else 0
    is_wknd  = 1 if dow >= 5 else 0
    closure  = 1 if str(event.get('requires_road_closure', False)).lower() \
                    in ('true', '1', 'yes') else 0

    corridor_str  = str(event.get('corridor', '')).strip().lower()
    zone_str      = str(event.get('zone', '')).strip().lower()
    corridor_risk = meta['corridor_risk'].get(
        corridor_str, float(np.mean(list(meta['corridor_risk'].values()))))
    zone_risk     = meta['zone_risk'].get(
        zone_str, float(np.mean(list(meta['zone_risk'].values()))))

    lat      = float(event.get('latitude',  12.9716))
    lon      = float(event.get('longitude', 77.5946))
    lat_norm = (lat - 12.97) / 0.08
    lon_norm = (lon - 77.59) / 0.08

    return {
        'event_feats'  : [cause_enc, etype_enc, veh_enc, closure,
                          hour_sin, hour_cos, dow_sin, dow_cos, is_peak, is_wknd],
        'graph_feats'  : [lat_norm, lon_norm, corridor_risk, hour_sin, hour_cos],
        'history_feats': [corridor_risk, zone_risk, int(event.get('month', 1)),
                          dow_sin, dow_cos, corridor_enc, zone_enc],
        'tabular_feats': {
            'event_cause_enc': cause_enc, 'event_type_enc': etype_enc,
            'veh_type_enc'   : veh_enc,   'road_closure'  : closure,
            'hour_sin'       : hour_sin,  'hour_cos'      : hour_cos,
            'dow_sin'        : dow_sin,   'dow_cos'       : dow_cos,
            'is_peak'        : is_peak,   'is_weekend'    : is_wknd,
            'corridor_risk'  : corridor_risk, 'zone_risk' : zone_risk,
            'month'          : int(event.get('month', 1)),
            'corridor_enc'   : corridor_enc,  'zone_enc'  : zone_enc,
            'lat_norm'       : lat_norm,  'lon_norm'      : lon_norm,
        },
    }


def predict_event(event: dict, model: str = 'gat') -> dict:
    from torch_geometric.data import Data
    from scipy.spatial import KDTree

    encoded = _encode_event(event)

    if model == 'gat':
        new_x       = torch.tensor([encoded['graph_feats']],   dtype=torch.float)
        new_event_x = torch.tensor([encoded['event_feats']],   dtype=torch.float)
        new_hist_x  = torch.tensor([encoded['history_feats']], dtype=torch.float)

        existing_x = _graph_data.x.cpu().numpy()
        tree       = KDTree(existing_x[:, :2])
        _, nn_idx  = tree.query(encoded['graph_feats'][:2], k=min(10, len(existing_x)))

        sub_idx    = list(nn_idx)
        n_sub      = len(sub_idx)
        new_node_i = n_sub

        sub_x       = torch.cat([_graph_data.x[sub_idx],         new_x],       dim=0)
        sub_event_x = torch.cat([_graph_data.event_x[sub_idx],   new_event_x], dim=0)
        sub_hist_x  = torch.cat([_graph_data.history_x[sub_idx], new_hist_x],  dim=0)

        src      = list(range(n_sub)) + [new_node_i]*n_sub + [new_node_i]
        dst      = [new_node_i]*n_sub + list(range(n_sub)) + [new_node_i]
        sub_edge = torch.tensor([src, dst], dtype=torch.long)

        sub_data = Data(x=sub_x, event_x=sub_event_x,
                        history_x=sub_hist_x, edge_index=sub_edge)

        with torch.no_grad():
            logits = _gat_model(sub_data)
            probs  = torch.softmax(logits[new_node_i], dim=0).cpu().numpy()

    else:
        meta  = _feature_meta
        X_row = np.array(
            [[encoded['tabular_feats'][f] for f in meta['tabular_features']]],
            dtype=np.float32)
        probs = _xgb_model.predict_proba(X_row)[0]

    severity_class = int(probs.argmax())
    impact_score   = float(probs.max()) * 100
    duration_min   = DURATION_FALLBACK[severity_class]

    plan = build_plan(
        severity_class = severity_class,
        impact_score   = impact_score,
        corridor       = str(event.get('corridor', '')),
        duration_min   = duration_min,
    )

    return {
        'severity_class' : severity_class,
        'severity_label' : SEVERITY_LABEL[severity_class],
        'impact_score'   : round(impact_score, 1),
        'probabilities'  : {
            'Low'      : round(float(probs[0]), 4),
            'Moderate' : round(float(probs[1]), 4),
            'High'     : round(float(probs[2]), 4),
            'Critical' : round(float(probs[3]), 4),
        },
        'resource_plan' : asdict(plan),
        'model_used'    : model,
    }


def get_corridor_risk() -> list:
    return [
        {'corridor': k, 'risk_score': round(v, 3)}
        for k, v in sorted(
            _feature_meta['corridor_risk'].items(),
            key=lambda x: x[1], reverse=True)
    ]


def get_insights() -> list:
    if _df_clean is None:
        return []
    df = _df_clean.copy()
    insights = []

    top = df[df['severity'] >= 2].groupby('corridor').size().idxmax()
    cnt = df[df['severity'] >= 2].groupby('corridor').size().max()
    insights.append(f"{top} is the highest-risk corridor with {cnt} High/Critical incidents.")

    day_names = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    peak_dow  = df.groupby('dow').size().idxmax()
    peak_cnt  = df.groupby('dow').size().max()
    low_dow   = df.groupby('dow').size().idxmin()
    low_cnt   = df.groupby('dow').size().min()
    insights.append(
        f"{day_names[int(peak_dow)]}s see the most incidents ({peak_cnt:,}) — "
        f"{round(peak_cnt/low_cnt,1)}× more than {day_names[int(low_dow)]}s ({low_cnt:,}).")

    peak_hr = df.groupby('hour').size().idxmax()
    insights.append(f"Peak incident hour is {int(peak_hr):02d}:00–{int(peak_hr)+1:02d}:00 IST.")

    closure_rate = df['road_closure'].mean() * 100
    insights.append(
        f"{closure_rate:.1f}% of incidents require road closure — almost all classified Critical.")

    vb_pct = (df['event_cause'] == 'vehicle_breakdown').mean() * 100
    insights.append(
        f"Vehicle breakdowns account for {vb_pct:.0f}% of all incidents — the single largest cause.")

    unplanned_pct = (df['event_type'] == 'unplanned').mean() * 100
    insights.append(
        f"{unplanned_pct:.0f}% of incidents are unplanned — highlighting the need for real-time response.")

    return insights