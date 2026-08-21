import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

declare global { interface Window { L: any; } }

export default function AdminMap() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => { if (data.role !== 'admin') navigate('/dashboard'); else setUser(data); })
      .catch(() => navigate('/login'));
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = initMap;
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, [user]);

  const initMap = () => {
    const L = window.L;
    const mapEl = document.getElementById('admin-map');
    if (!mapEl || (mapEl as any)._leaflet_id) return;
    const map = L.map('admin-map').setView([23.2599, 77.4126], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const zones = [
      { lat: 23.2800, lng: 77.4000, name: 'Zone A - North', score: 82 },
      { lat: 23.2400, lng: 77.4100, name: 'Zone B - South', score: 45 },
      { lat: 23.2600, lng: 77.4400, name: 'Zone C - East', score: 67 },
      { lat: 23.2500, lng: 77.3800, name: 'Zone D - West', score: 28 },
    ];

    zones.forEach(z => {
      const color = z.score > 70 ? '#16a34a' : z.score > 40 ? '#d97706' : '#dc2626';
      L.circleMarker([z.lat, z.lng], {
        radius: 20, fillColor: color + '80', color, weight: 2, fillOpacity: 0.7
      }).addTo(map)
        .bindPopup(`<strong>${z.name}</strong><br/>Health Score: <strong style="color:${color}">${z.score}/100</strong>`);
    });
  };

  if (!user) return null;

  return (
    <Layout user={user} pageTitle="City Map" pageSubtitle="Admin zone health overlay">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Bhopal Zone Map</div>
            <div className="card-subtitle">AI-predicted infrastructure health by zone</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[{ color: '#16a34a', label: 'Healthy (>70)' }, { color: '#d97706', label: 'Fair (40-70)' }, { color: '#dc2626', label: 'Critical (<40)' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
        <div id="admin-map" style={{ height: 500 }} />
      </div>
    </Layout>
  );
}
