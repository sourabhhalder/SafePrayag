import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signup as signupApi } from '../services/api';

const FIELDS = [
  { key: 'name',           label: 'Full Name',             type: 'text',  placeholder: 'Priya Sharma', required: true },
  { key: 'email',          label: 'Email Address',         type: 'email', placeholder: 'priya@example.com', required: true },
  { key: 'phone',          label: 'Mobile Number',         type: 'tel',   placeholder: '+91 98765 43210', required: true },
  { key: 'password',       label: 'Password',              type: 'password', placeholder: 'Min 6 characters', required: true },
  { key: 'guardian_name',  label: 'Guardian Name',         type: 'text',  placeholder: 'Parent or trusted contact', required: false },
  { key: 'guardian_phone', label: 'Guardian Phone (SOS)',  type: 'tel',   placeholder: '+91 for SMS alerts', required: false },
];

export default function Signup() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    gender: 'Female', age_group: 'Adult',
    guardian_name: '', guardian_phone: '',
  });
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setErr('');
    if (form.password.length < 6) return setErr('Password must be at least 6 characters');
    setBusy(true);
    try {
      const res = await signupApi(form);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (e) {
      setErr(e.response?.data?.detail || 'Signup failed. Try again.');
    } finally { setBusy(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, rgba(255,59,92,0.06) 0%, transparent 70%)',
      padding: '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 520, animation: 'fade-in 0.4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #FF3B5C, #7B2FBE)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 14px',
            boxShadow: '0 0 32px rgba(255,59,92,0.3)',
          }}>🛡️</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>
            SAFE<span style={{ color: 'var(--red)' }}>PRAYAG</span>
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 6 }}>Create your free safety account</p>
        </div>

        <div className="card">
          {err && <div className="alert alert-error">⚠️ {err}</div>}

          <form onSubmit={submit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              {FIELDS.map(f => (
                <div key={f.key} className="form-group" style={f.key === 'guardian_phone' ? {} : {}}>
                  <label className="form-label">{f.label} {!f.required && <span style={{ color: 'var(--text-muted)' }}>(optional)</span>}</label>
                  <input className="form-input" type={f.type} placeholder={f.placeholder}
                    value={form[f.key]} onChange={set(f.key)} required={f.required} />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" value={form.gender} onChange={set('gender')}>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Age Group</label>
                <select className="form-select" value={form.age_group} onChange={set('age_group')}>
                  <option>Child</option>
                  <option>Teen</option>
                  <option>Adult</option>
                  <option>Senior</option>
                </select>
              </div>
            </div>

            {/* Guardian info note */}
            <div style={{
              background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)',
              borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, color: 'var(--amber)',
            }}>
              💡 Add your guardian's phone to receive automatic SOS SMS alerts when you trigger an emergency.
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={busy}
              style={{ fontSize: 16 }}>
              {busy ? '⏳ Creating Account…' : '🛡️ Create My Safe Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-2)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--red)', fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
