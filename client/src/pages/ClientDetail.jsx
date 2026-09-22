import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, CheckCircle2, Download, ExternalLink, FileCheck2, FilePlus2,
  FolderUp, Plus, Printer, ReceiptText, ShieldCheck, Trash2, UploadCloud
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';

const defaultAppForm = { destination:'', service_type:'Employment', total_fee:'', opportunity_id:'', status:'New', notes:'' };
const defaultPaymentForm = { amount:'', payment_method:'Bank Transfer', transaction_reference:'', purpose:'', notes:'', application_id:'' };
const defaultDocForm = { document_type:'Passport', application_id:'', file:null };
const checklist = ['Passport', 'Passport Photograph', 'National ID', 'CV', 'Certificate'];

const money = value => `₦${Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export default function ClientDetail() {
  const { id } = useParams();
  const inputRef = useRef(null);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [appForm, setAppForm] = useState(defaultAppForm);
  const [paymentForm, setPaymentForm] = useState(defaultPaymentForm);
  const [docForm, setDocForm] = useState(defaultDocForm);

  async function load() {
    try {
      const { data: result } = await api.get(`/clients/${id}`);
      setData(result);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load client.');
    }
  }

  useEffect(() => { load(); }, [id]);

  function notify(message) {
    setSuccess(message);
    window.setTimeout(() => setSuccess(''), 3000);
  }

  async function addApp(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/applications', { ...appForm, total_fee:Number(appForm.total_fee || 0), client_id:id });
      setAppForm(defaultAppForm);
      await load();
      notify('Application created successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create application.');
    } finally { setSaving(false); }
  }

  async function addPayment(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const { data: result } = await api.post('/payments', { ...paymentForm, client_id:id });
      setPaymentForm(defaultPaymentForm);
      await load();
      setTab('payments');
      notify(`Payment recorded. Receipt ${result.payment.receipt_number} created.`);
      window.open(`/payments/${result.payment.id}/print`, '_blank');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not record payment.');
    } finally { setSaving(false); }
  }

  async function uploadDoc(e) {
    e.preventDefault();
    if (!docForm.file) return;
    setSaving(true); setError('');
    try {
      const form = new FormData();
      form.append('client_id', id);
      form.append('document_type', docForm.document_type);
      if (docForm.application_id) form.append('application_id', docForm.application_id);
      form.append('document', docForm.file);
      await api.post('/documents', form, { headers:{'Content-Type':'multipart/form-data'} });
      setDocForm(defaultDocForm);
      if (inputRef.current) inputRef.current.value = '';
      await load();
      notify('Document uploaded securely.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload document.');
    } finally { setSaving(false); }
  }

  async function downloadDocument(document) {
    try {
      const response = await api.get(`/documents/${document.id}/download`, { responseType:'blob' });
      const url = URL.createObjectURL(response.data);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = document.original_name;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not download document.');
    }
  }

  async function deleteDocument(document) {
    if (!window.confirm(`Delete ${document.original_name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/documents/${document.id}`);
      await load();
      notify('Document deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete document.');
    }
  }

  function chooseFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('That file is larger than the 10 MB limit.');
      return;
    }
    setDocForm(current => ({ ...current, file }));
  }

  if (!data) return <div className="empty-state">{error || 'Loading client…'}</div>;

  const uploadedTypes = new Set(data.documents.map(document => document.document_type));
  const totalPaid = data.payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const totalFees = data.applications.reduce((total, application) => total + Number(application.total_fee || 0), 0);
  const totalBalance = Math.max(totalFees - totalPaid, 0);

  return (
    <div className="client-detail-page">
      <Link to="/clients" className="back-link no-print"><ArrowLeft size={16}/> Back to clients</Link>

      <div className="profile-heading">
        <div>
          <div className="client-title-line"><span className="eyebrow">{data.client.client_code}</span><span className="private-pill"><ShieldCheck size={12}/> Private client file</span></div>
          <h2>{data.client.full_name}</h2>
          <p>{data.client.phone} {data.client.email ? `• ${data.client.email}` : ''}</p>
        </div>
        <div className="profile-actions no-print">
          <Link className="secondary-btn" to={`/payments?client=${data.client.id}`}><ReceiptText size={16}/> Payment history</Link>
          <button className="secondary-btn" onClick={() => window.print()}><Printer size={16}/> Print current view</button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <div className="tabs no-print">
        <button className={tab==='overview'?'active':''} onClick={()=>setTab('overview')}>Overview</button>
        <button className={tab==='documents'?'active':''} onClick={()=>setTab('documents')}>Documents ({data.documents.length})</button>
        <button className={tab==='applications'?'active':''} onClick={()=>setTab('applications')}>Applications ({data.applications.length})</button>
        <button className={tab==='payments'?'active':''} onClick={()=>setTab('payments')}>Payments ({data.payments.length})</button>
      </div>

      {tab === 'overview' && (
        <div className="detail-grid">
          <div className="panel">
            <div className="panel-title"><h3>Personal information</h3><span className="micro-badge"><ShieldCheck size={13}/> Protected record</span></div>
            <div className="info-grid">
              {[
                ['Phone',data.client.phone],['Email',data.client.email],['Date of birth',data.client.date_of_birth],['Gender',data.client.gender],
                ['State',data.client.state],['Nationality',data.client.nationality],['Passport',data.client.passport_number],['Passport expiry',data.client.passport_expiry_date]
              ].map(([label,value])=><div key={label}><span>{label}</span><strong>{value || '—'}</strong></div>)}
            </div>
          </div>
          <div className="panel action-panel">
            <div className="panel-title"><h3>Client snapshot</h3><span className="count-chip">{totalBalance > 0 ? `${money(totalBalance)} due` : `${money(totalPaid)} paid`}</span></div>
            <div className="snapshot-grid">
              <div><strong>{data.applications.length}</strong><span>Applications</span></div>
              <div><strong>{data.documents.length}</strong><span>Documents</span></div>
              <div><strong>{data.payments.length}</strong><span>Payments</span></div>
              <div><strong>{data.documents.filter(d => checklist.includes(d.document_type)).length}/{checklist.length}</strong><span>Core docs</span></div>
              <div className="snapshot-finance"><strong>{money(totalFees)}</strong><span>Agreed fees</span></div>
              <div className="snapshot-finance due"><strong>{money(totalBalance)}</strong><span>Remaining</span></div>
            </div>
            <div className="quick-actions">
              <button onClick={()=>setTab('documents')}><FilePlus2 size={18}/> Upload document</button>
              <button onClick={()=>setTab('applications')}><Plus size={18}/> New application</button>
              <button onClick={()=>setTab('payments')}><ReceiptText size={18}/> Record payment</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'documents' && (
        <div className="detail-grid">
          <div className="panel upload-panel">
            <div className="panel-title">
              <div><span className="eyebrow">PRIVATE DOCUMENTS</span><h3>Secure document upload</h3></div>
              <span className="micro-badge"><ShieldCheck size={13}/> Authorized staff</span>
            </div>
            <p className="panel-intro">Store passports, IDs, certificates and application documents in this client’s protected file.</p>
            <form onSubmit={uploadDoc}>
              <div className="form-grid">
                <label>Document type<select value={docForm.document_type} onChange={e=>setDocForm({...docForm,document_type:e.target.value})}>
                  <option>Passport</option><option>Passport Photograph</option><option>National ID</option><option>CV</option><option>Certificate</option><option>Driver's Licence</option><option>Employment Document</option><option>Visa Document</option><option>Other</option>
                </select></label>
                <label>Related application
                  <select value={docForm.application_id} onChange={e=>setDocForm({...docForm,application_id:e.target.value})}>
                    <option value="">General client document</option>
                    {data.applications.map(application => <option key={application.id} value={application.id}>{application.destination} • {application.service_type} • {application.status}</option>)}
                  </select>
                </label>
              </div>
              <div className={`drop-zone ${dragging ? 'dragging' : ''}`} onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);chooseFile(e.dataTransfer.files?.[0])}} onClick={()=>inputRef.current?.click()}>
                <input ref={inputRef} type="file" hidden accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e=>chooseFile(e.target.files?.[0] || null)}/>
                <div className="drop-icon"><UploadCloud size={23}/></div>
                <strong>{docForm.file ? docForm.file.name : 'Drop the document here'}</strong>
                <span>{docForm.file ? `${(docForm.file.size/1024/1024).toFixed(2)} MB ready to upload` : 'or click to browse from your computer'}</span>
                <small>PDF, JPG, PNG or WEBP • maximum 10 MB</small>
              </div>
              <div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>{setDocForm(defaultDocForm);if(inputRef.current)inputRef.current.value=''}}>Clear</button><button className="primary-btn" disabled={!docForm.file || saving}><FolderUp size={17}/> {saving ? 'Uploading…' : 'Upload securely'}</button></div>
            </form>

            <div className="checklist-block">
              <div className="panel-title"><div><span className="eyebrow">DOCUMENT CHECK</span><h3>Core document checklist</h3></div></div>
              <div className="checklist-grid">{checklist.map(type => <div key={type} className={uploadedTypes.has(type) ? 'check-item complete' : 'check-item'}>{uploadedTypes.has(type) ? <CheckCircle2 size={15}/> : <span className="check-dot"/>}<span>{type}</span></div>)}</div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title"><div><span className="eyebrow">DOCUMENT VAULT</span><h3>Client documents</h3></div><span className="count-chip">{data.documents.length} files</span></div>
            <div className="document-list">
              {data.documents.map(document => (
                <div className="document-row" key={document.id}>
                  <div className="document-icon"><FilePlus2 size={16}/></div>
                  <div className="document-copy"><strong>{document.document_type}</strong><span>{document.original_name} • {(Number(document.file_size)/1024/1024).toFixed(2)} MB</span><small>Uploaded by {document.uploaded_by_name || 'staff'} • {new Date(document.created_at).toLocaleDateString('en-NG')}</small></div>
                  <div className="row-actions"><button className="icon-btn" onClick={()=>downloadDocument(document)} title="Download document"><Download size={16}/></button><button className="icon-btn danger-icon" onClick={()=>deleteDocument(document)} title="Delete document"><Trash2 size={16}/></button></div>
                </div>
              ))}
              {!data.documents.length && <div className="empty-cell">No documents uploaded yet.</div>}
            </div>
          </div>
        </div>
      )}

      {tab === 'applications' && (
        <div className="detail-grid">
          <div className="panel">
            <div className="panel-title"><div><span className="eyebrow">APPLICATIONS</span><h3>Create application</h3></div></div>
            <form className="form-grid" onSubmit={addApp}>
              <label>Destination<input required value={appForm.destination} onChange={e=>setAppForm({...appForm,destination:e.target.value})} placeholder="Poland"/></label>
              <label>Service type<select value={appForm.service_type} onChange={e=>setAppForm({...appForm,service_type:e.target.value})}><option>Employment</option><option>Tourism</option><option>Visit</option><option>Relocation</option><option>Other</option></select></label>
              <label>Agreed service fee (NGN)<input type="number" min="0" step="0.01" value={appForm.total_fee} onChange={e=>setAppForm({...appForm,total_fee:e.target.value})} placeholder="650000"/></label>
              <label>Opportunity ID<input value={appForm.opportunity_id} onChange={e=>setAppForm({...appForm,opportunity_id:e.target.value})} placeholder="PL-DR-001"/></label>
              <label>Status<select value={appForm.status} onChange={e=>setAppForm({...appForm,status:e.target.value})}><option>New</option><option>Documents Pending</option><option>Processing</option><option>Employer Review</option><option>Visa Process</option><option>Completed</option><option>Cancelled</option></select></label>
              <label className="span-2">Notes<textarea value={appForm.notes} onChange={e=>setAppForm({...appForm,notes:e.target.value})}/></label>
              <div className="span-2"><button className="primary-btn" disabled={saving}><Plus size={17}/> {saving ? 'Saving…' : 'Create application'}</button></div>
            </form>
          </div>
          <div className="panel"><div className="panel-title"><div><span className="eyebrow">JOURNEYS</span><h3>Client applications</h3></div><span className="count-chip">{data.applications.length}</span></div><div className="application-list">
            {data.applications.map(application=>{ const paid = Number(application.payment_total || 0); const fee = Number(application.total_fee || 0); const balance = Math.max(fee - paid, 0); return <div className="application-row" key={application.id}><div><strong>{application.destination} • {application.service_type}</strong><span>{application.opportunity_id || 'No opportunity ID'} • Assigned to {application.assigned_to_name || 'staff'}</span><small>Fee {money(fee)} • Paid {money(paid)} • Balance {money(balance)}</small></div><span className="status-badge">{balance > 0 && fee > 0 ? 'Balance due' : fee > 0 ? 'Paid in full' : application.status}</span></div>})}
            {!data.applications.length && <div className="empty-cell">No applications yet.</div>}
          </div></div>
        </div>
      )}

      {tab === 'payments' && (
        <div className="detail-grid">
          <div className="panel">
            <div className="panel-title"><div><span className="eyebrow">PAYMENTS</span><h3>Record client payment</h3></div><span className="micro-badge"><CheckCircle2 size={13}/> Partial payments supported</span></div>
            <div className="client-finance-strip"><div><span>Agreed fees</span><strong>{money(totalFees)}</strong></div><div><span>Paid so far</span><strong>{money(totalPaid)}</strong></div><div><span>Remaining</span><strong className={totalBalance > 0 ? 'due-text' : 'paid-text'}>{money(totalBalance)}</strong></div></div>
            <form className="form-grid" onSubmit={addPayment}>
              <label>Amount (NGN)<input type="number" min="1" step="0.01" required value={paymentForm.amount} onChange={e=>setPaymentForm({...paymentForm,amount:e.target.value})} placeholder="250000"/></label>
              <label>Payment method<select value={paymentForm.payment_method} onChange={e=>setPaymentForm({...paymentForm,payment_method:e.target.value})}><option>Bank Transfer</option><option>Cash</option><option>POS</option><option>Card</option><option>Other</option></select></label>
              <label>Transaction reference<input value={paymentForm.transaction_reference} onChange={e=>setPaymentForm({...paymentForm,transaction_reference:e.target.value})} placeholder="Bank/POS reference"/></label>
              <label>Related application<select value={paymentForm.application_id} onChange={e=>setPaymentForm({...paymentForm,application_id:e.target.value})}><option value="">General service</option>{data.applications.map(application=><option key={application.id} value={application.id}>{application.destination} • {application.service_type}</option>)}</select></label>
              <label className="span-2">Purpose<input required value={paymentForm.purpose} onChange={e=>setPaymentForm({...paymentForm,purpose:e.target.value})} placeholder="Travel consultation"/></label>
              <label className="span-2">Notes<textarea value={paymentForm.notes} onChange={e=>setPaymentForm({...paymentForm,notes:e.target.value})}/></label>
              <div className="span-2"><button className="primary-btn" disabled={saving}><ReceiptText size={17}/> {saving ? 'Recording…' : 'Record & print receipt'}</button></div>
            </form>
          </div>
          <div className="panel"><div className="panel-title"><div><span className="eyebrow">PAYMENT HISTORY</span><h3>Client transactions</h3></div><span className="count-chip">{money(totalPaid)}</span></div><div className="payment-list">
            {data.payments.map(payment=><div className="payment-row" key={payment.id}><div><strong>{money(payment.amount)}</strong><span>{payment.purpose} • {payment.payment_method}</span><small>{payment.payment_code || `ASY-PAY-${new Date(payment.created_at).getFullYear()}-${String(payment.id).padStart(6,'0')}`} • {payment.receipt_number}</small></div><Link className="icon-btn" to={`/payments/${payment.id}/print`} target="_blank" title="Print receipt"><Printer size={17}/></Link></div>)}
            {!data.payments.length && <div className="empty-cell">No payments recorded yet.</div>}
          </div></div>
        </div>
      )}
    </div>
  );
}
