import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { p } from '../lib/theme'
import type { Entry } from '../types'

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length >= 2) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 12 })
    } else if (points.length === 1) {
      map.setView(points[0], 10)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

export function CoinMap({ entries }: { entries: Entry[] }) {
  const points: [number, number][] = entries
    .filter(e => e.lat != null && e.lng != null)
    .map(e => [e.lat!, e.lng!])

  useEffect(() => {
    console.log(
      '[CoinMap] mounted — points:', points.length,
      '| viewport:', window.innerWidth + 'x' + window.innerHeight,
      '| userAgent:', navigator.userAgent,
    )
  }, [])

  return (
    <div style={{ height: '40vh', borderBottom: `1px solid ${p.borderMid}` }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

        {points.length > 0 && (
          <>
            <Polyline
              positions={points}
              color={p.amberDot}
              weight={2}
              opacity={0.75}
            />
            {points.map((pos, i) => (
              <CircleMarker
                key={i}
                center={pos}
                radius={i === points.length - 1 ? 8 : 5}
                pathOptions={{
                  fillColor: i === points.length - 1 ? p.amberDot : p.amber,
                  color: p.bg,
                  weight: 2,
                  fillOpacity: 1,
                }}
              />
            ))}
            <FitBounds points={points} />
          </>
        )}
      </MapContainer>
    </div>
  )
}
