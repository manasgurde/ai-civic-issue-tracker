import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import MapWidget from '../components/MapWidget';

declare global {
  interface Window {
    L: any;
  }
}

export default function MapView() {
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/complaints/my`, { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(async ([u, c]) => {
      if (!u.ok) throw new Error();
      setUser(await u.json());
      setComplaints(c.ok ? await c.json() : []);
    }).catch(() => navigate('/login'));
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = initMap;
    document.head.appendChild(script);

    return () => { document.head.removeChild(script); };
  }, [user, complaints, filter]);

  const initMap = () => {
    const L = window.L;
    mockLocations.forEach(loc => {
      const color = colorMap[loc.status] || '#6B7280';
      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: 10, fillColor: color, color: '#fff', weight: 2,
        opacity: 1, fillOpacity: 0.85
      }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:160px">
          <strong style="font-size:13px">${loc.label}</strong><br/>
          <span style="font-size:11px;color:#6B7280">${loc.category}</span><br/>
          <span style="font-size:11px;background:${color}22;color:${color};padding:2px 6px;border-radius:99px;display:inline-block;margin-top:4px;font-weight:600;text-transform:capitalize">${loc.status.replace('_', ' ')}</span>
        </div>
      `);
    });
  };

  if (!user) return null;

  return (
    <Layout user={user} pageTitle="City Map" pageSubtitle={`Live civic complaint heatmap for ${user?.city_name || 'Bhopal'}, MP, India`}>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">City Complaint Map</h1>
            <p className="page-subtitle">Real-time visualization of civic issues across {user?.city_name || 'Bhopal'}, MP, India</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'submitted', 'in_progress', 'resolved'].map(f => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div id="civic-map" style={{ height: 500, borderRadius: 'var(--radius-lg)' }} />
      </div>

      {/* Legend */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-body" style={{ padding: '12px 20px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Legend:</span>
          {[
            { color: '#6B7280', label: 'Submitted' },
            { color: '#2563EB', label: 'In Progress' },
            { color: '#16a34a', label: 'Resolved' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: l.color }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.label}</span>
            </div>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-light)' }}>
            Powered by OpenStreetMap
          </span>
        </div>
      </div>
    </Layout>
  );
}
