import { useEffect, useRef, useState } from 'react';
import { Download, FileCheck2, FileText, FolderUp, Search, ShieldCheck, Trash2, UploadCloud, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const sizeLabel = (bytes) => `${(Number(bytes || 0) / 1024 / 1024).toFixed(2)} MB`;
const emptyUpload = { client_id:'', application_id:'', document_type:'Passport', file:null };

export default function Documents() {
  const inputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [clients, setClients] = useState([]);
  const [applications, setApplications] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadForm, setUploadForm] = useState(emptyUpload);

  async function load() {
    try {
      const { data } = await api.get('/documents', { params: { q } });
      setDocuments(data.documents);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load documents.');
    }
  }

  async function loadClients() {
    try { const { data } = await api.get('/clients', { params:{ q:'' } }); setClients(data.clients || []); }
    catch (err) { setError(err.response?.data?.message || 'Could not load clients.'); }
  }

  async function loadApplications(clientId) {
    if (!clientId) { setApplications([]); return; }
    try { const { data } = await api.get(`/clients/${clientId}`); setApplications(data.applications || []); }
    catch (err) { setError(err.response?.data?.message || 'Could not load client applications.'); }
  }

  useEffect(() => { load(); loadClients(); }, []);
  useEffect(() => {
    const timer = setTimeout(() => load(), 250);
    return () => clearTimeout(timer);
  }, [q]);

  function chooseFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return setError('That file is larger than the 10 MB limit.');
    setUploadForm(current => ({ ...current, file }));
  }

  async function upload(e) {
    e.preventDefault();
    if (!uploadForm.client_id || !uploadForm.file) return setError('Choose a client and a document first.');
    setSaving(true); setError('');
    try {
      const form = new FormData();
      form.append('client_id', uploadForm.client_id);
      form.append('document_type', uploadForm.document_type);
      if (uploadForm.application_id) form.append('application_id', uploadForm.application_id);
      form.append('document', uploadForm.file);
      await api.post('/documents', form, { headers:{ 'Content-Type':'multipart/form-data' } });
      setUploadForm(emptyUpload); setApplications([]); setShowUpload(false); if (inputRef.current) inputRef.current.value='';
      setSuccess('Document uploaded securely to the client file.');
      await load();
      window.setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload document.');
    } finally { setSaving(false); }
  }

  async function downloadDocument(document) {
    try {
      const response = await api.get(`/documents/${document.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const anchor = window.document.createElement('a'); anchor.href = url; anchor.download = document.original_name; anchor.click(); URL.revokeObjectURL(url);
    } catch (err) { setError(err.response?.data?.message || 'Could not download document.'); }
  }

  async function deleteDocument(document) {
    if (!window.confirm(`Delete ${document.original_name}? This cannot be undone.`)) return;
    try { await api.delete(`/documents/${document.id}`); await load(); setSuccess('Document deleted.'); window.setTimeout(() => setSuccess(''), 3000); }
    catch (err) { setError(err.response?.data?.message || 'Could not delete document.'); }
  }

  return (
    <div>
      <div className="page-heading">
        <div><span className="eyebrow">DOCUMENT VAULT</span><h2>Client documents</h2><p>Every file stays attached to its client record and, when needed, to a specific application.</p></div>
        <div className="page-heading-actions"><div className="page-heading-badge"><ShieldCheck size={16} /> Authorized access only</div><button className="primary-btn" onClick={() => { setShowUpload(true); loadClients(); }}><UploadCloud size={17}/> Upload document</button></div>
      </div>
      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}
      <div className="toolbar"><div className="search-box"><Search size={18} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search client, client ID, document type or filename…" /></div><span className="muted">{documents.length} file{documents.length === 1 ? '' : 's'}</span></div>
      <div className="document-summary"><div><FileCheck2 size={18} /><strong>{documents.length}</strong><span>stored files</span></div><div><ShieldCheck size={18} /><strong>Private</strong><span>authenticated access</span></div><div><FileText size={18} /><strong>10 MB</strong><span>per-file limit</span></div></div>
      <div className="table-card"><table><thead><tr><th>Document</th><th>Client</th><th>Type</th><th>Size</th><th>Uploaded</th><th></th></tr></thead><tbody>
        {documents.map(document => <tr key={document.id}><td><span className="table-primary"><span className="table-avatar"><FileText size={16} /></span><span><strong>{document.original_name}</strong><small>Document ID {document.id}{document.application_id ? ` • App ${document.application_id}` : ''}</small></span></span></td><td><Link className="table-link" to={`/clients/${document.client_id}`}>{document.client_name}<small>{document.client_code}</small></Link></td><td><span className="role-badge">{document.document_type}</span></td><td>{sizeLabel(document.file_size)}</td><td>{new Date(document.created_at).toLocaleDateString('en-NG')}<small>{document.uploaded_by_name || '—'}</small></td><td><div className="row-actions"><button className="icon-btn" onClick={() => downloadDocument(document)} title="Download"><Download size={16} /></button><button className="icon-btn danger-icon" onClick={() => deleteDocument(document)} title="Delete"><Trash2 size={16} /></button></div></td></tr>)}
        {!documents.length && <tr><td colSpan="6" className="empty-cell">No documents found. Use “Upload document” or open a client profile to attach the first file.</td></tr>}
      </tbody></table></div>

      {showUpload && <div className="modal-backdrop"><div className="modal large">
        <div className="modal-head"><div><span className="eyebrow">PRIVATE FILE UPLOAD</span><h3>Attach document to client</h3></div><button className="icon-btn" onClick={() => setShowUpload(false)}><X size={17}/></button></div>
        <form onSubmit={upload} className="form-grid">
          <label className="span-2">Client<select required value={uploadForm.client_id} onChange={e => { setUploadForm({...uploadForm, client_id:e.target.value, application_id:''}); loadApplications(e.target.value); }}><option value="">Select client</option>{clients.map(client => <option key={client.id} value={client.id}>{client.client_code} • {client.full_name}</option>)}</select></label>
          <label>Document type<select value={uploadForm.document_type} onChange={e=>setUploadForm({...uploadForm,document_type:e.target.value})}><option>Passport</option><option>Passport Photograph</option><option>National ID</option><option>CV</option><option>Certificate</option><option>Driver's Licence</option><option>Employment Document</option><option>Visa Document</option><option>Other</option></select></label>
          <label>Related application<select value={uploadForm.application_id} onChange={e=>setUploadForm({...uploadForm,application_id:e.target.value})}><option value="">General client document</option>{applications.map(app=><option key={app.id} value={app.id}>{app.destination} • {app.service_type} • {app.status}</option>)}</select></label>
          <div className={`drop-zone ${dragging ? 'dragging' : ''} span-2`} onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);chooseFile(e.dataTransfer.files?.[0])}} onClick={()=>inputRef.current?.click()}>
            <input ref={inputRef} hidden type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e=>chooseFile(e.target.files?.[0] || null)}/>
            <div className="drop-icon"><UploadCloud size={24}/></div><strong>{uploadForm.file ? uploadForm.file.name : 'Drop the document here'}</strong><span>{uploadForm.file ? `${(uploadForm.file.size/1024/1024).toFixed(2)} MB ready to upload` : 'or click to browse from your computer'}</span><small>PDF, JPG, PNG or WEBP • maximum 10 MB</small>
          </div>
          <div className="modal-actions span-2"><button type="button" className="secondary-btn" onClick={()=>{setUploadForm(emptyUpload);setApplications([])}}>Clear</button><button className="primary-btn" disabled={saving || !uploadForm.client_id || !uploadForm.file}><FolderUp size={17}/>{saving ? 'Uploading…' : 'Upload securely'}</button></div>
        </form>
      </div></div>}
    </div>
  );
}
