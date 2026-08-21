import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted', in_progress: 'In Progress',
  resolved: 'Resolved', duplicate: 'Duplicate', pending_approval: 'Pending Approval',
};
const STATUS_BADGE: Record<string, string> = {
  submitted: 'badge-status-submitted', in_progress: 'badge-status-in_progress',
  resolved: 'badge-status-resolved', duplicate: 'badge-status-duplicate',
  pending_approval: 'badge-status-pending_approval',
};
const PRIORITY_BADGE: Record<string, string> = {
  High: 'badge-danger', Critical: 'badge-danger', Medium: 'badge-warning', Low: 'badge-success',
};

export default function AdminComplaints() {
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(u => {
        if (u.role !== 'admin') { navigate('/dashboard'); return; }
        setUser(u);
        return Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/complaints/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/users?role=worker`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ]);
      })
      .then(results => { if (results) { setComplaints(results[0] || []); setWorkers(results[1] || []); } })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate, token]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`}/complaints/${id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) { const u = await res.json(); setComplaints(prev => prev.map(c => c.id === id ? u : c)); }
  };

  const handleAssignWorker = async (id: number, workerId: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`}/complaints/${id}/assign`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ worker_id: workerId ? parseInt(workerId) : null })
    });
    if (res.ok) { const u = await res.json(); setComplaints(prev => prev.map(c => c.id === id ? u : c)); }
  };

  const approveResolution = async (id: number) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`}/complaints/${id}/approve-resolution`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) { const u = await res.json(); setComplaints(prev => prev.map(c => c.id === id ? u : c)); setExpandedId(null); }
  };

  const rejectResolution = async (id: number) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`}/complaints/${id}/reject-resolution`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) { const u = await res.json(); setComplaints(prev => prev.map(c => c.id === id ? u : c)); setExpandedId(null); }
  };

  if (loading || !user) return null;

  const filtered = complaints.filter(c => {
    const ms = !searchTerm || c.title?.toLowerCase().includes(searchTerm.toLowerCase()) || c.description?.toLowerCase().includes(searchTerm.toLowerCase()) || c.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const mf = statusFilter === 'all' || c.status === statusFilter;
    return ms && mf;
  });

  const pendingApprovalCount = complaints.filter(c => c.status === 'pending_approval').length;

  return (
    <Layout user={user} pageTitle="All Complaints" pageSubtitle="Manage, assign, and verify civic issues">
      {pendingApprovalCount > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined">hourglass_top</span>
          <strong>{pendingApprovalCount} complaint{pendingApprovalCount > 1 ? 's' : ''} await your approval.</strong>
          <button className="btn btn-sm" style={{ marginLeft: 'auto', background: '#d97706', color: 'white' }} onClick={() => setStatusFilter('pending_approval')}>Review Now</button>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">All Complaints</div>
            <div className="card-subtitle">{filtered.length} of {complaints.length} shown</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div className="form-input-icon">
              <div className="icon"><span className="material-symbols-outlined">search</span></div>
              <input type="text" className="form-input" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: 200 }} />
            </div>
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 170 }}>
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="in_progress">In Progress</option>
              <option value="pending_approval">⏳ Pending Approval</option>
              <option value="resolved">Resolved</option>
              <option value="duplicate">Duplicate</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Complaint</th>
                <th>Location</th>
                <th>Images</th>
                <th>Priority</th>
                <th>Fraud</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <>
                  <tr key={c.id} style={{ background: c.status === 'pending_approval' ? '#fffbeb' : undefined }}>
                    <td style={{ maxWidth: 220 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{c.description}</div>
                      {c.resolution_notes && <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>📝 {c.resolution_notes}</div>}
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{c.address || '—'}</div>
                      {c.landmark && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Near {c.landmark}</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {c.image_url && (
                          <a href={c.image_url} target="_blank" rel="noreferrer" title="Citizen's photo">
                            <img src={c.image_url} alt="Original" style={{ width: 44, height: 36, objectFit: 'cover', borderRadius: 6, border: '2px solid var(--border)' }} />
                          </a>
                        )}
                        {c.resolved_image_url && (
                          <a href={c.resolved_image_url} target="_blank" rel="noreferrer" title="Worker's resolution photo">
                            <img src={c.resolved_image_url} alt="Resolved" style={{ width: 44, height: 36, objectFit: 'cover', borderRadius: 6, border: `2px solid ${c.is_resolution_verified ? '#22c55e' : '#f59e0b'}` }} />
                          </a>
                        )}
                        {!c.image_url && !c.resolved_image_url && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No images</span>}
                      </div>
                    </td>
                    <td><span className={`badge ${PRIORITY_BADGE[c.priority] || 'badge-gray'}`}>{c.priority || 'Normal'}</span></td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 13, color: (c.fraud_score || 0) > 70 ? 'var(--danger)' : 'var(--success)' }}>
                        {c.fraud_score ?? 0}/100
                      </span>
                    </td>
                    <td>
                      <select className="form-select" value={c.assigned_worker_id || ''} onChange={e => handleAssignWorker(c.id, e.target.value)} style={{ width: 140, padding: '5px 28px 5px 8px', fontSize: 12 }}>
                        <option value="">Unassigned</option>
                        {workers.map(w => <option key={w.id} value={w.id}>{w.name || w.email}</option>)}
                      </select>
                    </td>
                    <td><span className={`badge ${STATUS_BADGE[c.status] || 'badge-gray'}`}>{STATUS_LABELS[c.status] || c.status}</span></td>
                    <td>
                      {c.status === 'pending_approval' ? (
                        <button className="btn btn-primary btn-sm" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>fact_check</span>
                          Review
                        </button>
                      ) : (
                        <select className="form-select" value={c.status} onChange={e => handleStatusChange(c.id, e.target.value)} style={{ width: 130, padding: '5px 28px 5px 8px', fontSize: 12 }}>
                          <option value="submitted">Submitted</option>
                          <option value="in_progress">In Progress</option>
                          <option value="pending_approval">Pending Approval</option>
                          <option value="resolved">Resolved</option>
                          <option value="duplicate">Duplicate</option>
                        </select>
                      )}
                    </td>
                  </tr>

                  {/* Expanded verification panel */}
                  {expandedId === c.id && c.status === 'pending_approval' && (
                    <tr key={`exp-${c.id}`}>
                      <td colSpan={8} style={{ padding: 0, background: '#fffbeb', borderBottom: '2px solid #d97706' }}>
                        <div style={{ padding: 20 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="material-symbols-outlined" style={{ color: '#d97706' }}>verified</span>
                            Resolution Verification — Complaint #{c.id}
                          </div>

                          {/* Side-by-side images */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, maxWidth: 640 }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.06em' }}>📸 Citizen's Original Photo</div>
                              {c.image_url ? (
                                <a href={c.image_url} target="_blank" rel="noreferrer">
                                  <img src={c.image_url} alt="Original" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, border: '2px solid var(--border)', cursor: 'zoom-in' }} />
                                </a>
                              ) : (
                                <div style={{ width: '100%', height: 180, background: 'var(--surface)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                  No original photo
                                </div>
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.06em' }}>🔧 Worker's Resolution Photo</div>
                              {c.resolved_image_url ? (
                                <a href={c.resolved_image_url} target="_blank" rel="noreferrer">
                                  <img src={c.resolved_image_url} alt="Resolution" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, border: `2px solid ${c.is_resolution_verified ? '#22c55e' : '#f59e0b'}`, cursor: 'zoom-in' }} />
                                </a>
                              ) : (
                                <div style={{ width: '100%', height: 180, background: 'var(--surface)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No photo</div>
                              )}
                            </div>
                          </div>

                          {/* AI Verdict */}
                          {c.ai_resolution_summary && (
                            <div style={{ padding: '12px 16px', borderRadius: 10, background: c.is_resolution_verified ? '#f0fdf4' : '#fff7ed', border: `1px solid ${c.is_resolution_verified ? '#bbf7d0' : '#fed7aa'}`, marginBottom: 16 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: c.is_resolution_verified ? '#15803d' : '#c2410c' }}>
                                {c.is_resolution_verified ? '✅ AI Verified — Resolution Confirmed' : '⚠️ AI Alert — Verification Failed or Uncertain'}
                              </div>
                              <div style={{ fontSize: 13, color: 'var(--text)' }}>{c.ai_resolution_summary}</div>
                            </div>
                          )}

                          {c.resolution_notes && (
                            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 13, marginBottom: 16 }}>
                              <strong>Worker Notes:</strong> {c.resolution_notes}
                            </div>
                          )}

                          {/* Admin Actions */}
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setExpandedId(null)}>Close</button>
                            <button className="btn btn-danger btn-sm" onClick={() => rejectResolution(c.id)}>
                              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>cancel</span>
                              Reject — Send Back to Worker
                            </button>
                            <button className="btn btn-primary btn-sm" style={{ background: '#16a34a' }} onClick={() => approveResolution(c.id)}>
                              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>verified</span>
                              Approve & Mark Resolved
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No complaints found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
