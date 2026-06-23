import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { simulate } from '../api'
import { Zap, Loader } from 'lucide-react'

const CAUSES = [
  'vehicle_breakdown','accident','congestion','construction',
  'water_logging','tree_fall','pot_holes','road_conditions',
  'public_event','others',
]
const CORRIDORS = [
  'Mysore Road','Bellary Road 1','Bellary Road 2','Tumkur Road',
  'Hosur Road','Old Madras Road','Magadi Road','ORR North 1',
  'ORR North 2','ORR South 1','ORR South 2','Bannerghata Road',
  'Kanakapura Road','Sarjapur Road',
]
const VEH_TYPES = ['car','bus','truck','two_wheeler','auto','unknown']
const DAYS      = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const SEVERITY_BG = {
  Low      : 'bg-green-900  border-green-700  text-green-300',
  Moderate : 'bg-yellow-900 border-yellow-700 text-yellow-300',
  High     : 'bg-orange-900 border-orange-700 text-orange-300',
  Critical : 'bg-red-900    border-red-700    text-red-300',
}

export default function PredictForm({ onResult }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    event_cause: 'accident', event_type: 'unplanned',
    veh_type: 'car', corridor: 'Mysore Road', zone: '',
    hour: 19, dow: 3, month: 4,
    latitude: 12.9141, longitude: 77.5013,
    requires_road_closure: false, model: 'xgb',
  })
  const [loading, setLoading]   = useState(false)
  const [result,  setResult]    = useState(null)
  const [error,   setError]     = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true); setError(null)
    try {
      const r = await simulate(form)
      setResult(r.data)
      onResult(r.data)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  const label = "block text-xs text-gray-400 mb-1 uppercase tracking-wide"
  const input = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
  const select = input + " cursor-pointer"

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-lg font-semibold mb-1">Predict Event Severity</h2>
      <p className="text-sm text-gray-400 mb-6">
        Enter incident details — the model returns severity, impact score, and a full deployment plan.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={label}>Event cause</label>
          <select className={select} value={form.event_cause}
            onChange={e => set('event_cause', e.target.value)}>
            {CAUSES.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Corridor</label>
          <select className={select} value={form.corridor}
            onChange={e => set('corridor', e.target.value)}>
            {CORRIDORS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Vehicle type</label>
          <select className={select} value={form.veh_type}
            onChange={e => set('veh_type', e.target.value)}>
            {VEH_TYPES.map(v => <option key={v} value={v}>{v.replace(/_/g,' ')}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Event type</label>
          <select className={select} value={form.event_type}
            onChange={e => set('event_type', e.target.value)}>
            <option value="unplanned">Unplanned</option>
            <option value="planned">Planned</option>
          </select>
        </div>
        <div>
          <label className={label}>Hour of day (0–23)</label>
          <input type="number" min={0} max={23} className={input}
            value={form.hour} onChange={e => set('hour', +e.target.value)} />
        </div>
        <div>
          <label className={label}>Day of week</label>
          <select className={select} value={form.dow}
            onChange={e => set('dow', +e.target.value)}>
            {DAYS.map((d,i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Month</label>
          <input type="number" min={1} max={12} className={input}
            value={form.month} onChange={e => set('month', +e.target.value)} />
        </div>
        <div>
          <label className={label}>Model</label>
          <select className={select} value={form.model}
            onChange={e => set('model', e.target.value)}>
            <option value="xgb">XGBoost (fast)</option>
            <option value="gat">GAT Fusion (deep)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={form.requires_road_closure}
            onChange={e => set('requires_road_closure', e.target.checked)}
            className="w-4 h-4 accent-blue-500" />
          Requires road closure
        </label>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-900 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500
                   disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors">
        {loading ? <Loader size={16} className="animate-spin" /> : <Zap size={16} />}
        {loading ? 'Predicting...' : 'Predict Severity'}
      </button>

      {result && (
        <div className={`mt-6 p-5 rounded-xl border ${SEVERITY_BG[result.severity_label]}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold">{result.severity_label}</span>
            <span className="text-3xl font-bold">{result.impact_score}</span>
          </div>
          <div className="flex justify-between text-xs opacity-75 mb-4">
            <span>Severity class {result.severity_class}</span>
            <span>Impact score / 100</span>
          </div>
          <button
            onClick={() => navigate('/resources')}
            className="w-full py-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20
                       text-sm font-medium transition-colors">
            View full deployment plan →
          </button>
        </div>
      )}
    </div>
  )
}