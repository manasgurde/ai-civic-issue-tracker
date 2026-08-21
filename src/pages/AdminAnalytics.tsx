import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const PIE_COLORS = ['#1e1e8a', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AdminAnalytics() {
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(userData => {
        if (userData.role !== 'admin') { navigate('/dashboard'); return; }
        setUser(userData);
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/complaints/`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(data => setComplaints(data || []));
      })
      .catch(() => navigate('/login'));
  }, [navigate]);

  if (!user) return null;

  const fraudRisk = complaints.filter(c => (c.fraud_score || 0) > 70).length;

  const categoryData = Object.entries(
    complaints.reduce((acc: Record<string, number>, c) => {
      const cat = c.category || 'Unknown';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => (b.value as number) - (a.value as number));

  return (
    <Layout user={user} pageTitle="Analytics" pageSubtitle="Deep dive into complaint data and AI insights">
      <div className="grid-3 mb-6">
        {[
          { label: 'Avg. Resolution Days', value: '3.2', icon: 'schedule', color: 'indigo' },
          { label: 'AI Accuracy Rate', value: '94%', icon: 'smart_toy', color: 'blue' },
          { label: 'Fraud Detected', value: fraudRisk, icon: 'gpp_bad', color: 'orange' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.color}`}><span className="material-symbols-outlined">{s.icon}</span></div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Complaint Volume by Category</div>
        </div>
        <div className="card-body">
          {categoryData.length === 0 ? (
            <div className="empty-state"><span className="material-symbols-outlined">bar_chart</span><p>No data yet</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Count">
                  {categoryData.map((_entry, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Layout>
  );
}
