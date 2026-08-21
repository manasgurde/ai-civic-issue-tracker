import { useState } from 'react';

export default function ComplaintForm({ onComplaintAdded }: { onComplaintAdded: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        body: JSON.stringify({ title, description, category })
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
