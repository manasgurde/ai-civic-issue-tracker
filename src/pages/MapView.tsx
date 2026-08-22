import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import MapWidget from '../components/MapWidget';

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
      // Try to fetch all complaints in the city. Since /complaints/ might be admin-only, we gracefully fallback.
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/complaints/`, { headers: { Authorization: `Bearer ${token}` } })
    ]).then(async ([u, c]) => {
      if (!u.ok) throw new Error();
      setUser(await u.json());
      if (c.ok) {
        setComplaints(await c.json());
      } else {
        // Fallback for citizens who don't have access to /complaints/
        const c_my = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/complaints/my`, { headers: { Authorization: `Bearer ${token}` } });
        if (c_my.ok) {
           setComplaints(await c_my.json());
        }
      }
    }).catch(() => navigate('/login'));
  }, [navigate]);

  if (!user) return null;

  const filteredComplaints = filter === 'all' 
    ? complaints 
    : complaints.filter(c => c.status === filter);

  return (
    <Layout user={user} pageTitle="City Map" pageSubtitle={`Live civic complaint heatmap for ${user.city_name || 'your city'}, ${user.state_name || 'India'}`}>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">City Complaint Map</h1>
            <p className="page-subtitle">Real-time visualization of civic issues across {user.city_name || 'your city'}, {user.state_name || 'India'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'submitted', 'in_progress', 'resolved'].map(f => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(f)}
                style={{ textTransform: 'capitalize' }}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: '600px', width: '100%', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid var(--border)' }}>
        <MapWidget 
          center={user.city_lat && user.city_lng ? [user.city_lat, user.city_lng] : [23.2599, 77.4126]} 
          complaints={filteredComplaints} 
          height="600px" 
        />
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
