import React, { useEffect, useState } from 'react'
import { getEvents } from '../api'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const SEV_BADGE = {
  0: 'bg-green-900  text-green-300',
  1: 'bg-yellow-900 text-yellow-300',
  2: 'bg-orange-900 text-orange-300',
  3: 'bg-red-900    text-red-300',
}
const SEV_LABEL = { 0:'Low', 1:'Moderate', 2:'High', 3:'Critical' }

export default function HistoryTable() {
  const [events,  setEvents]  = useState([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(0)
  const [loading, setLoading] = useState(true)
  const LIMIT = 50

  useEffect(() => {
    setLoading(true)
    getEvents(LIMIT, page * LIMIT)
      .then(r => { setEvents(r.data.events); setTotal(r.data.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Incident History</h2>
          <p className="text-sm text-gray-400">
            {total.toLocaleString()} total incidents · predicted severity vs actual priority
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button disabled={page===0} onClick={()=>setPage(p=>p-1)}
            className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-400">{page+1} / {totalPages}</span>
          <button disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}
            className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Loading...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
              <tr>
                {['Cause','Corridor','Hour','Actual Priority','Predicted Severity','Score','Duration'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wide font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((e,i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-2.5 text-gray-300">
                    {String(e.event_cause).replace(/_/g,' ')}
                  </td>
                  <td className="px-4 py-2.5 text-gray-300 max-w-[140px] truncate">
                    {e.corridor || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-400">
                    {e.hour != null ? `${String(e.hour).padStart(2,'0')}:00` : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium
                      ${e.priority==='High'
                        ? 'bg-orange-900 text-orange-300'
                        : 'bg-gray-700 text-gray-300'}`}>
                      {e.priority || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium
                      ${SEV_BADGE[e.severity] || 'bg-gray-700 text-gray-300'}`}>
                      {SEV_LABEL[e.severity] || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-300 font-mono">
                    {e.impact_score_rule ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-400">
                    {e.duration_min ? `${Math.round(e.duration_min)} min` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}