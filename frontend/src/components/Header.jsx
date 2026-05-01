import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { triggerSOS } from '../services/api';

const Logo = () => (
  <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
    <div style={{
      width: 38, height: 38, borderRadius: 10,
      background: 'linear-gradient(135deg, #FF3B5C, #7B2FBE)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 18, boxShadow: '0 0 16px rgba(255,59,92,0.4)',
    }}>🛡️</div>
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: 1, color: 'var(--text)', lineHeight: 1 }}>
        SAFE<span style={{ color: 'var(--red)' }}>PRAYAG</span>
      </div>
      <div style={{ fontFamily: 'var(--font-cond)', fontSize: 10, letterSpacing: 2, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        AI Safety Navigator
      </div>
    </div>
  </Link>
);

const navStyle = ({ isActive }) => ({
  fontFamily: 'var(--font-cond)', fontWeight: 600, fontSize: 13,
  letterSpacing: '0.8px', textTransform: 'uppercase',
  color: isActive ? 'var(--red)' : 'var(--text-2)',
  textDecoration: 'none', padding: '6px 0',
  borderBottom: isActive ? '2px solid var(--red)' : '2px solid transparent',
  transition: 'all 0.2s',
});

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate  = useNavigate();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [sosBusy,  setSosBusy]    = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };

  const handleQuickSOS = async () => {
    if (sosBusy) return;
    setSosBusy(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const res = await triggerSOS({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          alert(`🆘 SOS TRIGGERED!\n${res.data.nearest_police.name}\n📞 ${res.data.nearest_police.phone}\nGuardian notified: ${res.data.guardian_notified ? 'Yes ✅' : 'No — add guardian phone in Profile'}`);
        } catch (e) {
          alert('SOS error: ' + (e.response?.data?.detail || e.message));
        } finally { setSosBusy(false); }
      },
      () => { alert('Allow location access to use SOS.'); setSosBusy(false); }
    );
  };

  return (
    <header style={{
      background: 'rgba(13,13,26,0.97)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div className="container" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Logo />

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', gap: 22, alignItems: 'center' }} className="desktop-nav">
          <NavLink to="/"    style={navStyle} end>Home</NavLink>
          <NavLink to="/blog" style={navStyle}>Blog</NavLink>
          <NavLink to="/faq"  style={navStyle}>FAQ</NavLink>
          {isAuthenticated && <>
            <NavLink to="/dashboard" style={navStyle}>Dashboard</NavLink>
            <NavLink to="/route"     style={navStyle}>Route Check</NavLink>
          </>}
        </nav>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAuthenticated && (
            <button onClick={handleQuickSOS} disabled={sosBusy} style={{
              background: 'var(--red)', color: 'white', border: 'none',
              borderRadius: 20, padding: '8px 18px',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
              letterSpacing: 1, cursor: 'pointer', animation: 'pulse-red 2s infinite',
              opacity: sosBusy ? 0.7 : 1,
            }}>
              {sosBusy ? '…' : '🆘 SOS'}
            </button>
          )}

          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 20, padding: '6px 14px',
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                fontFamily: 'var(--font-cond)', fontSize: 13, color: 'var(--text)',
              }}>
                <span style={{
                  width: 26, height: 26, background: 'var(--violet)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                {user?.name?.split(' ')[0]}
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>▾</span>
              </button>
              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '110%',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 10, minWidth: 180, boxShadow: 'var(--shadow)', zIndex: 200, overflow: 'hidden',
                }}>
                  {[
                    { label: '👤  Profile',       to: '/profile'   },
                    { label: '📊  Dashboard',     to: '/dashboard' },
                    { label: '🗺️  Route Check',  to: '/route'     },
                    { label: '📖  Blog',          to: '/blog'      },
                    { label: '❓  FAQ',           to: '/faq'       },
                  ].map(item => (
                    <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} style={{
                      display: 'block', padding: '12px 18px',
                      fontFamily: 'var(--font-cond)', fontSize: 14, color: 'var(--text)',
                      borderBottom: '1px solid var(--border)', textDecoration: 'none',
                    }}>{item.label}</Link>
                  ))}
                  <button onClick={handleLogout} style={{
                    width: '100%', padding: '12px 18px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'var(--font-cond)', fontSize: 14, color: 'var(--red)',
                  }}>🚪  Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login"  className="btn btn-outline btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
      <style>{`@media(max-width:700px){.desktop-nav{display:none!important}}`}</style>
    </header>
  );
}
