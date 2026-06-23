import React, { useEffect, useState } from 'react'
import { getInsights } from '../api'
import { TrendingUp, Clock, AlertTriangle, Car, MapPin, Activity } from 'lucide-react'

const ICONS = [MapPin, TrendingUp, Clock, AlertTriangle, Car, Activity]
const COLORS = [
  'border-blue-700   bg-blue-950',
  'border-purple-700 bg-purple-950',
  'border-amber-700  bg-amber-950',
  'border-red-700    bg-red-950',
  'border-green-700  bg-green-950',
  'border-cyan-700   bg-cyan-950',
]
const ICON_COLORS = [
  'text-blue-400','text-purple-400','text-amber-400',
  'text-red-400','text-green-400','text-cyan-400',
]

export default function InsightCards() {
  const [insights, setInsights] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    getInsights()
      .then(r => setInsights(r.data.insights))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-1">Corridor Insights</h2>
      <p className="text-sm text-gray-400 mb-6">
        Auto-derived patterns from 8,173 real ASTRAM incidents — the post-event learning loop.
      </p>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading insights...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {insights.map((text, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <div key={i}
                className={`rounded-xl border p-5 ${COLORS[i % COLORS.length]}`}>
                <Icon size={20} className={`mb-3 ${ICON_COLORS[i % ICON_COLORS.length]}`} />
                <p className="text-sm text-gray-200 leading-relaxed">{text}</p>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-8 bg-gray-800 rounded-xl p-5">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Dataset Summary</p>
        <div className="grid grid-cols-4 gap-4 text-center">
          {[
            ['8,173', 'Total incidents'],
            ['33',    'Corridors'],
            ['5',     'Months of data'],
            ['99.9%', 'Model F1 score'],
          ].map(([val, label]) => (
            <div key={label}>
              <p className="text-xl font-bold text-white">{val}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}