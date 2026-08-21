import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';

const STATUS_COLORS: Record<string, string> = {
  submitted: 'badge-status-submitted',
  in_progress: 'badge-status-in_progress',
  resolved: 'badge-status-resolved',
  duplicate: 'badge-status-duplicate',
  pending_approval: 'badge-status-pending_approval',
};

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  duplicate: 'Duplicate',
  pending_approval: 'Pending Approval',
};

const PRIORITY_COLORS: Record<string, string> = {
  High: 'badge-danger',
  Medium: 'badge-warning',
  Low: 'badge-success',
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/complaints/my`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(async ([userRes, complaintsRes]) => {
        if (!userRes.ok) throw new Error('Session expired');
        const userData = await userRes.json();
        const complaintsData = complaintsRes.ok ? await complaintsRes.json() : [];
        setUser(userData);
        setComplaints(complaintsData);
      })
      .catch(err => {
        setError(err.message);
        localStorage.removeItem('token');
        navigate('/login');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="loading-page" style={{ minHeight: '100vh' }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <span>Loading your dashboard...</span>
      </div>
    );
  }

  if (!user) return null;

  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === 'resolved').length;
  const inProgress = complaints.filter(c => c.status === 'in_progress').length;
  const submitted = complaints.filter(c => c.status === 'submitted').length;

  const filteredComplaints = activeTab === 'all'
    ? complaints
    : complaints.filter(c => c.status === activeTab);

  return (
    <Layout user={user} pageTitle="My Dashboard" pageSubtitle="Track and manage your civic complaints">
      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon indigo">
            <span className="material-symbols-outlined">report_problem</span>
          </div>
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
          <div className="stat-value">{inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div className="stat-value">{resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <span className="material-symbols-outlined">hourglass_empty</span>
          </div>
          <div className="stat-value">{submitted}</div>
          <div className="stat-label">Awaiting Review</div>
        </div>
      </div>

      {/* Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>My Complaints</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            All reports you've submitted to {user.city_id ? 'Bhopal, MP, India' : 'your city'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {user.role === 'citizen' && (
            <Link to="/complaints/new" className="btn btn-primary">
              <span className="material-symbols-outlined">add</span>
              New Report
            </Link>
          )}
          {user.role !== 'admin' && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={async () => {
                try {
                  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/make_me_admin`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                  });
                  if (!res.ok) throw new Error();
                  alert('You are now an admin! Redirecting...');
                  window.location.reload();
                } catch {
                  alert('Failed to upgrade to admin');
                }
              }}
            >
              <span className="material-symbols-outlined">admin_panel_settings</span>
              Get Admin Access
            </button>
          )}
          {user.role === 'admin' && (
            <Link to="/admin" className="btn btn-primary">
              <span className="material-symbols-outlined">admin_panel_settings</span>
              Admin Panel
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { key: 'all', label: 'All' },
          { key: 'submitted', label: 'Submitted' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'resolved', label: 'Resolved' },
        ].map(t => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            {t.key !== 'all' && (
              <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--bg)', padding: '1px 6px', borderRadius: 9999, fontWeight: 700 }}>
                {complaints.filter(c => c.status === t.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="material-symbols-outlined">inbox</span>
            <h3>No complaints found</h3>
            <p>
              {activeTab === 'all'
                ? "You haven't submitted any complaints yet."
                : `No ${STATUS_LABELS[activeTab]?.toLowerCase() || activeTab} complaints.`}
            </p>
            <Link to="/complaints/new" className="btn btn-primary" style={{ marginTop: 8 }}>
              <span className="material-symbols-outlined">add</span>
              Submit Your First Report
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredComplaints.map(c => (
            <ComplaintCard key={c.id} complaint={c} />
          ))}
        </div>
      )}
    </Layout>
  );
}

function ComplaintCard({ complaint: c }: { complaint: any }) {
  const statusClass = STATUS_COLORS[c.status] || 'badge-gray';
  const statusLabel = STATUS_LABELS[c.status] || c.status;

  return (
    <div className="complaint-card">
      {c.status === 'resolved' && c.resolved_image_url ? (
        <div style={{ position: 'relative' }}>
          <img src={c.resolved_image_url} alt="Resolved" className="complaint-image" style={{ border: "2px solid #22c55e" }} />
          <div style={{ position: 'absolute', top: 8, left: 8, background: '#16a34a', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>verified</span> Fixed
          </div>
        </div>
      ) : c.image_url ? (
        <img src={c.image_url} alt="Complaint" className="complaint-image" />
      ) : (
        <div className="complaint-image-placeholder">
          <span className="material-symbols-outlined">photo_camera</span>
          <span>No Image</span>
        </div>
      )}
      <div className="complaint-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <h3 className="complaint-title">{c.title}</h3>
          <span className={`badge ${statusClass}`} style={{ flexShrink: 0 }}>{statusLabel}</span>
        </div>
        <p className="complaint-desc">{c.description}</p>
        <div className="complaint-meta">
          {c.category && (
            <span className="badge badge-gray">
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>category</span>
              {c.category}
            </span>
          )}
          {c.department && (
            <span className="badge badge-blue">
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>apartment</span>
              {c.department}
            </span>
          )}
          {c.priority && (
            <span className={`badge ${PRIORITY_COLORS[c.priority] || 'badge-gray'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>flag</span>
              {c.priority}
            </span>
          )}
          {c.fraud_score != null && c.fraud_score > 60 && (
            <span className="badge badge-warning">
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>warning</span>
              Fraud Risk: {c.fraud_score}
            </span>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-light)', marginLeft: 'auto' }}>
            #{c.id}
          </span>
        </div>
      </div>
    </div>
  );
}
