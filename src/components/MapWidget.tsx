import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icons based on status
const createIcon = (color: string) => {
  return new L.Icon({
    iconUrl: \https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-\.png\,
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const icons = {
  submitted: createIcon('grey'),
  in_progress: createIcon('blue'),
  resolved: createIcon('green'),
  rejected: createIcon('red')
};

interface Complaint {
  id: number;
  title: string;
  category: string;
  status: string;
  latitude?: number;
  longitude?: number;
}

interface MapWidgetProps {
  center: [number, number];
  complaints: Complaint[];
  height?: string;
  zoom?: number;
}

// Component to handle dynamic center changes
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapWidget({ center, complaints, height = '300px', zoom = 12 }: MapWidgetProps) {
  // Filter complaints that actually have coordinates
  const mapComplaints = complaints.filter(c => c.latitude && c.longitude);

  return (
    <div style={{ height, width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors'
          url=\"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png\"
        />
        {mapComplaints.map(c => (
          <Marker 
            key={c.id} 
            position={[c.latitude!, c.longitude!]} 
            icon={icons[c.status as keyof typeof icons] || icons.submitted}
          >
            <Popup>
              <div style={{ padding: '4px 0' }}>
                <strong style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>{c.title}</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {c.category} • {c.status.replace('_', ' ')}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
