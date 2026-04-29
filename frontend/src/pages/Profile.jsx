import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/api';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({});
  const [msg, setMsg]         = useState('');
  const [err, setErr]         = useState('');
  const [busy, setBusy]       = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then(res => {
        setProfile(res.data);
        setForm(res.data);
      })
      .catch(() => {
        // Fall back to locally-stored user if API fails
        if (user) {
          setProfile(user);
          setForm(user);
        }
      })
      .finally(() => setLoading(false));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setErr(''); setMsg(''); setBusy(true);
    try {
      const payload = {
        name:           form.name,
        phone:          form.phone,
        gender:         form.gender,
        age_group:      form.age_group,
        guardian_name:  form.guardian_name,
        guardian_phone: form.guardian_phone,
      };
      await updateProfile(payload);
      setProfile(prev => ({ ...prev, ...payload }));
      updateUser(payload);
      setMsg('✅ Profile updated successfully!');
      setEditing(false);
    } catch (e) {
      setErr(e.response?.data?.detail || 'Update failed. Check backend connection.');
    } finally { setBusy(false); }
  };

  if (loading) return (
    <div className="loading-center page-main">
      <div className="spinner" />
      <p>Loading profile…</p>
    </div>
  );

  const p = profile || user || {};

  const statCards = [
    { label: 'Routes Checked',     value: p.routes_checked    || 0, icon: '🗺️', color: 'violet-accent' },
    { label: 'SOS Triggered',      value: p.sos_count         || p.sos_used || 0, icon: '🆘', color: 'red-accent'    },
    { label: 'Incidents Reported', value: p.incidents_reported || 0, icon: '📋', color: 'amber-accent'  },
  ];

  return (
    <main className="page-main">
      <div className="container" style={{ maxWidth: 720 }}>
        <div style={{ animation: 'fade-in 0.4s ease' }}>

          {/* Header Card */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(123,47,190,0.2), rgba(255,59,92,0.1))',
            border: '1px solid rgba(123,47,190,0.3)', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--violet), var(--red))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, fontFamily: 'var(--font-display)', fontWeight: 700,
              flexShrink: 0, boxShadow: '0 0 24px rgba(123,47,190,0.4)',
            }}>
              {p.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
                {p.name || 'SafePrayag User'}
              </h1>
              <div style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 8 }}>{p.email}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-safe">{p.gender || 'User'}</span>
                <span className="badge badge-warn">{p.age_group || 'Adult'}</span>
                <span style={{
                  fontFamily: 'var(--font-cond)', fontSize: 11, color: 'var(--text-muted)',
                  padding: '4px 8px', background: 'var(--bg-card)', borderRadius: 20,
                }}>
                  Member since {new Date(p.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            <button onClick={() => setEditing(!editing)}
              className={`btn ${editing ? 'btn-outline' : 'btn-violet'} btn-sm`}>
              {editing ? 'Cancel' : '✏️ Edit Profile'}
            </button>
          </div>

          {/* Activity Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {statCards.map(s => (
              <div key={s.label} className={`stat-card ${s.color}`}>
                <div className="stat-number">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-icon">{s.icon}</div>
              </div>
            ))}
          </div>

          {msg && <div className="alert alert-success">{msg}</div>}
          {err && <div className="alert alert-error">{err}</div>}

          {/* Personal Info */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="section-title" style={{ marginBottom: 4 }}>Personal Information</div>
            <div className="section-divider" />

            {editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                {[
                  { k: 'name',  label: 'Full Name',    type: 'text' },
                  { k: 'phone', label: 'Phone Number', type: 'tel'  },
                ].map(f => (
                  <div key={f.k} className="form-group">
                    <label className="form-label">{f.label}</label>
                    <input className="form-input" type={f.type} value={form[f.k] || ''} onChange={set(f.k)} />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender || 'Female'} onChange={set('gender')}>
                    {['Female','Male','Other'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Age Group</label>
                  <select className="form-select" value={form.age_group || 'Adult'} onChange={set('age_group')}>
                    {['Child','Teen','Adult','Senior'].map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <button onClick={save} className="btn btn-primary" disabled={busy} style={{ gridColumn: '1 / -1' }}>
                  {busy ? '⏳ Saving…' : '💾 Save Changes'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  ['Full Name',  p.name],
                  ['Email',      p.email],
                  ['Phone',      p.phone || '—'],
                  ['Gender',     p.gender],
                  ['Age Group',  p.age_group],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: 500 }}>{val || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guardian SOS */}
          <div className="card card-glow">
            <div className="section-title" style={{ marginBottom: 4 }}>🆘 Guardian & SOS Settings</div>
            <div className="section-divider" />
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
              Your guardian receives an SMS with your GPS location when SOS is triggered.
            </p>

            {editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="form-group">
                  <label className="form-label">Guardian Name</label>
                  <input className="form-input" type="text" value={form.guardian_name || ''}
                    onChange={set('guardian_name')} placeholder="Parent / Trusted Contact" />
                </div>
                <div className="form-group">
                  <label className="form-label">Guardian Phone</label>
                  <input className="form-input" type="tel" value={form.guardian_phone || ''}
                    onChange={set('guardian_phone')} placeholder="e.g. 9876543210" />
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Guardian Name</div>
                  <div style={{ fontWeight: 500 }}>
                    {p.guardian_name || <span style={{ color: 'var(--red)' }}>Not set — add now!</span>}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Guardian Phone</div>
                  <div style={{ fontWeight: 500 }}>
                    {p.guardian_phone || <span style={{ color: 'var(--red)' }}>Not set — SOS SMS disabled!</span>}
                  </div>
                </div>
              </div>
            )}

            {!p.guardian_phone && !editing && (
              <div className="alert alert-warn" style={{ marginTop: 16 }}>
                ⚠️ Set a guardian phone number to enable automatic SOS SMS alerts.{' '}
                <button onClick={() => setEditing(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--amber)', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}>
                  Add now
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
