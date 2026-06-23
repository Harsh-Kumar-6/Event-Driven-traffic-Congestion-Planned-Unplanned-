from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from predictor import load_models, predict_event, get_corridor_risk, get_insights

app = FastAPI(
    title   = "Event-Driven Congestion Management API",
    version = "1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = False,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


@app.on_event("startup")
async def startup():
    load_models()


class EventInput(BaseModel):
    event_cause           : str            = Field("vehicle_breakdown")
    event_type            : str            = Field("unplanned")
    veh_type              : str            = Field("unknown")
    corridor              : str            = Field("")
    zone                  : str            = Field("")
    hour                  : int            = Field(12, ge=0, le=23)
    dow                   : int            = Field(0,  ge=0, le=6)
    month                 : int            = Field(1,  ge=1, le=12)
    latitude              : float          = Field(12.9716)
    longitude             : float          = Field(77.5946)
    requires_road_closure : Optional[bool] = Field(False)
    model                 : str            = Field("gat")


@app.get("/health")
def health():
    return {"status": "ok", "model": "GATFusionNet + XGBoost"}


@app.post("/predict")
def predict(event: EventInput):
    try:
        return predict_event(event.dict(), model=event.model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/simulate")
def simulate(event: EventInput):
    try:
        result = predict_event(event.dict(), model=event.model)
        result['simulated'] = True
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/events")
def get_events(limit: int = 100, offset: int = 0):
    from predictor import _df_clean
    if _df_clean is None:
        raise HTTPException(status_code=503, detail="Data not loaded")
    cols      = ['event_cause','event_type','priority','corridor','zone',
                 'severity','severity_label','impact_score_rule',
                 'hour','dow','duration_min','latitude','longitude']
    available = [c for c in cols if c in _df_clean.columns]
    subset    = _df_clean[available].iloc[offset:offset + limit]
    return {
        'total' : len(_df_clean),
        'offset': offset,
        'limit' : limit,
        'events': subset.fillna('').to_dict(orient='records'),
    }


@app.get("/corridors/risk")
def corridors_risk():
    return {'corridors': get_corridor_risk()}


@app.get("/insights")
def insights():
    return {'insights': get_insights()}