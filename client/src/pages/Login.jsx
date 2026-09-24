import { useState } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import BrandLogo from '../components/BrandLogo.jsx';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@asyglobal.com');
  const [password, setPassword] = useState('ChangeMe123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-panel">
        <div className="login-brand">
          <BrandLogo large showPartnership />
        </div>
        <div className="login-copy">
          <span className="pill"><ShieldCheck size={14} /> Authorized staff only</span>
          <h1>Welcome back.</h1>
          <p>Sign in to manage clients, documents, applications and payments.</p>
        </div>
        <form onSubmit={submit} className="form-stack">
          <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required /></label>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></label>
          {error && <div className="error-box">{error}</div>}
          <button className="primary-btn" disabled={loading}>{loading ? 'Signing in…' : <><LockKeyhole size={17} /> Sign in</>}</button>
        </form>
        <div className="login-footer">Private operations portal • Authorized staff only</div>
      </div>
      <div className="login-visual">
        <div className="visual-glow"></div>
        <div className="visual-card">
          <span>TRAVEL • WORK • TOURS • MOBILITY</span>
          <h2>Every journey, organized beautifully.</h2>
          <p>Manage clients, applications, documents, payments and team activity from one secure workspace.</p>
          <div className="partnership-note">A trusted joint platform for <strong>ASY &amp; Hajja Zainab Global Tours and Mobility</strong>.</div>
        </div>
      </div>
    </div>
  );
}
