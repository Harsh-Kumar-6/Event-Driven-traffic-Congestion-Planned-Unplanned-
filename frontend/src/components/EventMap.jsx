import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getRisk } from '../api'

// Corridor approximate lat/lon centres (Bengaluru)
const CORRIDOR_COORDS = {
  'mysore road'      : [12.9141, 77.5013],
  'bellary road 1'   : [13.0358, 77.5970],
  'bellary road 2'   : [13.0500, 77.5900],
  'tumkur road'      : [13.0100, 77.5200],
  'hosur road'       : [12.8700, 77.6200],
  'old madras road'  : [13.0050, 77.6700],
  'magadi road'      : [12.9700, 77.5100],
  'orr north 1'      : [13.0400, 77.6200],
  'orr north 2'      : [13.0300, 77.6500],
  'orr south 1'      : [12.9100, 77.6700],
  'orr south 2'      : [12.8900, 77.6500],
  'bannerghata road' : [12.8600, 77.5900],
  'kanakapura road'  : [12.8800, 77.5700],
  'sarjapur road'    : [12.9100, 77.6900],
}

function riskColor(score) {
  if (score >= 0.8) return '#4A0000'
  if (score >= 0.6) return '#993C1D'
  if (score >= 0.4) return '#8A5A00'
  return '#0A5C36'
}

function riskLabel(score) {
  if (score >= 0.8) return 'Critical'
  if (score >= 0.6) return 'High'
  if (score >= 0.4) return 'Moderate'
  return 'Low'
}

export default function EventMap() {
  const [corridors, setCorridors] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    getRisk()
      .then(r => setCorridors(r.data.corridors))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const mapped = corridors
    .map(c => ({ ...c, coords: CORRIDOR_COORDS[c.corridor.toLowerCase()] }))
    .filter(c => c.coords)

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold">Bengaluru Corridor Risk Map</h2>
        <p className="text-sm text-gray-400">
          {loading ? 'Loading...' : `${mapped.length} corridors mapped · Click a marker for details`}
        </p>
      </div>

      {/* Legend */}
      <div className="flex gap-4 px-6 py-2 bg-gray-900 border-b border-gray-800 text-xs">
        {[['Critical','#4A0000'],['High','#993C1D'],['Moderate','#8A5A00'],['Low','#0A5C36']].map(([l,c])=>(
          <span key={l} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{background:c}}/>
            {l}
          </span>
        ))}
      </div>

      <div className="flex-1">
        <MapContainer
          center={[12.9716, 77.5946]}
          zoom={11}
          style={{ height: '100%', width: '100%', background: '#0f172a' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CartoDB'
          />
          {mapped.map(c => (
            <CircleMarker
              key={c.corridor}
              center={c.coords}
              radius={10 + c.risk_score * 18}
              pathOptions={{
                color      : riskColor(c.risk_score),
                fillColor  : riskColor(c.risk_score),
                fillOpacity: 0.75,
                weight     : 2,
              }}
            >
              <Tooltip>{c.corridor}</Tooltip>
              <Popup>
                <div className="text-gray-900 text-sm min-w-[160px]">
                  <p className="font-bold mb-1">{c.corridor}</p>
                  <p>Risk score: <strong>{(c.risk_score * 100).toFixed(0)}%</strong></p>
                  <p>Level: <strong style={{color: riskColor(c.risk_score)}}>{riskLabel(c.risk_score)}</strong></p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}