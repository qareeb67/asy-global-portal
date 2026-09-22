import { Globe2, PlaneTakeoff } from 'lucide-react';

export default function BrandLogo({ large = false, showPartnership = false }) {
  return (
    <div className={`brand-lockup ${large ? 'brand-lockup-large' : ''}`}>
      <div className={`brand-mark ${large ? 'large' : ''}`} aria-label="ASY Global logo">
        <div className="brand-mark-ring"></div>
        <Globe2 className="brand-globe" />
        <PlaneTakeoff className="brand-plane" />
        <span className="brand-monogram">ASY</span>
      </div>
      <div className="brand-copy">
        <strong>ASY Global</strong>
        <span>Travel &amp; Mobility</span>
        {showPartnership && <small>In partnership with Hajja Zainab Travel &amp; Tours</small>}
      </div>
    </div>
  );
}
