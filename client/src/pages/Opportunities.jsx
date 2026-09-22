import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, CheckCircle2, Clock3, Edit3, Globe2, MapPinned, Plus, Search, Trash2, XCircle } from 'lucide-react';
import { api } from '../services/api';

const blank = { title:'', country:'', category:'Employment', service_type:'', opportunity_code:'', status:'Available', partner_name:'', summary:'', requirements:'', featured:false };

const statusMeta = {
  Available: { icon: CheckCircle2, className: 'available' },
  'Not Available': { icon: XCircle, className: 'unavailable' },
  'Coming Soon': { icon: Clock3, className: 'coming' },
  Paused: { icon: Clock3, className: 'paused' }
};

export default function Opportunities() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const { data } = await api.get('/opportunities', { params: { q, category, status } });
      setItems(data.opportunities || []); setError('');
    } catch (err) { setError(err.response?.data?.message || 'Could not load opportunities.'); }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(() => load(), 250); return () => clearTimeout(t); }, [q, category, status]);

  const available = useMemo(() => items.filter(i => i.status === 'Available').length, [items]);
  const employment = useMemo(() => items.filter(i => i.category === 'Employment' && i.status === 'Available').length, [items]);

  function openCreate() { setEditing(null); setForm(blank); setShowForm(true); }
  function openEdit(item) { setEditing(item); setForm({ ...item, featured: Boolean(item.featured) }); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(null); setForm(blank); }

  async function save(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await api.patch(`/opportunities/${editing.id}`, form);
      else await api.post('/opportunities', form);
      closeForm(); await load();
    } catch (err) { setError(err.response?.data?.message || 'Could not save opportunity.'); }
    finally { setSaving(false); }
  }

  async function remove(item) {
    if (!window.confirm(`Delete ${item.title}?`)) return;
    try { await api.delete(`/opportunities/${item.id}`); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Could not delete opportunity.'); }
  }

  return (
    <div>
      <div className="page-heading">
        <div><span className="eyebrow">TRAVEL DESK</span><h2>Opportunities & resources</h2><p>One internal library for the work offers, visa resources, tours and travel services your company currently has.</p></div>
        <button className="primary-btn" onClick={openCreate}><Plus size={17}/> Add opportunity</button>
      </div>
      {error && <div className="error-box">{error}</div>}

      <div className="desk-metrics">
        <div><div className="metric-icon"><Globe2 size={18}/></div><span>Listed resources</span><strong>{items.length}</strong></div>
        <div><div className="metric-icon"><CheckCircle2 size={18}/></div><span>Currently available</span><strong>{available}</strong></div>
        <div><div className="metric-icon"><BriefcaseBusiness size={18}/></div><span>Active job offers</span><strong>{employment}</strong></div>
      </div>

      <div className="travel-note-card">
        <div className="travel-note-icon"><MapPinned size={19}/></div>
        <div><strong>Internal source of truth</strong><p>When a status changes here, staff know what is currently available before an advert is published. Keep employer and visa information accurate and up to date.</p></div>
      </div>

      <div className="toolbar opportunity-toolbar">
        <div className="search-box"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search country, job, visa or opportunity ID…" /></div>
        <select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option><option>Employment</option><option>Visa</option><option>Travel</option><option>Tour</option><option>Mobility</option><option>Other</option></select>
        <select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All status</option><option>Available</option><option>Not Available</option><option>Coming Soon</option><option>Paused</option></select>
      </div>

      <div className="opportunity-grid">
        {items.map(item => {
          const meta = statusMeta[item.status] || statusMeta.Available; const StatusIcon = meta.icon;
          return <article className="opportunity-card" key={item.id}>
            <div className="opportunity-art"><div className="opportunity-glow"></div><Globe2 size={64}/><span>{item.country}</span></div>
            <div className="opportunity-card-body">
              <div className="opportunity-top"><span className="category-chip">{item.category}</span><span className={`availability-pill ${meta.className}`}><StatusIcon size={13}/>{item.status}</span></div>
              <h3>{item.title}</h3>
              <p className="opportunity-code">{item.opportunity_code || 'No opportunity ID'} {item.service_type ? `• ${item.service_type}` : ''}</p>
              {item.summary && <p>{item.summary}</p>}
              {item.partner_name && <div className="opportunity-partner">Partner / employer: <strong>{item.partner_name}</strong></div>}
              {item.requirements && <div className="opportunity-requirements"><span>Requirements</span><p>{item.requirements}</p></div>}
              <div className="opportunity-actions"><button className="secondary-btn compact" onClick={()=>openEdit(item)}><Edit3 size={15}/> Edit</button><button className="icon-btn danger-icon" onClick={()=>remove(item)} title="Delete"><Trash2 size={16}/></button></div>
            </div>
          </article>;
        })}
        {!items.length && <div className="empty-state-card"><Globe2 size={27}/><h3>No opportunities yet</h3><p>Add the first job, visa resource, tour or travel service so the whole team sees the same information.</p><button className="primary-btn" onClick={openCreate}><Plus size={16}/> Add first resource</button></div>}
      </div>

      {showForm && <div className="modal-backdrop"><div className="modal large opportunity-modal">
        <div className="modal-head"><div><span className="eyebrow">TRAVEL DESK RECORD</span><h3>{editing ? 'Update opportunity' : 'Add opportunity'}</h3></div><button className="icon-btn" onClick={closeForm}>×</button></div>
        <form onSubmit={save} className="form-grid">
          <label className="span-2">Title<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Poland warehouse opportunity"/></label>
          <label>Country<input required value={form.country} onChange={e=>setForm({...form,country:e.target.value})} placeholder="Poland"/></label>
          <label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>Employment</option><option>Visa</option><option>Travel</option><option>Tour</option><option>Mobility</option><option>Other</option></select></label>
          <label>Service type<input value={form.service_type || ''} onChange={e=>setForm({...form,service_type:e.target.value})} placeholder="Warehouse • Delivery • Visit visa"/></label>
          <label>Opportunity ID<input value={form.opportunity_code || ''} onChange={e=>setForm({...form,opportunity_code:e.target.value})} placeholder="PL-WH-001"/></label>
          <label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Available</option><option>Not Available</option><option>Coming Soon</option><option>Paused</option></select></label>
          <label>Partner / employer<input value={form.partner_name || ''} onChange={e=>setForm({...form,partner_name:e.target.value})} placeholder="Company or trusted partner"/></label>
          <label className="span-2">Summary<textarea value={form.summary || ''} onChange={e=>setForm({...form,summary:e.target.value})} placeholder="Short internal description of the opportunity or resource."/></label>
          <label className="span-2">Requirements<textarea value={form.requirements || ''} onChange={e=>setForm({...form,requirements:e.target.value})} placeholder="Passport, experience, licence, age range, etc."/></label>
          <label className="check-control span-2"><input type="checkbox" checked={Boolean(form.featured)} onChange={e=>setForm({...form,featured:e.target.checked})}/><span>Feature this resource near the top of the travel desk.</span></label>
          <div className="modal-actions span-2"><button type="button" className="secondary-btn" onClick={closeForm}>Cancel</button><button className="primary-btn" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add resource'}</button></div>
        </form>
      </div></div>}
    </div>
  );
}
