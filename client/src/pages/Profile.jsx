import { useEffect, useState } from 'react';
import { KeyRound, Mail, Save, ShieldCheck, UserRound } from 'lucide-react';
import { api } from '../services/api';

export default function Profile({ user, onUserUpdated }) {
  const [form, setForm] = useState({ full_name: '', email: '', current_password: '', new_password: '', confirm_password: '' });
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/profile')
      .then(({ data }) => {
        setProfile(data.user);
        setForm(current => ({ ...current, full_name: data.user.full_name, email: data.user.email }));
      })
      .catch(err => setError(err.response?.data?.message || 'Unable to load profile.'));
  }, []);

  async function save(e) {
    e.preventDefault();
    setError(''); setMessage('');
    if (form.new_password && form.new_password !== form.confirm_password) {
      setError('New password and confirmation do not match.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.patch('/auth/profile', {
        full_name: form.full_name,
        email: form.email,
        current_password: form.current_password || undefined,
        new_password: form.new_password || undefined
      });
      setProfile(data.user);
      onUserUpdated?.({ id: data.user.id, full_name: data.user.full_name, email: data.user.email, role: data.user.role });
      setForm(current => ({ ...current, current_password: '', new_password: '', confirm_password: '' }));
      setMessage(form.new_password ? 'Profile and password updated successfully.' : 'Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return <div className="empty-state">Loading profile…</div>;

  return (
    <div>
      <div className="page-heading">
        <div><span className="eyebrow">ACCOUNT SETTINGS</span><h2>Account settings</h2><p>Manage your staff identity, sign-in details and password for ASY &amp; Hajja Zainab Global Tours and Mobility.</p></div>
        <div className="profile-role-card"><ShieldCheck size={16} /><span>{profile.role.replace('_', ' ')}</span></div>
      </div>
      {error && <div className="error-box">{error}</div>}
      {message && <div className="success-box">{message}</div>}

      <div className="profile-grid">
        <section className="panel profile-identity">
          <div className="profile-avatar-large">{profile.full_name.slice(0, 1).toUpperCase()}</div>
          <h3>{profile.full_name}</h3>
          <p>{profile.email}</p>
          <span className="role-badge">{profile.role.replace('_', ' ')}</span>
          <div className="identity-meta"><span>Account ID</span><strong>ASY-USR-{String(profile.id).padStart(4, '0')}</strong></div>
          <div className="identity-meta"><span>Joined</span><strong>{new Date(profile.created_at).toLocaleDateString('en-NG')}</strong></div>
        </section>

        <section className="panel">
          <div className="panel-title"><div><span className="eyebrow">PROFILE DETAILS</span><h3>Account information &amp; security</h3></div><UserRound size={18} /></div>
          <form className="form-stack" onSubmit={save}>
            <label>Full name<input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></label>
            <label>Email address<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>

            <div className="password-section"><div className="password-heading"><KeyRound size={16} /><div><strong>Change password</strong><span>Leave these blank to keep your current password.</span></div></div>
              <div className="form-grid">
                <label>Current password<input type="password" value={form.current_password} onChange={e => setForm({ ...form, current_password: e.target.value })} autoComplete="current-password" /></label>
                <label>New password<input type="password" minLength="8" value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} autoComplete="new-password" /></label>
                <label className="span-2">Confirm new password<input type="password" minLength="8" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} autoComplete="new-password" /></label>
              </div>
            </div>

            <div className="modal-actions"><button className="primary-btn" disabled={saving}><Save size={17} /> {saving ? 'Saving…' : 'Save profile'}</button></div>
          </form>
        </section>
      </div>
    </div>
  );
}
