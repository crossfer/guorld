import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { p } from '../lib/theme'

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'

interface Point {
  lat: number
  lng: number
}

export function GlobalMap({ points }: { points: Point[] }) {
  return (
    <div style={{ height: '50vh', borderBottom: `1px solid ${p.borderMid}` }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        {points.map((pt, i) => (
          <CircleMarker
            key={i}
            center={[pt.lat, pt.lng]}
            radius={5}
            pathOptions={{
              fillColor: p.amberDot,
              color: p.bg,
              weight: 1.5,
              fillOpacity: 0.85,
            }}
          />
        ))}
      </MapContainer>
    </div>
  )
}
