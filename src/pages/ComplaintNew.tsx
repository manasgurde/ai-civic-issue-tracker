import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const CATEGORIES = ['Roads', 'Water Supply', 'Garbage', 'Electricity', 'Sewage', 'Noise', 'Parks', 'Public Safety', 'Other'];

declare global { interface Window { L: any; } }

export default function ComplaintNew() {
  const [user] = useState<any>(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [lat, setLat] = useState<number>(23.2599);
  const [lng, setLng] = useState<number>(77.4126);
  
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const markerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = initMap;
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, []);

  const initMap = async () => {
      let centerLat = 23.2599;
      let centerLng = 77.4126;
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const userData = await res.json();
            if (userData.city_lat && userData.city_lng) {
              centerLat = userData.city_lat;
              centerLng = userData.city_lng;
              setLat(centerLat);
              setLng(centerLng);
            }
          }
        }
      } catch (err) {}

    const L = window.L;
    if (!L) return;
    const mapEl = document.getElementById('location-map');
    if (!mapEl || (mapEl as any)._leaflet_id) return;
    
    const map = L.map('location-map').setView([centerLat, centerLng], 13);
    mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const initialMarker = L.marker([centerLat, centerLng], { draggable: true }).addTo(map);
    markerRef.current = initialMarker;

    initialMarker.on('dragend', (e: any) => {
      const position = e.target.getLatLng();
      setLat(position.lat);
      setLng(position.lng);
    });

    map.on('click', (e: any) => {
      initialMarker.setLatLng(e.latlng);
      setLat(e.latlng.lat);
      setLng(e.latlng.lng);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/complaints/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          title, description, category, 
          address, landmark, latitude: lat, longitude: lng 
        })
      });

      if (!res.ok) throw new Error('Failed to submit complaint');
      const complaint = await res.json();

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`}/complaints/${complaint.id}/image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
      }

      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Layout user={user} pageTitle="Submit Complaint" pageSubtitle="Report a civic issue">
        <div className="card" style={{ maxWidth: 600, margin: '40px auto' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{
              width: 72, height: 72, background: 'var(--success-bg)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--success)' }}>
                check_circle
              </span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Complaint Submitted!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
              Your complaint has been received and will be processed by our AI system. You will receive updates as it progresses.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 16 }}>
              Redirecting to your dashboard...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} pageTitle="Submit Complaint" pageSubtitle="Report a civic issue in your area">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Report a Civic Issue</div>
              <div className="card-subtitle">
                Fill in the details. Our AI will automatically classify and prioritize your report.
              </div>
            </div>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-error">
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label required" htmlFor="comp-title">Complaint Title</label>
                <input id="comp-title" type="text" className="form-input" placeholder="Brief title..." value={title} onChange={e => setTitle(e.target.value)} required maxLength={120} />
              </div>

              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label required" htmlFor="comp-category">Category</label>
                  <select id="comp-category" className="form-select" value={category} onChange={e => setCategory(e.target.value)} required>
                    <option value="" disabled>Select a category...</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="comp-landmark">Landmark (Optional)</label>
                  <input id="comp-landmark" type="text" className="form-input" placeholder="e.g. Near City Hospital" value={landmark} onChange={e => setLandmark(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required" htmlFor="comp-desc">Description</label>
                <textarea id="comp-desc" className="form-textarea" placeholder="Describe the issue..." value={description} onChange={e => setDescription(e.target.value)} required style={{ minHeight: 100 }} />
              </div>
              
              <div className="form-group">
                <label className="form-label required" htmlFor="comp-address">Address</label>
                <textarea id="comp-address" className="form-textarea" placeholder="Full address of the issue..." value={address} onChange={e => setAddress(e.target.value)} required style={{ minHeight: 60 }} />
              </div>
              
              <div className="form-group">
                <label className="form-label required">Pinpoint Location on Map</label>
                <p className="form-hint" style={{ marginBottom: 8 }}>Drag the marker or click on the map to set the exact location.</p>
                <div id="location-map" style={{ height: 250, borderRadius: 'var(--radius-lg)', zIndex: 1 }} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="comp-image">Photo Evidence (optional)</label>
                <div style={{
                  border: '2px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)',
                  padding: 24, textAlign: 'center', cursor: 'pointer', background: 'var(--bg)',
                }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f && f.type.startsWith('image/')) {
                      setFile(f);
                      const reader = new FileReader();
                      reader.onloadend = () => setFilePreview(reader.result as string);
                      reader.readAsDataURL(f);
                    }
                  }}
                  onClick={() => document.getElementById('comp-image')?.click()}
                >
                  {filePreview ? (
                    <div>
                      <img src={filePreview} alt="Preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 'var(--radius)', margin: '0 auto 12px' }} />
                      <button type="button" className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setFile(null); setFilePreview(null); }}>Remove</button>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--text-light)', marginBottom: 8, display: 'block' }}>upload_file</span>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Drag and drop or browse to upload</p>
                    </>
                  )}
                  <input id="comp-image" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
