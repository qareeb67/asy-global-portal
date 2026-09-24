import { useEffect, useState } from 'react';
import { Printer as PrinterIcon } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import BrandLogo from '../components/BrandLogo.jsx';

const money = value => `₦${Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export default function ReceiptPrint() {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/payments/${id}`)
      .then(({ data }) => setPayment(data.payment))
      .catch(err => setError(err.response?.data?.message || 'Unable to load receipt.'));
  }, [id]);

  useEffect(() => {
    if (payment) window.setTimeout(() => window.print(), 250);
  }, [payment]);

  if (!payment) return <div className="print-shell"><div className="print-paper">{error || 'Loading receipt…'}</div></div>;

  return (
    <div className="print-shell">
      <div className="print-paper receipt">
        <div className="print-brand">
          <BrandLogo showPartnership />
        </div>
        <div className="receipt-head"><div><span className="eyebrow">PAYMENT RECEIPT</span><h1>{payment.receipt_number}</h1></div><div className="receipt-amount">₦{Number(payment.amount).toLocaleString('en-NG',{minimumFractionDigits:2})}</div></div>
        <div className="receipt-grid">
          <div><span>Payment ID</span><strong>{payment.payment_code || `ASY-PAY-${new Date(payment.created_at).getFullYear()}-${String(payment.id).padStart(6,'0')}`}</strong></div><div><span>Receipt</span><strong>{payment.receipt_number}</strong></div><div><span>Client</span><strong>{payment.client_name}</strong></div>
          <div><span>Client ID</span><strong>{payment.client_code}</strong></div>
          <div><span>Purpose</span><strong>{payment.purpose}</strong></div>
          <div><span>Payment method</span><strong>{payment.payment_method}</strong></div>
          <div><span>Transaction reference</span><strong>{payment.transaction_reference || '—'}</strong></div>
          <div><span>Date</span><strong>{new Date(payment.created_at).toLocaleString('en-NG')}</strong></div>
          <div><span>Received by</span><strong>{payment.received_by_name || '—'}</strong></div>
          <div><span>Application</span><strong>{payment.destination ? `${payment.destination} • ${payment.service_type}` : '—'}</strong></div>
          {Number(payment.application_total_fee || 0) > 0 && <div><span>Agreed service fee</span><strong>{money(payment.application_total_fee)}</strong></div>}
          {Number(payment.application_total_fee || 0) > 0 && <div><span>Previous payments</span><strong>{money(payment.previous_paid)}</strong></div>}
          {Number(payment.application_total_fee || 0) > 0 && <div><span>Current payment</span><strong>{money(payment.amount)}</strong></div>}
          {Number(payment.application_total_fee || 0) > 0 && <div><span>Balance after payment</span><strong>{money(payment.balance_after_payment)}</strong></div>}
        </div>
        {Number(payment.application_total_fee || 0) > 0 && <div className={`receipt-payment-status ${Number(payment.balance_after_payment) > 0 ? 'open' : 'paid'}`}><strong>{Number(payment.balance_after_payment) > 0 ? 'PARTIAL PAYMENT' : 'PAID IN FULL'}</strong><span>{Number(payment.balance_after_payment) > 0 ? `${money(payment.balance_after_payment)} remains outstanding on this application.` : 'This application has been fully paid based on the recorded service fee.'}</span></div>}
        {payment.notes && <div className="receipt-notes"><span>Notes</span><p>{payment.notes}</p></div>}
        <div className="receipt-footer"><span>Thank you for choosing ASY & Hajja Zainab Global Tours and Mobility.</span><span>Keep this receipt for your records.</span></div>
        <button className="primary-btn no-print print-receipt-btn" onClick={() => window.print()}><PrinterIcon /> Print receipt</button>
      </div>
    </div>
  );
}
