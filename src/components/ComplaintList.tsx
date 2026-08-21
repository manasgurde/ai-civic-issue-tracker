import { useEffect, useState } from 'react';

export default function ComplaintList({ keyCounter }: { keyCounter: number }) {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, [keyCounter]);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const url = payload.role === 'admin' ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/complaints/` : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/complaints/my`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch complaints');
      const data = await res.json();
      setComplaints(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`}/complaints/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchComplaints();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h3 style={{ borderBottom: '2px solid #ccc', paddingBottom: 10 }}>Complaint History</h3>
      {complaints.length === 0 && <p style={{ fontStyle: 'italic', color: '#666' }}>No complaints found.</p>}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        {complaints.map(c => (
          <div key={c.id} style={{ border: '1px solid #ddd', background: 'white', padding: 15, borderRadius: 8, display: 'flex', gap: 20 }}>
            {c.image_url ? (
              <img src={c.image_url} alt="Complaint" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4, background: '#f5f5f5' }} />
            ) : (
              <div style={{ width: 100, height: 100, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12 }}>No Image</div>
            )}
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: 18 }}>{c.title}</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#555', lineHeight: 1.4 }}>{c.description}</p>
              
              <div style={{ display: 'flex', gap: 15, fontSize: '13px', alignItems: 'center' }}>
                <span style={{ background: '#eee', padding: '4px 8px', borderRadius: 4 }}>{c.category}</span>
                <span style={{ fontWeight: 'bold', color: c.status === 'resolved' ? 'green' : c.status === 'in_progress' ? 'orange' : '#666' }}>
                  Status: {c.status}
                </span>
              </div>

              <div style={{ marginTop: 15, paddingTop: 10, borderTop: '1px dashed #eee', fontSize: 13 }}>
                Update Status: 
                <select value={c.status} onChange={e => handleStatusUpdate(c.id, e.target.value)} style={{ marginLeft: 10, padding: '4px 8px', borderRadius: 4 }}>
                  <option value="submitted">Submitted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
