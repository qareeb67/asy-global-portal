import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileClock,
  Globe2,
  Handshake,
  Landmark,
  MapPinned,
  Plane,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const cards = [
  ['total_clients', 'Total Clients', UsersRound, 'People in your client workspace'],
  ['new_clients', 'New Today', UserPlus, 'New registrations today'],
  ['active_applications', 'Active Applications', ClipboardList, 'Journeys currently in progress'],
  ['documents_pending', 'Documents Pending', FileClock, 'Items waiting for review'],
  ['completed_applications', 'Completed', WalletCards, 'Completed client journeys'],
];

const trustItems = [
  { icon: Globe2, title: 'Global Opportunities', text: 'Work & travel around the world' },
  { icon: ShieldCheck, title: 'Trusted & Secure', text: 'Authorized staff workspace' },
  { icon: UsersRound, title: 'Expert Guidance', text: 'From application to arrival' },
  { icon: Plane, title: 'Travel & Mobility', text: 'Smooth, organized journeys' },
  { icon: Handshake, title: 'Your Success', text: 'People, partners & progress' },
];

const destinations = [
  {
    slug: 'saudi',
    country: 'Saudi Arabia',
    flag: '🇸🇦',
    descriptor: 'Work • Visit • Live',
    title: 'Saudi work & travel desk',
    text: 'Organize visa, work and guided-travel support from first contact to departure.',
    Icon: Landmark,
  },
  {
    slug: 'eu',
    country: 'European Union',
    flag: '🇪🇺',
    descriptor: 'Work • Study • Build Your Future',
    title: 'EU mobility opportunities',
    text: 'Track travel, employment and study enquiries across European destinations.',
    Icon: Globe2,
  },
  {
    slug: 'poland',
    country: 'Poland',
    flag: '🇵🇱',
    descriptor: 'Jobs • Study • Long Stay',
    title: 'Poland employment routes',
    text: 'Keep delivery, warehouse and other employer opportunities organized.',
    Icon: Building2,
  },
  {
    slug: 'africa',
    country: 'Africa',
    flag: '🌍',
    descriptor: 'Talent • Skills • Global Impact',
    title: 'Africa to the world',
    text: 'Connect African client journeys with international work and travel opportunities.',
    Icon: UsersRound,
  },
  {
    slug: 'schengen',
    country: 'Schengen Area',
    flag: '✈️',
    descriptor: 'Travel • Work • Explore',
    title: 'Multi-country routes',
    text: 'Keep multi-country travel enquiries visible from one operations desk.',
    Icon: MapPinned,
  },
];

export default function Dashboard() {
  const [summary, setSummary] = useState({});
  const [liveOffers, setLiveOffers] = useState([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/summary'),
      api.get('/opportunities', { params: { status: 'Available' } }),
      api.get('/notifications/unread-count'),
    ])
      .then(([summaryRes, offersRes, unreadRes]) => {
        setSummary(summaryRes.data.summary || {});
        setLiveOffers((offersRes.data.opportunities || []).slice(0, 3));
        setUnread(Number(unreadRes.data.count || 0));
      })
      .catch(() => setError('Could not load dashboard.'));
  }, []);

  return (
    <div className="dashboard-page asy-v159-dashboard">
      <section className="asy-picture-hero">
        <div className="asy-picture-hero-photo" aria-hidden="true" />
        <div className="asy-picture-hero-overlay" aria-hidden="true" />
        <div className="asy-picture-hero-copy">
          <div className="hero-kicker"><Sparkles size={14} /> ASY &amp; HAJJA ZAINAB</div>
          <h2>Global Tours<br /><span>and Mobility</span></h2>
          <strong className="hero-tagline">Connecting People&nbsp; | &nbsp;Creating Opportunities<br />Building a Global Future</strong>
          <p>Your operations desk for global job opportunities, travel and mobility support across Saudi Arabia, Europe, Africa and beyond.</p>
          <div className="hero-actions">
            <Link to="/clients" className="primary-btn"><UserPlus size={17} /> Register client</Link>
            <Link to="/opportunities" className="hero-ghost-btn"><Globe2 size={16} /> Explore opportunities</Link>
          </div>
        </div>
        <div className="hero-strap"><Plane size={15} /> TRAVEL • WORK • TOURS • MOBILITY</div>
      </section>

      {error && <div className="error-box">{error}</div>}

      <section className="asy-trust-strip">
        {trustItems.map(({ icon: Icon, title, text }, index) => (
          <div className="asy-trust-item" key={title}>
            <Icon size={30} strokeWidth={1.9} />
            <strong>{title}</strong>
            <span>{text}</span>
            {index < trustItems.length - 1 && <i aria-hidden="true" />}
          </div>
        ))}
      </section>

      <section className="section-heading-row asy-section-heading">
        <div>
          <span className="eyebrow">TODAY AT ASY</span>
          <h3>Operations at a glance</h3>
        </div>
        <div className="section-note"><BriefcaseBusiness size={15} /> Private staff workspace</div>
      </section>

      <div className="stats-grid asy-stats-grid">
        {cards.map(([key, label, Icon, description]) => (
          <div className="stat-card" key={key}>
            <div className="stat-card-head">
              <div className="stat-icon"><Icon size={20} /></div>
              <ArrowUpRight size={17} className="stat-arrow" />
            </div>
            <span>{label}</span>
            <strong>{summary[key] ?? '—'}</strong>
            <small>{description}</small>
          </div>
        ))}
      </div>

      <section className="asy-heritage-banner">
        <div className="asy-heritage-art" aria-hidden="true"><Plane size={31} /></div>
        <div className="asy-heritage-copy">
          <span className="eyebrow">FROM AFRICA TO THE WORLD</span>
          <strong>Global opportunity, guided with trust.</strong>
          <p>One calm workspace for client registration, applications, documents, payments and travel opportunities.</p>
        </div>
        <Link to="/clients" className="secondary-btn">Open client workspace <ArrowRight size={15} /></Link>
      </section>

      <section className="section-heading-row promo-heading asy-section-heading">
        <div>
          <span className="eyebrow">TRAVEL DESK</span>
          <h3>Destinations &amp; global opportunities</h3>
        </div>
        <span className="muted">Saudi • Europe • Poland • Africa • Schengen</span>
      </section>

      <div className="asy-destination-grid">
        {destinations.map((destination) => {
          const Icon = destination.Icon;
          return (
            <article className="asy-destination-card" key={destination.slug}>
              <div
                className="asy-destination-photo"
                style={{ backgroundImage: `url(/asy-ui/destination-${destination.slug}.jpg)` }}
                aria-hidden="true"
              >
                <span className="asy-destination-country">{destination.country}</span>
                <span className="asy-destination-flag">{destination.flag}</span>
                <span className="asy-destination-icon"><Icon size={22} /></span>
              </div>
              <div className="asy-destination-body">
                <span className="asy-destination-descriptor">{destination.descriptor}</span>
                <h4>{destination.title}</h4>
                <p>{destination.text}</p>
                <Link to="/opportunities" className="promo-link">Open travel desk <ArrowRight size={15} /></Link>
              </div>
            </article>
          );
        })}
      </div>

      <section className="asy-lower-grid">
        <article className="asy-quote-card">
          <div className="asy-quote-image" aria-hidden="true" />
          <div className="asy-quote-content">
            <span className="quote-symbol">“</span>
            <p>More than just a travel agency — we are your partner in global opportunities.</p>
            <div className="asy-quote-rule" />
            <strong>ASY &amp; HAJJA ZAINAB</strong>
            <span>GLOBAL TOURS AND MOBILITY</span>
          </div>
        </article>

        <article className="asy-service-card">
          <div>
            <span className="eyebrow">WHY CHOOSE US?</span>
            <h3>Built around trust &amp; clarity</h3>
            <div className="asy-check-list">
              {[
                'Worldwide job and travel opportunities',
                'Personalized support and guidance',
                'Fast, reliable and transparent process',
                'Strong global partnerships',
                'Focus on client success and well-being',
              ].map((item) => <div key={item}><CheckCircle2 size={17} /> <span>{item}</span></div>)}
            </div>
          </div>
          <div className="asy-service-divider" />
          <div>
            <span className="eyebrow">OUR SERVICES</span>
            <h3>One journey, many touchpoints</h3>
            <div className="asy-service-list">
              <span>Job Placement &amp; Recruitment</span>
              <span>Visa Support &amp; Documentation</span>
              <span>Travel &amp; Ticketing</span>
              <span>Accommodation Assistance</span>
              <span>Post-Arrival Support</span>
            </div>
          </div>
        </article>
      </section>

      <section className="live-heading section-heading-row asy-section-heading">
        <div>
          <span className="eyebrow">LIVE TRAVEL DESK</span>
          <h3>Current opportunities</h3>
        </div>
        <Link to="/opportunities" className="text-link">Manage all resources <ArrowRight size={15} /></Link>
      </section>

      <div className="dashboard-live-grid">
        {liveOffers.map((item) => (
          <Link className="dashboard-offer-card" to="/opportunities" key={item.id}>
            <div className="dashboard-offer-flag"><Globe2 size={18} /><span>{item.country}</span></div>
            <h4>{item.title}</h4>
            <p>{item.summary || item.service_type || item.category}</p>
            <span className="availability-pill available"><Sparkles size={12} /> Available</span>
            <small>{item.opportunity_code || 'Internal desk resource'}</small>
          </Link>
        ))}
        {!liveOffers.length && (
          <div className="dashboard-empty-offers">
            <Globe2 size={21} />
            <div><strong>No live opportunities added yet.</strong><p>Add your real Saudi visas, Europe jobs, tours and other resources in the Travel Desk.</p></div>
            <Link to="/opportunities" className="secondary-btn compact">Open Travel Desk</Link>
          </div>
        )}
      </div>

      <section className="dashboard-notification-strip">
        <div>
          <div className="notification-strip-icon"><Bell size={17} /></div>
          <div><strong>Team notifications</strong><span>{unread ? `${unread} unread update${unread === 1 ? '' : 's'} waiting in your inbox.` : 'Your team inbox is up to date.'}</span></div>
        </div>
        <Link to="/notifications" className="text-link">Open notifications <ArrowRight size={15} /></Link>
      </section>
    </div>
  );
}
