import { useState } from 'react';

export default function ComplaintForm({ onComplaintAdded }: { onComplaintAdded: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [address, setAddress] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setAddress(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {
          setError('Could not get location.');
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not logged in');

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/complaints/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, category, latitude, longitude, address })
      });

      if (!res.ok) throw new Error('Failed to create complaint');
      const complaint = await res.json();

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const imgRes = await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}`}/complaints/${complaint.id}/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        if (!imgRes.ok) throw new Error('Failed to upload image');
      }

      setTitle('');
      setDescription('');
      setCategory('');
      setFile(null);
      setLatitude(undefined);
      setLongitude(undefined);
      setAddress('');
      onComplaintAdded();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, border: '1px solid #ccc', borderRadius: 8, marginBottom: 20, background: 'white' }}>
      <h3 style={{ marginTop: 0 }}>Submit a Complaint</h3>
      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input 
          placeholder="Title" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          required 
          style={{ padding: 8 }}
        />
        <textarea 
          placeholder="Description" 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          required 
          style={{ padding: 8, height: 80 }}
        />
        <select value={category} onChange={e => setCategory(e.target.value)} required style={{ padding: 8 }}>
          <option value="" disabled>Select Category</option>
          <option value="Roads">Roads</option>
          <option value="Garbage">Garbage</option>
          <option value="Water">Water</option>
          <option value="Other">Other</option>
        </select>
        <div style={{ display: 'flex', gap: 10 }}>
          <input 
            placeholder="Address or Location" 
            value={address} 
            onChange={e => setAddress(e.target.value)} 
            style={{ padding: 8, flex: 1 }}
          />
          <button type="button" onClick={handleGetLocation} style={{ padding: '8px 12px', background: '#e0e0e0', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle' }}>my_location</span>
          </button>
        </div>
        <input 
          type="file" 
          accept="image/*"
          onChange={e => setFile(e.target.files ? e.target.files[0] : null)} 
          style={{ padding: 8 }}
        />
        <button type="submit" disabled={loading} style={{ padding: '10px', background: '#0066cc', color: 'white', border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
          {loading ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>
    </div>
  );
}
