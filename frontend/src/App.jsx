import React, { useState } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { Map, Zap, Shield, Clock, Lightbulb } from 'lucide-react'
import EventMap      from './components/EventMap'
import PredictForm   from './components/PredictForm'
import ResourcePlan  from './components/ResourcePlan'
import HistoryTable  from './components/HistoryTable'
import InsightCards  from './components/InsightCards'

const NAV = [
  { to: '/',          icon: Map,       label: 'Map'       },
  { to: '/predict',   icon: Zap,       label: 'Predict'   },
  { to: '/resources', icon: Shield,    label: 'Resources' },
  { to: '/history',   icon: Clock,     label: 'History'   },
  { to: '/insights',  icon: Lightbulb, label: 'Insights'  },
]

export default function App() {
  const [lastResult, setLastResult] = useState(null)

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">

      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Bengaluru</p>
          <h1 className="text-base font-bold text-white leading-tight">
            Traffic Congestion<br/>Management
          </h1>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                 ${isActive
                   ? 'bg-blue-600 text-white'
                   : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-600">GAT Fusion Net v1.0</p>
          <p className="text-xs text-gray-600">ASTRAM Dataset · 8,173 incidents</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/"          element={<EventMap />} />
          <Route path="/predict"   element={<PredictForm onResult={setLastResult} />} />
          <Route path="/resources" element={<ResourcePlan result={lastResult} />} />
          <Route path="/history"   element={<HistoryTable />} />
          <Route path="/insights"  element={<InsightCards />} />
        </Routes>
      </main>
    </div>
  )
}