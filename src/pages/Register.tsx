import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

type RoleType = 'citizen' | 'worker' | 'admin';

const ROLES: { id: RoleType; label: string; icon: string; desc: string; needsCode: boolean }[] = [
  { id: 'citizen', label: 'Citizen', icon: 'person', desc: 'Report civic issues in your city', needsCode: false },
  { id: 'worker', label: 'Worker', icon: 'engineering', desc: 'Field worker who resolves issues', needsCode: true },
  { id: 'admin', label: 'Admin', icon: 'admin_panel_settings', desc: 'Oversee the entire platform', needsCode: true },
];

export default function Register() {
  const [role, setRole] = useState<RoleType>('citizen');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [cityId, setCityId] = useState('');
  const [cities, setCities] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/cities`)
      .then(r => r.json())
      .then(data => { 
        setCities(data); 
        if (data.length > 0) {
          const firstState = data[0].state || 'Unknown';
          setSelectedState(firstState);
          const stateCities = data.filter((c: any) => c.state === firstState);
          if (stateCities.length > 0) {
            setCityId(stateCities[0].id.toString());
          }
        } 
      })
      .catch(() => {});
  }, []);
  
  // Get unique states for dropdown
  const uniqueStates = Array.from(new Set(cities.map(c => c.state || 'Unknown')));
  const availableCities = cities.filter(c => (c.state || 'Unknown') === selectedState);
  
  // Handle state change
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    setSelectedState(newState);
    const stateCities = cities.filter(c => (c.state || 'Unknown') === newState);
    if (stateCities.length > 0) {
      setCityId(stateCities[0].id.toString());
    } else {
      setCityId('');
    }
  };

  const selectedRole = ROLES.find(r => r.id === role)!;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, city_id: parseInt(cityId), role, access_code: accessCode || undefined, name })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Registration failed.');
      }
      navigate('/login', { state: { registered: true } });
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
          <h1 className="auth-brand-tagline">Join the Civic Platform</h1>
          <p className="auth-brand-desc">Register to report civic issues, track resolutions, and help build a smarter Bhopal with AI-powered tools.</p>
          <div className="auth-features">
            {[
              { icon: 'report_problem', text: 'Report Issues Instantly' },
              { icon: 'engineering', text: 'Field Worker Tools' },
              { icon: 'admin_panel_settings', text: 'Admin Controls' },
              { icon: 'smart_toy', text: 'AI-Powered Platform' },
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
            <h2>Create Account</h2>
            <p>Choose your role below</p>
          </div>

          {/* Role Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
            {ROLES.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => { setRole(r.id); setAccessCode(''); setError(''); }}
                style={{
                  border: `2px solid ${role === r.id ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '12px 8px',
                  background: role === r.id ? 'var(--primary-bg)' : 'var(--bg)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all 0.15s ease',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: role === r.id ? 'var(--primary)' : 'var(--text-muted)' }}>{r.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: role === r.id ? 'var(--primary)' : 'var(--text)' }}>{r.label}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>{r.desc}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="alert alert-error">
              <span className="material-symbols-outlined">error</span>{error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name (optional)</label>
              <input id="reg-name" type="text" className="form-input" placeholder="Your name..." value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label required" htmlFor="reg-email">Email</label>
              <input id="reg-email" type="email" className="form-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label required" htmlFor="reg-pass">Password</label>
                <div className="form-input-icon">
                  <input id="reg-pass" type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Min 6 chars" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className="icon icon-right" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required" htmlFor="reg-confirm">Confirm Password</label>
                <input id="reg-confirm" type="password" className="form-input" placeholder="Re-enter password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>
            </div>

            {selectedRole.needsCode && (
              <div className="form-group">
                <label className="form-label required" htmlFor="reg-code">
                  Access Code — <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{role === 'worker' ? 'Worker' : 'Admin'} code required</span>
                </label>
                <div className="form-input-icon">
                  <div className="icon"><span className="material-symbols-outlined">lock</span></div>
                  <input id="reg-code" type="password" className="form-input" placeholder="Enter access code..." value={accessCode} onChange={e => setAccessCode(e.target.value)} required />
                </div>
              </div>
            )}

            {cities.length > 0 && (
              <div className="form-group">
                <label className="form-label" htmlFor="reg-city">City</label>
                <select id="reg-city" className="form-select" value={cityId} onChange={e => setCityId(e.target.value)}>
                  {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
              {loading ? 'Creating account...' : `Register as ${selectedRole.label}`}
            </button>
          </form>

          <div className="auth-form-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
