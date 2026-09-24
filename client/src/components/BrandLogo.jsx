import { BriefcaseBusiness, Globe2, PlaneTakeoff, ShieldCheck } from 'lucide-react';

export default function BrandLogo({ large = false, showPartnership = false }) {
  return (
    <div className={`brand-lockup ${large ? 'brand-lockup-large' : ''}`}>
      <div className={`brand-mark ${large ? 'large' : ''}`} aria-label="ASY & Hajja Zainab Global Tours and Mobility logo">
        <div className="brand-mark-ring"></div>
        <div className="brand-mark-route route-a"></div>
        <div className="brand-mark-route route-b"></div>
        <Globe2 className="brand-globe" />
        <ShieldCheck className="brand-shield" />
        <BriefcaseBusiness className="brand-briefcase" />
        <PlaneTakeoff className="brand-plane" />
        <span className="brand-monogram">ASY</span>
      </div>
      <div className="brand-copy">
        <strong>ASY &amp; HAJJA ZAINAB</strong>
        <span>GLOBAL TOURS AND MOBILITY</span>
        {showPartnership && <small>Global jobs • travel • tours • mobility</small>}
      </div>
    </div>
  );
}
