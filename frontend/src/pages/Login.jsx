import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../services/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  // If already logged in, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setErr('');
    if (!form.email.trim()) return setErr('Email is required');
    if (!form.password)     return setErr('Password is required');
    setBusy(true);
    try {
      const res = await loginApi(form);
      // Store token + user in context/localStorage
      login(res.data.user, res.data.token);
      // Use window.location for guaranteed redirect (bypasses any React Router edge cases)
      window.location.replace(from === '/login' ? '/dashboard' : from);
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || 'Login failed. Check your credentials.';
      setErr(msg);
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, rgba(123,47,190,0.08) 0%, transparent 70%)',
      padding: '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 440, animation: 'fade-in 0.4s ease' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
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
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 6 }}>Sign in to your account</p>
        </div>

        <div className="card">
          {err && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              ⚠️ {err}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                autoComplete="current-password"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={busy}
              style={{ marginTop: 8, fontSize: 16, padding: '14px' }}
            >
              {busy ? '⏳ Signing In…' : '🔐 Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-2)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--red)', fontWeight: 600 }}>Create one free</Link>
          </div>
        </div>

        {/* Emergency numbers */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>
          🚨 Emergency? Call{' '}
          <a href="tel:100"  style={{ color: 'var(--amber)' }}>100 (Police)</a> or{' '}
          <a href="tel:1091" style={{ color: 'var(--amber)' }}>1091 (Women Helpline)</a>
        </div>
      </div>
    </div>
  );
}
