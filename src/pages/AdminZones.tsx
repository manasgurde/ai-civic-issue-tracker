import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AdminZones() {
  const [user, setUser] = useState<any>(null);
  const [healthScores, setHealthScores] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(userData => {
        if (userData.role !== 'admin') { navigate('/dashboard'); return; }
        setUser(userData);
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/analytics/health_scores`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(data => setHealthScores(data || []));
      })
      .catch(() => navigate('/login'));
  }, [navigate]);

  if (!user) return null;

  return (
    <Layout user={user} pageTitle="Zone Health" pageSubtitle="Infrastructure health across Bhopal zones">
      <div className="card mb-6">
        <div className="card-header">
          <div>
            <div className="card-title">Infrastructure Health Scores</div>
            <div className="card-subtitle">AI-predicted zone health for Bhopal, MP</div>
          </div>
          <span className="badge badge-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>smart_toy</span>
            AI Predicted
          </span>
        </div>
        <div className="card-body">
          {healthScores.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">health_metrics</span>
              <h3>No health scores yet</h3>
              <p>Health scores are computed every 5 minutes by the AI background job.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={healthScores}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="zone_name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }} formatter={(v: any) => [`${v}/100`, 'Health Score']} />
                <Bar dataKey="health_score" name="Health Score" radius={[4, 4, 0, 0]}>
                  {healthScores.map((_entry: any, index: number) => (
                    <Cell key={index} fill={_entry.health_score > 70 ? '#16a34a' : _entry.health_score > 40 ? '#d97706' : '#dc2626'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {healthScores.length > 0 && (
        <div className="grid-2">
          {healthScores.map((zone: any) => (
            <div key={zone.zone_name} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{zone.zone_name} Zone</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Infrastructure Zone</div>
                  </div>
                  <div style={{
                    fontSize: 26, fontWeight: 800, color: zone.health_score > 70 ? 'var(--success)' : zone.health_score > 40 ? 'var(--warning)' : 'var(--danger)'
                  }}>
                    {zone.health_score}
                  </div>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, marginBottom: 16 }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    width: `${zone.health_score}%`,
                    background: zone.health_score > 70 ? 'var(--success)' : zone.health_score > 40 ? 'var(--warning)' : 'var(--danger)',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                {zone.ai_summary && (
                  <div className="alert alert-info" style={{ marginTop: 12 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>psychology</span>
                    <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                      <strong>{zone.ai_summary.split(':')[0]}:</strong> {zone.ai_summary.split(':')[1] || zone.ai_summary}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
