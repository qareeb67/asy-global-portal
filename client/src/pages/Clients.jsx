import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, UserRound } from 'lucide-react';
import { api } from '../services/api';

const emptyForm = { full_name:'', date_of_birth:'', gender:'', phone:'', email:'', address:'', state:'', nationality:'Nigerian', passport_number:'', passport_issue_date:'', passport_expiry_date:'', notes:'' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function load() { const {data} = await api.get('/clients', { params: { q } }); setClients(data.clients); }
  useEffect(() => { load().catch(() => setError('Could not load clients.')); }, []);
  useEffect(() => { const t = setTimeout(() => load().catch(() => {}), 250); return () => clearTimeout(t); }, [q]);

  async function create(e) {
    e.preventDefault(); setSaving(true); setError('');
    try { const { data } = await api.post('/clients', form); setForm(emptyForm); setShowForm(false); await load(); navigate(`/clients/${data.client.id}`); } 
    catch (err) { setError(err.response?.data?.message || 'Could not create client.'); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="page-heading"><div><span className="eyebrow">CLIENTS</span><h2>Client workspace</h2><p>Search by client ID, name, phone or passport.</p></div><button className="primary-btn" onClick={() => setShowForm(true)}><Plus size={17}/> New client</button></div>
      {error && <div className="error-box">{error}</div>}
      <div className="toolbar"><div className="search-box"><Search size={18}/><input placeholder="Search clients…" value={q} onChange={e => setQ(e.target.value)}/></div><span className="muted">{clients.length} result{clients.length === 1 ? '' : 's'}</span></div>
      <div className="table-card"><table><thead><tr><th>Client</th><th>Contact</th><th>Applications</th><th>Documents</th><th>Created</th></tr></thead><tbody>
        {clients.map(c => <tr key={c.id}><td><Link className="table-primary" to={`/clients/${c.id}`}><span className="table-avatar"><UserRound size={16}/></span><span><strong>{c.full_name}</strong><small>{c.client_code}</small></span></Link></td><td>{c.phone}<small>{c.email || 'No email'}</small></td><td>{c.application_count}</td><td>{c.document_count}</td><td>{new Date(c.created_at).toLocaleDateString()}</td></tr>)}
        {!clients.length && <tr><td colSpan="5" className="empty-cell">No clients found. Register the first client to get started.</td></tr>}
      </tbody></table></div>
      {showForm && <div className="modal-backdrop"><div className="modal large"><div className="modal-head"><div><span className="eyebrow">NEW CLIENT</span><h3>Register client</h3></div><button className="icon-btn" onClick={() => setShowForm(false)}>×</button></div><form onSubmit={create} className="form-grid">
        <label className="span-2">Full name<input required value={form.full_name} onChange={e => setForm({...form, full_name:e.target.value})}/></label>
        <label>Phone<input required value={form.phone} onChange={e => setForm({...form, phone:e.target.value})}/></label>
        <label>Email<input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})}/></label>
        <label>Date of birth<input type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth:e.target.value})}/></label>
        <label>Gender<select value={form.gender} onChange={e => setForm({...form, gender:e.target.value})}><option value="">Select</option><option>Male</option><option>Female</option></select></label>
        <label>State<input value={form.state} onChange={e => setForm({...form, state:e.target.value})}/></label>
        <label>Nationality<input value={form.nationality} onChange={e => setForm({...form, nationality:e.target.value})}/></label>
        <label>Passport number<input value={form.passport_number} onChange={e => setForm({...form, passport_number:e.target.value})}/></label>
        <label>Passport issue date<input type="date" value={form.passport_issue_date} onChange={e => setForm({...form, passport_issue_date:e.target.value})}/></label>
        <label>Passport expiry date<input type="date" value={form.passport_expiry_date} onChange={e => setForm({...form, passport_expiry_date:e.target.value})}/></label>
        <label className="span-2">Address<textarea value={form.address} onChange={e => setForm({...form, address:e.target.value})}/></label>
        <label className="span-2">Notes<textarea value={form.notes} onChange={e => setForm({...form, notes:e.target.value})}/></label>
        <div className="modal-actions span-2"><button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-btn" disabled={saving}>{saving ? 'Saving…' : 'Create client'}</button></div>
      </form></div></div>}
    </div>
  );
}
