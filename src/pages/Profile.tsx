import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [msg, _setMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(setUser)
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) return null;
  const initials = user.email.slice(0, 2).toUpperCase();

  return (
    <Layout user={user} pageTitle="My Profile" pageSubtitle="Manage your account settings">
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '36px 24px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 28, fontWeight: 800, color: 'white',
              border: '4px solid var(--primary-border)',
            }}>
              {initials}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{user.email}</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
              <span className="badge badge-primary" style={{ textTransform: 'capitalize', fontSize: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>shield</span>
                {user.role}
              </span>
              <span className="badge badge-gray">
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>location_city</span>
                Bhopal, MP, India
              </span>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div className="card-title">Account Details</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Email', value: user.email, icon: 'mail' },
                { label: 'Role', value: user.role, icon: 'badge' },
                { label: 'City', value: 'Bhopal, MP, India', icon: 'location_city' },
                { label: 'User ID', value: `#${user.id}`, icon: 'tag' },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <div style={{
                    width: 32, height: 32, background: 'var(--primary-muted)', borderRadius: 'var(--radius)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{row.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', textTransform: 'capitalize' }}>{row.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {msg && <div className="alert alert-success"><span className="material-symbols-outlined">check_circle</span>{msg}</div>}

        <button className="btn btn-danger btn-full" onClick={handleLogout}>
          <span className="material-symbols-outlined">logout</span>
          Sign Out
        </button>
      </div>
    </Layout>
  );
}
