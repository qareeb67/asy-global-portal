import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  Landmark,
  ClipboardList,
  FileClock,
  Globe2,
  MapPinned,
  Plane,
  Plus,
  Sparkles,
  UserPlus,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

const cards = [
  ['total_clients', 'Total Clients', UsersRound],
  ['new_clients', 'New Today', UserPlus],
  ['active_applications', 'Active Applications', ClipboardList],
  ['documents_pending', 'Documents Pending', FileClock],
  ['completed_applications', 'Completed', WalletCards],
];

const travelPromos = [
  { tone: 'saudi', country: 'Saudi Arabia', flag: '🇸🇦', title: 'Saudi work & travel desk', text: 'Keep Saudi visa, employment and guided-travel opportunities organized from first contact to departure.', tag: 'SAUDI', Icon: Landmark },
  { tone: 'eu', country: 'European Union', flag: '🇪🇺', title: 'EU work, study & travel', text: 'Track European mobility options, employer opportunities and travel services in one clear workspace.', tag: 'EUROPEAN UNION', Icon: Globe2 },
  { tone: 'poland', country: 'Poland', flag: '🇵🇱', title: 'Jobs & long-stay routes', text: 'Organize warehouse, delivery and other employer opportunities with a clear client process.', tag: 'POLAND', Icon: Building2 },
  { tone: 'africa', country: 'Africa', flag: '🌍', title: 'Africa to the world', text: 'Keep Northern Nigerian and wider African client journeys connected to global opportunities.', tag: 'AFRICA', Icon: UsersRound },
  { tone: 'schengen', country: 'Schengen Area', flag: '✈️', title: 'Multi-country travel routes', text: 'Manage tourism and mobility enquiries spanning the Schengen travel area from one desk.', tag: 'SCHENGEN', Icon: Plane },
];

export default function Dashboard() {
  const [summary, setSummary] = useState({});
  const [liveOffers, setLiveOffers] = useState([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/dashboard/summary'), api.get('/opportunities', { params: { status: 'Available' } }), api.get('/notifications/unread-count')])
      .then(([summaryRes, offersRes, unreadRes]) => { setSummary(summaryRes.data.summary); setLiveOffers((offersRes.data.opportunities || []).slice(0, 3)); setUnread(Number(unreadRes.data.count || 0)); })
      .catch(() => setError('Could not load dashboard.'));
  }, []);

  return (
    <div className="dashboard-page">
      <section className="travel-hero">
        <div className="travel-hero-copy">
          <div className="hero-kicker"><Sparkles size={14} /> ASY GLOBAL OPERATIONS</div>
          <h2>Every journey starts with a plan.</h2>
          <p>Manage clients, applications, documents and payments with a calm, professional travel workflow.</p>
          <div className="hero-actions">
            <Link to="/clients" className="primary-btn"><UserPlus size={17} /> Register client</Link>
            <Link to="/opportunities" className="hero-ghost-btn"><Globe2 size={16} /> Open travel desk</Link><Link to="/payments" className="hero-ghost-btn"><WalletCards size={16} /> Finance desk</Link>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-orbit orbit-one"></div>
          <div className="hero-orbit orbit-two"></div>
          <div className="hero-sun"></div>
          <div className="hero-globe"><Globe2 size={106} strokeWidth={1.15} /></div>
          <Plane className="hero-plane" size={66} strokeWidth={1.45} />
          <div className="hero-route route-one"></div>
          <div className="hero-route route-two"></div>
          <div className="hero-card-float"><MapPinned size={15} /><span>Travel • Work • Tours • Mobility</span></div>
        </div>
      </section>

      {error && <div className="error-box">{error}</div>}

      <section className="section-heading-row">
        <div>
          <span className="eyebrow">TODAY AT ASY</span>
          <h3>Operations at a glance</h3>
        </div>
        <div className="section-note"><BriefcaseBusiness size={15} /> Private staff workspace</div>
      </section>

      <div className="stats-grid">
        {cards.map(([key, label, Icon]) => (
          <div className="stat-card" key={key}>
            <div className="stat-icon"><Icon size={20} /></div>
            <span>{label}</span>
            <strong>{summary[key] ?? '—'}</strong>
            <ArrowUpRight size={17} className="stat-arrow" />
          </div>
        ))}
      </div>

      <section className="heritage-strip"><div><span className="heritage-pattern" aria-hidden="true"></span><div><span className="eyebrow">FROM AFRICA TO THE WORLD</span><strong>Global opportunity, guided with trust.</strong><p>Built for clients from Northern Nigeria and beyond.</p></div></div><span className="heritage-badge">TRAVEL • WORK • TOURS • MOBILITY</span></section>

      <section className="section-heading-row promo-heading">
        <div>
          <span className="eyebrow">TRAVEL DESK</span>
          <h3>Global destinations & opportunities</h3>
        </div>
        <span className="muted">Saudi • Europe • Africa • Schengen</span>
      </section>

      <div className="promo-grid">
        {travelPromos.map((promo) => (
          <article className={`travel-promo ${promo.tone}`} key={promo.country}>
            <div className="promo-art" aria-hidden="true">
              <div className="promo-moon"></div>
              <div className="promo-stars"></div>
              <div className="promo-landscape landscape-one"></div>
              <div className="promo-landscape landscape-two"></div>
              <promo.Icon size={42} className="promo-country-icon" />
              <Plane size={34} className="promo-plane" />
            </div>
            <div className="promo-body">
              <div className="promo-topline"><span>{promo.tag}</span><b>{promo.flag}</b></div>
              <h4>{promo.country}</h4>
              <strong>{promo.title}</strong>
              <p>{promo.text}</p>
              <Link to="/clients" className="promo-link">Manage clients <ArrowRight size={15} /></Link>
            </div>
          </article>
        ))}
      </div>

      <section className="section-heading-row live-heading">
        <div>
          <span className="eyebrow">LIVE TRAVEL DESK</span>
          <h3>Current opportunities</h3>
        </div>
        <Link to="/opportunities" className="text-link">Manage all resources <ArrowRight size={15}/></Link>
      </section>

      <div className="dashboard-live-grid">
        {liveOffers.map((item) => (
          <Link className="dashboard-offer-card" to="/opportunities" key={item.id}>
            <div className="dashboard-offer-flag"><Globe2 size={18}/><span>{item.country}</span></div>
            <h4>{item.title}</h4>
            <p>{item.summary || item.service_type || item.category}</p>
            <span className="availability-pill available"><Sparkles size={12}/> Available</span>
            <small>{item.opportunity_code || 'Internal desk resource'}</small>
          </Link>
        ))}
        {!liveOffers.length && <div className="dashboard-empty-offers"><Globe2 size={21}/><div><strong>No live opportunities added yet.</strong><p>Add your real Saudi visas, Europe jobs, tours and other resources in the Travel Desk.</p></div><Link to="/opportunities" className="secondary-btn compact">Open Travel Desk</Link></div>}
      </div>

      <section className="dashboard-notification-strip">
        <div><div className="notification-strip-icon"><Bell size={17}/></div><div><strong>Team notifications</strong><span>{unread ? `${unread} unread update${unread===1?'':'s'} waiting in your inbox.` : 'Your team inbox is up to date.'}</span></div></div>
        <Link to="/notifications" className="text-link">Open notifications <ArrowRight size={15}/></Link>
      </section>

      <section className="welcome-card travel-welcome">
        <div className="welcome-badge"><Plus size={15} /> V1 OPERATIONS</div>
        <div className="welcome-content">
          <h3>One workspace for every client journey.</h3>
          <p>Register the client, attach private documents, create the application, record payments and print a professional receipt — without losing the paper trail.</p>
        </div>
        <Link to="/clients" className="text-link">Open client workspace <ArrowUpRight size={16} /></Link>
      </section>
    </div>
  );
}
