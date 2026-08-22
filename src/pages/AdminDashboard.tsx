import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted', in_progress: 'In Progress',
  resolved: 'Resolved', duplicate: 'Duplicate',
};

const STATUS_BADGE: Record<string, string> = {
  submitted: 'badge-status-submitted',
  in_progress: 'badge-status-in_progress',
  resolved: 'badge-status-resolved',
  duplicate: 'badge-status-duplicate',
};

const PRIORITY_BADGE: Record<string, string> = {
  High: 'badge-danger', Medium: 'badge-warning', Low: 'badge-success',
};


export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, _setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!res.ok) throw new Error('Session expired - redirecting'); return res.json(); })
      .then(userData => {
        if (userData.role !== 'admin') { navigate('/dashboard'); return; }
        setUser(userData);
        fetchData(token);
      })
      .catch(() => { navigate('/login'); });
  }, [navigate]);

  const fetchData = (token: string) => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/complaints/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setComplaints(data || []))
      .finally(() => setLoading(false));
  };

  if (loading) return (
    <div className="loading-page" style={{ minHeight: '100vh' }}>
      <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      <span>Loading admin dashboard...</span>
    </div>
  );

  if (!user) return null;

  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === 'resolved').length;
  const inProgress = complaints.filter(c => c.status === 'in_progress').length;
  const highPriority = complaints.filter(c => c.priority === 'High').length;

  const categoryData = Object.entries(
    complaints.reduce((acc: Record<string, number>, c) => {
      const cat = c.category || 'Unknown';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => (b.value as number) - (a.value as number)).slice(0, 6);

  const statusData = [
    { name: 'Submitted', value: complaints.filter(c => c.status === 'submitted').length, color: '#6B7280' },
    { name: 'In Progress', value: inProgress, color: '#2563EB' },
    { name: 'Resolved', value: resolved, color: '#16a34a' },
    { name: 'Duplicate', value: complaints.filter(c => c.status === 'duplicate').length, color: '#d97706' },
  ].filter(d => d.value > 0);

  return (
    <Layout user={user} pageTitle="Admin Dashboard" pageSubtitle={user.city_name ? `${user.city_name} — City Overview` : "City Overview"}>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon indigo"><span className="material-symbols-outlined">report_problem</span></div>
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Complaints</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><span className="material-symbols-outlined">pending_actions</span></div>
          <div className="stat-value">{inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><span className="material-symbols-outlined">check_circle</span></div>
          <div className="stat-value">{resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><span className="material-symbols-outlined">flag</span></div>
          <div className="stat-value">{highPriority}</div>
          <div className="stat-label">High Priority</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">Complaints by Category</div><div className="card-subtitle">Top 6 categories</div></div>
          </div>
          <div className="card-body">
            {categoryData.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <span className="material-symbols-outlined">bar_chart</span><p>No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
                  <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Complaints" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div><div className="card-title">Status Distribution</div></div>
          </div>
          <div className="card-body">
            {statusData.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <span className="material-symbols-outlined">pie_chart</span><p>No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <div className="card-title">Recent Complaints</div>
            <Link to="/admin/complaints" className="btn btn-ghost btn-sm">
              View All <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
            </Link>
          </div>
          <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Complaint</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Fraud</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {complaints.slice(0, 5).map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.category}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--text)' }}>{c.address || 'Location unknown'}</div>
                    </td>
                    <td>
                      <span className={`badge ${PRIORITY_BADGE[c.priority] || 'badge-gray'}`}>
                        {c.priority || 'Normal'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 13, color: (c.fraud_score || 0) > 70 ? 'var(--danger)' : 'var(--success)' }}>
                        {c.fraud_score ?? 0}/100
                      </span>
                    </td>
                    <td><span className={`badge ${STATUS_BADGE[c.status] || 'badge-gray'}`}>{STATUS_LABELS[c.status] || c.status}</span></td>
                  </tr>
                ))}
                {complaints.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No complaints yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
