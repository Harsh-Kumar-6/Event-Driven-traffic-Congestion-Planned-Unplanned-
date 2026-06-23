import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Users, AlertTriangle, Clock, ArrowRight } from 'lucide-react'

const SEVERITY_STYLE = {
  Low      : { ring: 'ring-green-700',  text: 'text-green-400',  bg: 'bg-green-950'  },
  Moderate : { ring: 'ring-yellow-700', text: 'text-yellow-400', bg: 'bg-yellow-950' },
  High     : { ring: 'ring-orange-700', text: 'text-orange-400', bg: 'bg-orange-950' },
  Critical : { ring: 'ring-red-700',    text: 'text-red-400',    bg: 'bg-red-950'    },
}

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wide mb-1">
        <Icon size={13} />{label}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

export default function ResourcePlan({ result }) {
  const navigate = useNavigate()

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
        <Shield size={40} strokeWidth={1} />
        <p className="text-sm">No prediction yet.</p>
        <button onClick={() => navigate('/predict')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500">
          Go to Predict →
        </button>
      </div>
    )
  }

  const plan  = result.resource_plan
  const style = SEVERITY_STYLE[result.severity_label] || SEVERITY_STYLE['Low']

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-lg font-semibold mb-1">Deployment Plan</h2>
      <p className="text-sm text-gray-400 mb-6">Based on {result.model_used?.toUpperCase()} prediction</p>

      {/* Severity header */}
      <div className={`${style.bg} ring-1 ${style.ring} rounded-xl p-5 mb-6 flex items-center justify-between`}>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Severity</p>
          <p className={`text-3xl font-bold ${style.text}`}>{result.severity_label}</p>
          <p className="text-gray-400 text-sm mt-1">Class {result.severity_class} · Model: {result.model_used}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Impact Score</p>
          <p className={`text-5xl font-bold ${style.text}`}>{result.impact_score}</p>
          <p className="text-gray-500 text-xs mt-1">out of 100</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Stat icon={Users}        label="Officers required"
              value={`${plan.officers_min}–${plan.officers_max}`}
              sub="personnel to deploy" />
        <Stat icon={AlertTriangle} label="Barricades"
              value={`${plan.barricades_min}–${plan.barricades_max}`}
              sub="units required" />
        <Stat icon={Clock}        label="Response time"
              value={plan.response_time}
              sub="from now" />
        <Stat icon={Shield}       label="Shift plan"
              value=""
              sub={plan.shift_plan} />
      </div>

      {/* Congestion timeline */}
      <div className="bg-gray-800 rounded-xl p-4 mb-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Congestion Timeline</p>
        <div className="flex items-center gap-2">
          {[
            { label: 'Start',     time: plan.timeline.start,     color: 'bg-blue-500'   },
            { label: 'Peak',      time: plan.timeline.peak,      color: 'bg-orange-500' },
            { label: 'Clearance', time: plan.timeline.clearance, color: 'bg-green-500'  },
          ].map((t, i, arr) => (
            <React.Fragment key={t.label}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${t.color}`} />
                <p className="text-white font-mono text-sm font-bold">{t.time}</p>
                <p className="text-gray-500 text-xs">{t.label}</p>
              </div>
              {i < arr.length - 1 && (
                <div className="flex-1 h-px bg-gray-600 relative">
                  <ArrowRight size={12} className="absolute -right-1 -top-2 text-gray-500" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Peak in {plan.timeline.peak_min} min · Clearance in {plan.timeline.clear_min} min
        </p>
      </div>

      {/* Diversion routes */}
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Diversion Routes</p>
        <div className="space-y-2">
          {plan.diversion.map((route, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center
                               text-xs font-bold text-white shrink-0">{i+1}</span>
              <span className="text-gray-200">{route}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Probabilities */}
      <div className="bg-gray-800 rounded-xl p-4 mt-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Model Probabilities</p>
        <div className="space-y-2">
          {Object.entries(result.probabilities).map(([cls, prob]) => (
            <div key={cls} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-16">{cls}</span>
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div className="h-2 rounded-full bg-blue-500 transition-all"
                     style={{ width: `${prob * 100}%` }} />
              </div>
              <span className="text-xs text-gray-300 w-10 text-right">
                {(prob * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}