import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const MOCK_NOTIFICATIONS = [
  { id: 1, icon: 'check_circle', color: 'var(--success)', title: 'Complaint #3 Resolved', desc: 'Your pothole report on Main St has been resolved.', time: '2 hours ago', read: false },
  { id: 2, icon: 'pending_actions', color: '#2563EB', title: 'Status Update', desc: 'Complaint #2 is now In Progress.', time: '1 day ago', read: false },
  { id: 3, icon: 'smart_toy', color: 'var(--primary)', title: 'AI Classification Complete', desc: 'Your complaint has been auto-classified as Roads > High Priority.', time: '2 days ago', read: true },
  { id: 4, icon: 'report_problem', color: 'var(--warning)', title: 'Duplicate Detected', desc: 'A similar complaint (#1) was found and merged.', time: '3 days ago', read: true },
];

export default function Notifications() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(setUser).catch(() => navigate('/login'));
  }, [navigate]);

  if (!user) return null;

  const unread = notifications.filter(n => !n.read).length;

  return (
    <Layout user={user} pageTitle="Notifications" pageSubtitle="Stay updated on your complaint status">
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 className="page-title">Notifications</h1>
            {unread > 0 && <p className="page-subtitle">{unread} unread notification{unread !== 1 ? 's' : ''}</p>}
          </div>
          {unread > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setNotifications(n => n.map(x => ({ ...x, read: true })))}
            >
              Mark all as read
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => (
            <div
              key={n.id}
              className="card"
              style={{
                padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14,
                cursor: 'pointer', borderLeft: !n.read ? '3px solid var(--primary)' : '3px solid transparent',
                opacity: n.read ? 0.75 : 1,
              }}
              onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
            >
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: n.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: n.color
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{n.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: n.read ? 500 : 700, fontSize: 13.5, color: 'var(--text)' }}>{n.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{n.desc}</div>
                <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4 }}>{n.time}</div>
              </div>
              {!n.read && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 6 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
