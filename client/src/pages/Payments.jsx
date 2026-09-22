import { useEffect, useState } from 'react';
import { ArrowRight, CreditCard, FileText, Printer, ReceiptText, Search, WalletCards, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

const money = (amount) => `₦${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
const emptyForm = { client_id:'', application_id:'', amount:'', payment_method:'Bank Transfer', transaction_reference:'', purpose:'', notes:'' };

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [applications, setApplications] = useState([]);
  const [financials, setFinancials] = useState({ totalFee:0, totalPaid:0, balance:0 });
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get('client') || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    try { const { data } = await api.get('/payments', { params: { q } }); setPayments(data.payments); setError(''); }
    catch (err) { setError(err.response?.data?.message || 'Could not load payments.'); }
  }
  async function loadClients() {
    try { const { data } = await api.get('/clients', { params:{ q:'' } }); setClients(data.clients || []); }
    catch (err) { setError(err.response?.data?.message || 'Could not load clients.'); }
  }
  async function loadClientFinancials(clientId) {
    if (!clientId) { setApplications([]); setFinancials({ totalFee:0,totalPaid:0,balance:0 }); return; }
    try {
      const { data } = await api.get(`/clients/${clientId}`);
      setApplications(data.applications || []);
      const selectedPayments = data.payments || [];
      const totalPaid = selectedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const totalFee = (data.applications || []).reduce((sum, application) => sum + Number(application.total_fee || 0), 0);
      setFinancials({ totalFee, totalPaid, balance:Math.max(totalFee-totalPaid,0) });
    } catch (err) { setError(err.response?.data?.message || 'Could not load client payment details.'); }
  }

  useEffect(() => { load(); loadClients(); }, []);
  useEffect(() => { const timer = setTimeout(() => load(), 250); return () => clearTimeout(timer); }, [q]);

  async function recordPayment(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const { data } = await api.post('/payments', { ...form, client_id:form.client_id });
      setForm(emptyForm); setApplications([]); setFinancials({ totalFee:0,totalPaid:0,balance:0 }); setShowForm(false); setSuccess(`Payment recorded. ${data.payment.receipt_number} is ready to print.`); await load();
      window.setTimeout(() => setSuccess(''), 4000);
      window.open(`/payments/${data.payment.id}/print`, '_blank');
    } catch (err) { setError(err.response?.data?.message || 'Could not record payment.'); }
    finally { setSaving(false); }
  }

  const totalRecorded = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const partialCount = new Set(payments.filter(p => Number(p.application_total_fee || 0) > 0 && Number(p.application_balance || 0) > 0).map(p => p.client_id)).size;

  return (
    <div>
      <div className="page-heading"><div><span className="eyebrow">FINANCE DESK</span><h2>Payments & receipts</h2><p>Record deposits, track partial payments and print a receipt for every transaction.</p></div><div className="page-heading-actions"><div className="page-heading-badge"><WalletCards size={16} /> Client-linked finance</div><button className="primary-btn" onClick={() => { setShowForm(true); loadClients(); }}><ReceiptText size={17}/> Record payment</button></div></div>
      {error && <div className="error-box">{error}</div>}{success && <div className="success-box">{success}</div>}
      <div className="toolbar"><div className="search-box"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search receipt, client, client ID, purpose or reference…"/></div><span className="muted">{payments.length} record{payments.length === 1 ? '' : 's'}</span></div>
      <div className="finance-summary-grid">
        <div><span>Displayed payments</span><strong>{money(totalRecorded)}</strong><small>total recorded on this view</small></div>
        <div><span>Client-linked receipts</span><strong>{payments.length}</strong><small>each carries a Payment ID</small></div>
        <div><span>Partial-payment clients</span><strong>{partialCount}</strong><small>applications with balance remaining</small></div>
      </div>
      <div className="table-card"><table><thead><tr><th>Receipt</th><th>Client</th><th>Purpose</th><th>Amount</th><th>Application balance</th><th>Method</th><th>Date</th><th></th></tr></thead><tbody>
        {payments.map(payment => { const fee=Number(payment.application_total_fee||0); const bal=Number(payment.application_balance||0); return <tr key={payment.id}><td><span className="table-primary"><span className="table-avatar"><ReceiptText size={16}/></span><span><strong>{payment.payment_code || `ASY-PAY-${new Date(payment.created_at).getFullYear()}-${String(payment.id).padStart(6,'0')}`}</strong><small>{payment.receipt_number} • Payment ID {payment.id}</small></span></span></td><td><Link className="table-primary" to={`/clients/${payment.client_id}`}><span><strong>{payment.client_name}</strong><small>{payment.client_code}</small></span></Link></td><td>{payment.purpose}<small>{payment.destination ? `${payment.destination} • ${payment.service_type}` : 'General service'}</small></td><td><strong className="money-value">{money(payment.amount)}</strong></td><td>{fee > 0 ? <span className={bal > 0 ? 'balance-badge open' : 'balance-badge paid'}>{bal > 0 ? `${money(bal)} remaining` : 'Paid in full'}</span> : <span className="muted">General service</span>}</td><td>{payment.payment_method}<small>{payment.transaction_reference || 'No transaction reference'}</small></td><td>{new Date(payment.created_at).toLocaleDateString('en-NG')}<small>{payment.received_by_name || '—'}</small></td><td><Link className="secondary-btn compact print-row-btn" to={`/payments/${payment.id}/print`} target="_blank" title="Print receipt"><Printer size={15}/> Print</Link></td></tr>; })}
        {!payments.length && <tr><td colSpan="8" className="empty-cell">No payment records found.</td></tr>}
      </tbody></table></div>

      {showForm && <div className="modal-backdrop"><div className="modal large">
        <div className="modal-head"><div><span className="eyebrow">NEW TRANSACTION</span><h3>Record client payment</h3></div><button className="icon-btn" onClick={()=>setShowForm(false)}><X size={17}/></button></div>
        <form className="form-grid" onSubmit={recordPayment}>
          <label className="span-2">Client<select required value={form.client_id} onChange={e=>{setForm({...form,client_id:e.target.value,application_id:''});loadClientFinancials(e.target.value)}}><option value="">Select client</option>{clients.map(client=><option key={client.id} value={client.id}>{client.client_code} • {client.full_name}</option>)}</select></label>
          <label className="span-2">Related application<select value={form.application_id} onChange={e=>setForm({...form,application_id:e.target.value})}><option value="">General service</option>{applications.map(app=>{const paid=(app.payment_total||0);const bal=Math.max(Number(app.total_fee||0)-Number(paid),0);return <option key={app.id} value={app.id}>{app.destination} • {app.service_type} • Fee {money(app.total_fee)} • Balance {money(bal)}</option>})}</select></label>
          {form.application_id && <div className="payment-live-summary span-2"><div><span>Agreed fee</span><strong>{money((applications.find(a=>String(a.id)===String(form.application_id))||{}).total_fee)}</strong></div><div><span>Client balance</span><strong>{money(Math.max(Number((applications.find(a=>String(a.id)===String(form.application_id))||{}).total_fee||0) - Number((applications.find(a=>String(a.id)===String(form.application_id))||{}).payment_total||0),0))}</strong></div><div><span>Payment mode</span><strong>Partial or full</strong></div></div>}
          <label>Amount (NGN)<input type="number" min="1" step="0.01" required value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="250000"/></label>
          <label>Payment method<select value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})}><option>Bank Transfer</option><option>Cash</option><option>POS</option><option>Card</option><option>Other</option></select></label>
          <label>Transaction reference<input value={form.transaction_reference} onChange={e=>setForm({...form,transaction_reference:e.target.value})} placeholder="Bank/POS reference"/></label>
          <label>Purpose<input required value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})} placeholder="Poland warehouse application"/></label>
          <label className="span-2">Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional note about this installment…"/></label>
          <div className="partial-payment-hint span-2"><CreditCard size={17}/><div><strong>Installments supported</strong><span>Record each payment separately. The application balance updates automatically and every installment receives its own receipt and Payment ID.</span></div></div>
          <div className="modal-actions span-2"><button type="button" className="secondary-btn" onClick={()=>setShowForm(false)}>Cancel</button><button className="primary-btn" disabled={saving}>{saving ? 'Recording…' : 'Record & print receipt'}<ArrowRight size={16}/></button></div>
        </form>
      </div></div>}
    </div>
  );
}
