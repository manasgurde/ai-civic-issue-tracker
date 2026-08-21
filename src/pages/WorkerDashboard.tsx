import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const STATUS_BADGE: Record<string, string> = {
  submitted: 'badge-status-submitted',
  in_progress: 'badge-status-in_progress',
  resolved: 'badge-status-resolved',
  duplicate: 'badge-status-duplicate',
  pending_approval: 'badge-status-pending_approval',
};
const PRIORITY_BADGE: Record<string, string> = {
  High: 'badge-danger', Critical: 'badge-danger', Medium: 'badge-warning', Low: 'badge-success',
};

type UploadState = { file: File | null; notes: string; preview: string | null };

export default function WorkerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [uploadMap, setUploadMap] = useState<Record<number, UploadState>>({});
  const [uploading, setUploading] = useState<number | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const navigate = useNavigate();
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(u => {
        if (u.role !== 'worker') { navigate('/dashboard'); return; }
        setUser(u);
        return fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/complaints/assigned`, { headers: { Authorization: `Bearer ${token}` } });
      })
      .then(r => r?.json())
      .then(data => setComplaints(data || []))
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate, token]);

  const markInProgress = async (id: number) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`}/complaints/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'in_progress' })
    });
    if (res.ok) { const u = await res.json(); setComplaints(prev => prev.map(c => c.id === id ? u : c)); }
  };

  const handleFileChange = (id: number, file: File | null) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setUploadMap(prev => ({ ...prev, [id]: { ...prev[id], file, preview } }));
  };

  const handleNotesChange = (id: number, notes: string) => {
    setUploadMap(prev => ({ ...prev, [id]: { ...prev[id], notes } }));
  };

  const submitResolution = async (c: any) => {
    const state = uploadMap[c.id];
    if (!state?.file) { alert('Please select an image of the resolved area.'); return; }
    setUploading(c.id);
    try {
      const formData = new FormData();
      formData.append('file', state.file);
      if (state.notes) formData.append('notes', state.notes);
      const res = await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`}/complaints/${c.id}/resolution-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const updated = await res.json();
        setComplaints(prev => prev.map(comp => comp.id === c.id ? updated : comp));
        setExpandedId(null);
        setUploadMap(prev => { const n = {...prev}; delete n[c.id]; return n; });
      } else {
        const err = await res.json();
        alert(err.detail || 'Upload failed');
      }
    } finally {
      setUploading(null);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12, flexDirection: 'column', color: 'var(--text-muted)' }}>
      <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      <span>Loading your assignments...</span>
    </div>
  );
  if (!user) return null;

  const total = complaints.length;
  const inProgress = complaints.filter(c => c.status === 'in_progress').length;
  const resolved = complaints.filter(c => c.status === 'resolved').length;
  const pending = complaints.filter(c => c.status === 'submitted').length;
  const awaitingApproval = complaints.filter(c => c.status === 'pending_approval').length;

  return (
    <Layout user={user} pageTitle="My Assignments" pageSubtitle="Complaints assigned to you by admin">
      <div className="stat-grid">
        {[
          { label: 'Total', value: total, icon: 'assignment', color: 'indigo' },
          { label: 'Pending', value: pending, icon: 'pending', color: 'orange' },
          { label: 'In Progress', value: inProgress, icon: 'pending_actions', color: 'blue' },
          { label: 'Awaiting Approval', value: awaitingApproval, icon: 'hourglass_top', color: 'purple' },
          { label: 'Resolved', value: resolved, icon: 'check_circle', color: 'green' },
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
          <div className="card-title">Assigned Complaints</div>
          <span className="badge badge-primary">{total} total</span>
        </div>
        {complaints.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined">assignment_turned_in</span>
            <h3>No assignments yet</h3>
            <p>The admin hasn't assigned any complaints to you yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {complaints.map((c, i) => {
              const isExpanded = expandedId === c.id;
              const upload = uploadMap[c.id] || { file: null, notes: '', preview: null };
              const canResolve = c.status === 'in_progress' || c.status === 'submitted';
              return (
                <div key={c.id} style={{ borderBottom: i < complaints.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ padding: '16px 20px' }}>
                    {/* Header Row */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>#{c.id} — {c.title}</span>
                          <span className={`badge ${PRIORITY_BADGE[c.priority] || 'badge-gray'}`}>{c.priority || 'Normal'}</span>
                          <span className={`badge ${STATUS_BADGE[c.status] || 'badge-gray'}`}>{c.status.replace('_', ' ')}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 6px' }}>{c.description}</p>
                        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                          {c.address && <span><span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: 'middle' }}>location_on</span> {c.address}</span>}
                          {c.landmark && <span><span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: 'middle' }}>near_me</span> Near {c.landmark}</span>}
                          <span><span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: 'middle' }}>category</span> {c.category}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                        {c.status === 'submitted' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => markInProgress(c.id)}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>play_arrow</span> Start
                          </button>
                        )}
                        {canResolve && (
                          <button className="btn btn-primary btn-sm" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>upload</span>
                            {isExpanded ? 'Cancel' : 'Submit Fix'}
                          </button>
                        )}
                        {c.status === 'pending_approval' && (
                          <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>hourglass_top</span>
                            Awaiting Admin Approval
                          </span>
                        )}
                        {c.status === 'resolved' && (
                          <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span> Approved
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Image + Resolution Images Row */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                      {c.image_url && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Citizen's Photo</div>
                          <a href={c.image_url} target="_blank" rel="noreferrer">
                            <img src={c.image_url} alt="Complaint" style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--border)', cursor: 'zoom-in' }} />
                          </a>
                        </div>
                      )}
                      {c.resolved_image_url && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Resolution Photo</div>
                          <a href={c.resolved_image_url} target="_blank" rel="noreferrer">
                            <img src={c.resolved_image_url} alt="Resolution" style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--border)', cursor: 'zoom-in' }} />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* AI Summary */}
                    {c.ai_resolution_summary && (
                      <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: c.is_resolution_verified ? 'var(--success-bg, #f0fdf4)' : '#fff7ed', border: `1px solid ${c.is_resolution_verified ? '#bbf7d0' : '#fed7aa'}`, fontSize: 13 }}>
                        <span style={{ fontWeight: 700, color: c.is_resolution_verified ? '#15803d' : '#c2410c' }}>
                          {c.is_resolution_verified ? '✅ AI Verified' : '⚠️ AI Alert'}:
                        </span>{' '}
                        {c.ai_resolution_summary}
                      </div>
                    )}

                    {/* Resolution Upload Form */}
                    {isExpanded && canResolve && (
                      <div style={{ marginTop: 16, padding: 16, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>add_photo_alternate</span>
                          Upload Resolution Photo
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                          Take a photo of the fixed area. AI will compare it to the citizen's original photo to verify the fix.
                        </p>
                        <div
                          style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: 20, textAlign: 'center', cursor: 'pointer', background: upload.preview ? 'transparent' : 'var(--surface)', marginBottom: 12 }}
                          onClick={() => fileRefs.current[c.id]?.click()}
                        >
                          {upload.preview ? (
                            <img src={upload.preview} alt="Preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 8 }} />
                          ) : (
                            <div style={{ color: 'var(--text-muted)' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 36 }}>cloud_upload</span>
                              <div style={{ fontSize: 13, marginTop: 6 }}>Click to select or drag & drop image</div>
                            </div>
                          )}
                        </div>
                        <input
                          ref={el => { fileRefs.current[c.id] = el; }}
                          type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={e => handleFileChange(c.id, e.target.files?.[0] || null)}
                        />
                        <div className="form-group">
                          <label className="form-label">Resolution Notes (optional)</label>
                          <textarea
                            className="form-textarea"
                            placeholder="Describe what was done..."
                            value={upload.notes}
                            onChange={e => handleNotesChange(c.id, e.target.value)}
                            style={{ minHeight: 60 }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setExpandedId(null)}>Cancel</button>
                          <button className="btn btn-primary btn-sm" disabled={uploading === c.id} onClick={() => submitResolution(c)}>
                            {uploading === c.id ? (
                              <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Verifying with AI...</>
                            ) : (
                              <><span className="material-symbols-outlined" style={{ fontSize: 14 }}>send</span> Submit for Approval</>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
