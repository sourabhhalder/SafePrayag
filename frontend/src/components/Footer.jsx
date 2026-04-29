import { Link } from 'react-router-dom';

const EMERGENCY = [
  { label: 'Police',           number: '100',  icon: '🚔' },
  { label: 'Women Helpline',   number: '1091', icon: '👩' },
  { label: 'Childline',        number: '1098', icon: '🧒' },
  { label: 'Ambulance',        number: '108',  icon: '🚑' },
  { label: 'Cyber Crime',      number: '1930', icon: '💻' },
  { label: 'Disaster Relief',  number: '1078', icon: '🆘' },
];

const POLICE_QUICK = [
  'George Town PS — 0532-2623333',
  'Civil Lines PS — 0532-2623335',
  'Kotwali PS — 0532-2400100',
  'Naini PS — 0532-2691100',
];

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg-2)',
      borderTop: '1px solid var(--border)',
      marginTop: 'auto',
    }}>
      {/* Emergency Banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(255,59,92,0.12), rgba(123,47,190,0.12))',
        borderBottom: '1px solid var(--border)', padding: '12px 0',
      }}>
        <div className="container">
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', alignItems: 'center'
          }}>
            <span style={{ fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--red)', fontWeight: 700 }}>
              ⚡ Emergency Numbers
            </span>
            {EMERGENCY.map(e => (
              <a key={e.number} href={`tel:${e.number}`} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '5px 12px',
                display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none',
                fontFamily: 'var(--font-cond)', fontSize: 13, color: 'var(--text)',
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e2 => e2.currentTarget.style.borderColor='var(--red)'}
                onMouseLeave={e2 => e2.currentTarget.style.borderColor='var(--border)'}
              >
                {e.icon} <strong style={{ color: 'var(--amber)' }}>{e.number}</strong>
                <span style={{ color: 'var(--text-muted)' }}>{e.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container" style={{ padding: '48px 24px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40 }}>
        
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'linear-gradient(135deg, #FF3B5C, #7B2FBE)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>🛡️</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>
                SAFE<span style={{ color: 'var(--red)' }}>PRAYAG</span>
              </div>
              <div style={{ fontFamily: 'var(--font-cond)', fontSize: 9, letterSpacing: 2, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                AI Safety Navigator
              </div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
            AI-powered crime prediction and safe route navigation for women and children in Prayagraj.
            Built with XGBoost ML and real-time maps.
          </p>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Women Safety', 'Childline', 'AI Powered', 'Free'].map(tag => (
              <span key={tag} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 20, padding: '3px 10px',
                fontSize: 11, fontFamily: 'var(--font-cond)',
                letterSpacing: '0.8px', color: 'var(--text-muted)',
              }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h4 style={{ fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 16 }}>
            Navigate
          </h4>
          {[
            { label: 'Home', to: '/' },
            { label: 'Route Safety Check', to: '/route' },
            { label: 'Dashboard & Analytics', to: '/dashboard' },
            { label: 'Report Incident', to: '/dashboard' },
            { label: 'My Profile', to: '/profile' },
            { label: 'Sign Up Free', to: '/signup' },
          ].map(l => (
            <Link key={l.to + l.label} to={l.to} style={{
              display: 'block', fontSize: 14, color: 'var(--text-2)',
              marginBottom: 9, textDecoration: 'none', transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
            >→ {l.label}</Link>
          ))}
        </div>

        {/* Police Stations */}
        <div>
          <h4 style={{ fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 16 }}>
            📍 Key Police Stations
          </h4>
          {POLICE_QUICK.map(ps => (
            <div key={ps} style={{
              fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5,
              paddingLeft: 10, borderLeft: '2px solid var(--border)',
            }}>{ps}</div>
          ))}
          <a href="tel:100" className="btn btn-primary btn-sm" style={{ marginTop: 12, textDecoration: 'none', display: 'inline-flex' }}>
            📞 Call Police: 100
          </a>
        </div>

        {/* Mission */}
        <div>
          <h4 style={{ fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 16 }}>
            Our Mission
          </h4>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.8, marginBottom: 14 }}>
            SafePrayag uses machine learning to analyse crime patterns and predict safety risks — 
            empowering every woman, child, and citizen to navigate Prayagraj confidently.
          </p>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid rgba(255,59,92,0.2)',
            borderRadius: 8, padding: '12px 16px',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--red)' }}>1091</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Women Helpline — 24/7 Free</div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        borderTop: '1px solid var(--border)', padding: '16px 0',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <div className="container" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 10,
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            © 2025 SafePrayag — Built for Prayagraj's safety. Powered by XGBoost + MongoDB.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy Policy', 'Terms', 'Contact'].map(l => (
              <span key={l} style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
