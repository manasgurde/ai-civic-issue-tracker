import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if ((location.state as any)?.registered) {
      setSuccessMsg('Account created! Please sign in.');
    }
  }, [location.state]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
      if (!res.ok) throw new Error('Invalid email or password. Please try again.');
      const data = await res.json();
      localStorage.setItem('token', data.access_token);

      const payload = JSON.parse(atob(data.access_token.split('.')[1]));
      if (payload.role === 'admin') navigate('/admin');
      else if (payload.role === 'worker') navigate('/worker');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="auth-brand-logo">
            <span className="material-symbols-outlined">location_city</span>
          </div>
          <h1 className="auth-brand-tagline">Civic Intelligence Platform</h1>
          <p className="auth-brand-desc">AI-powered civic issue tracking for Bhopal, MP. Report problems, track resolutions, and build a smarter city together.</p>
          <div className="auth-features">
            {[
              { icon: 'smart_toy', text: 'AI-Powered Analysis' },
              { icon: 'engineering', text: 'Worker Assignment System' },
              { icon: 'bar_chart', text: 'Real-time Analytics' },
              { icon: 'health_metrics', text: 'Zone Health Monitoring' },
            ].map(f => (
              <div key={f.icon} className="auth-feature-item">
                <span className="material-symbols-outlined">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2>Sign In</h2>
            <p>Welcome back to Civic Intelligence</p>
          </div>

          {successMsg && (
            <div className="alert alert-success">
              <span className="material-symbols-outlined">check_circle</span>{successMsg}
            </div>
          )}
          {error && (
            <div className="alert alert-error">
              <span className="material-symbols-outlined">error</span>{error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label required" htmlFor="login-email">Email</label>
              <div className="form-input-icon">
                <div className="icon"><span className="material-symbols-outlined">mail</span></div>
                <input id="login-email" type="email" className="form-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label required" htmlFor="login-pass">Password</label>
              <div className="form-input-icon">
                <div className="icon"><span className="material-symbols-outlined">lock</span></div>
                <input id="login-pass" type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="icon icon-right" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-form-footer">
            Don't have an account? <Link to="/register">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
