import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function AdminWorkers() {
  const [user, setUser] = useState<any>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const navigate = useNavigate();

  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(u => {
        if (u.role !== 'admin') { navigate('/dashboard'); return; }
        setUser(u);
        Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/users?role=worker`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/complaints/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ]).then(([w, c]) => {
          setWorkers(w || []);
          setComplaints(c || []);
        });
      })
      .catch(() => navigate('/login'));
  }, [navigate, token]);

  if (!user) return null;

  return (
    <Layout user={user} pageTitle="Workers" pageSubtitle="Manage field workers in Bhopal">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Registered Workers</div>
          <span className="badge badge-primary">{workers.length} workers</span>
        </div>
        <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Email</th>
                <th>Assigned</th>
                <th>In Progress</th>
                <th>Resolved</th>
              </tr>
            </thead>
            <tbody>
              {workers.map(w => {
                const assigned = complaints.filter(c => c.assigned_worker_id === w.id);
                const inProg = assigned.filter(c => c.status === 'in_progress').length;
                const resolved = assigned.filter(c => c.status === 'resolved').length;
                return (
                  <tr key={w.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                          {(w.name || w.email).slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{w.name || '—'}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{w.email}</td>
                    <td><span className="badge badge-gray">{assigned.length}</span></td>
                    <td><span className="badge badge-status-in_progress">{inProg}</span></td>
                    <td><span className="badge badge-success">{resolved}</span></td>
                  </tr>
                );
              })}
              {workers.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                  No workers registered yet. Workers self-register with access code 12345678.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
