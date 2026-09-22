import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, FileText, WalletCards, UsersRound, BriefcaseBusiness, CircleAlert, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const icons = { client: UsersRound, document: FileText, payment: WalletCards, opportunity: BriefcaseBusiness, application: BriefcaseBusiness, success: Check, info: Bell };

export default function Notifications() {
  const [items, setItems] = useState([]); const [error, setError] = useState('');
  async function load() { try { const {data}=await api.get('/notifications'); setItems(data.notifications||[]); setError(''); } catch(err){setError(err.response?.data?.message||'Could not load notifications.');} }
  useEffect(()=>{load();},[]);
  async function read(id){try{await api.patch(`/notifications/${id}/read`);setItems(items.map(n=>n.id===id?{...n,is_read:true}:n));}catch{}}
  async function readAll(){try{await api.patch('/notifications/read-all');setItems(items.map(n=>({...n,is_read:true})));}catch{}}
  const unread = items.filter(n=>!n.is_read).length;
  return <div>
    <div className="page-heading"><div><span className="eyebrow">TEAM INBOX</span><h2>Notifications</h2><p>Keep the whole travel desk aligned when a client, document, payment or opportunity changes.</p></div><button className="secondary-btn" onClick={readAll} disabled={!unread}><CheckCheck size={16}/> Mark all read</button></div>
    {error && <div className="error-box">{error}</div>}
    <div className="notification-summary"><div><Bell size={18}/><strong>{unread}</strong><span>unread</span></div><div><Check size={18}/><strong>{items.length-unread}</strong><span>read</span></div><div><CircleAlert size={18}/><strong>{items.length}</strong><span>recent notices</span></div></div>
    <div className="notification-list">
      {items.map(item=>{const Icon=icons[item.type]||Bell;return <div key={item.id} className={`notification-item ${item.is_read?'read':'unread'}`}><div className={`notification-icon ${item.type}`}><Icon size={18}/></div><div className="notification-copy"><div><strong>{item.title}</strong>{!item.is_read&&<span className="unread-dot"/>}</div><p>{item.message}</p><small>{new Date(item.created_at).toLocaleString('en-NG')}</small></div><div className="notification-actions">{item.link&&<Link className="icon-btn" to={item.link} title="Open related page"><ExternalLink size={16}/></Link>}{!item.is_read&&<button className="icon-btn" onClick={()=>read(item.id)} title="Mark read"><Check size={16}/></button>}</div></div>})}
      {!items.length&&<div className="empty-state-card"><Bell size={28}/><h3>Your team inbox is clear</h3><p>ASY will place useful operational alerts here as staff register clients, upload documents, record payments or update opportunities.</p></div>}
    </div>
  </div>;
}
