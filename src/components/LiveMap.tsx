'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface Point { busId: string; name: string; lat: number; lng: number; heading?: number | null }

export default function LiveMap({ points }: { points: Point[] }) {
  const first = points[0];
  const center: [number, number] = first ? [first.lat, first.lng] : [23.685, 90.3563]; // Bangladesh center
  return (
    <MapContainer center={center} zoom={8} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => (
        <Marker key={p.busId} position={[p.lat, p.lng]} icon={icon}>
          <Popup>{p.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
