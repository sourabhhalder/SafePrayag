import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: '🤖', title: 'AI Crime Prediction', desc: 'XGBoost model trained on real Prayagraj crime data predicts safety scores for any location, time, and demographic.' },
  { icon: '🗺️', title: 'Safe Route Analysis', desc: 'Enter origin & destination to get a complete safety analysis with crime hotspots overlaid on a live Leaflet map.' },
  { icon: '🆘', title: 'One-Tap SOS Alert', desc: 'Instantly notifies your guardian via SMS with your GPS coordinates and nearest police station details.' },
  { icon: '📡', title: 'Live Location Tracking', desc: 'Real-time route monitoring — auto-triggers SOS if you deviate more than 50 meters from your planned path.' },
  { icon: '🚔', title: 'Police Station Connect', desc: 'Nearest Prayagraj police station auto-detected with direct call link — 12 stations mapped city-wide.' },
  { icon: '📊', title: 'Crime Analytics Dashboard', desc: 'Interactive charts showing crime by type, time, severity, and target group across all Prayagraj zones.' },
];

const STATS = [
  { value: '50K+', label: 'Crime Records Trained', color: 'var(--red)' },
  { value: '12',   label: 'Police Stations Mapped', color: 'var(--violet-light)' },
  { value: '24/7', label: 'Real-Time Monitoring', color: 'var(--amber)' },
  { value: '100%', label: 'Free to Use', color: 'var(--green)' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create Account', desc: 'Sign up with your details and add your guardian\'s phone number for SOS alerts.' },
  { step: '02', title: 'Enter Your Route', desc: 'Input origin and destination. Our AI analyses crime data for your specific route and time.' },
  { step: '03', title: 'Get Safety Score', desc: 'Receive a 0-100 safety score, crime hotspot overlay, precautions, and police station info.' },
  { step: '04', title: 'Track & Stay Safe', desc: 'Enable live tracking. If you deviate, SOS fires automatically to your guardian and nearest police.' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="page-wrapper">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '88vh', display: 'flex', alignItems: 'center',
        background: 'radial-gradient(ellipse at 60% 0%, rgba(123,47,190,0.15) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(255,59,92,0.1) 0%, transparent 50%)',
        position: 'relative', overflow: 'hidden', paddingTop: 48,
      }}>
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px', pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 720, animation: 'fade-in 0.6s ease' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.25)',
              borderRadius: 20, padding: '6px 14px', marginBottom: 28,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', animation: 'pulse-red 2s infinite' }} />
              <span style={{ fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--red)' }}>
                AI-Powered Safety for Prayagraj
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 6vw, 72px)',
              fontWeight: 700, lineHeight: 1.05, letterSpacing: '-1px', marginBottom: 24,
            }}>
              Navigate Prayagraj<br />
              <span style={{
                background: 'linear-gradient(90deg, var(--red), var(--violet-light))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Safely & Confidently</span>
            </h1>

            <p style={{ fontSize: 18, color: 'var(--text-2)', lineHeight: 1.8, maxWidth: 540, marginBottom: 36 }}>
              Real-time crime heatmaps, XGBoost safety predictions, one-tap SOS alerts, 
              and route deviation monitoring — built for women, children, and all citizens of Prayagraj.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
              {isAuthenticated ? (
                <>
                  <Link to="/route"     className="btn btn-primary btn-lg">🗺️ Check My Route</Link>
                  <Link to="/dashboard" className="btn btn-outline btn-lg">📊 View Dashboard</Link>
                </>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary btn-lg">🛡️ Get Protected Free</Link>
                  <Link to="/login"  className="btn btn-outline btn-lg">Login</Link>
                </>
              )}
            </div>

            {/* Mini stats row */}
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {STATS.map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative map-like circles */}
        <div style={{ position: 'absolute', right: '5%', top: '15%', opacity: 0.12, pointerEvents: 'none' }}>
          {[200, 140, 80].map((r, i) => (
            <div key={r} style={{
              position: 'absolute', width: r * 2, height: r * 2, borderRadius: '50%',
              border: `1px solid ${i === 0 ? 'var(--red)' : i === 1 ? 'var(--violet)' : 'var(--amber)'}`,
              top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              animation: `spin ${8 + i * 4}s linear infinite`,
            }} />
          ))}
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--red)', position: 'absolute', top: '47%', left: '48%', boxShadow: '0 0 20px var(--red)' }} />
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="section-title" style={{ justifyContent: 'center' }}>How SafePrayag Works</div>
            <div style={{ width: 40, height: 3, background: 'var(--red)', borderRadius: 2, margin: '10px auto 16px' }} />
            <p style={{ color: 'var(--text-2)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
              From registration to live tracking — four steps to full safety coverage
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="card" style={{
                animation: `fade-in 0.4s ease ${i * 0.1}s both`,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: -10, right: -10,
                  fontFamily: 'var(--font-display)', fontSize: 80, fontWeight: 900,
                  opacity: 0.04, lineHeight: 1, userSelect: 'none', color: 'var(--red)',
                }}>{step.step}</div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                  letterSpacing: 2, color: 'var(--red)', marginBottom: 12, textTransform: 'uppercase',
                }}>Step {step.step}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', background: 'rgba(255,59,92,0.02)' }}>
        <div className="container">
          <div style={{ marginBottom: 48 }}>
            <div className="section-title">Platform Features</div>
            <div className="section-divider" />
            <p className="section-subtitle">Everything you need to stay safe in Prayagraj</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 24, transition: 'all 0.2s',
                animation: `fade-in 0.4s ease ${i * 0.08}s both`, cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,59,92,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(123,47,190,0.15), rgba(255,59,92,0.1))',
            border: '1px solid rgba(255,59,92,0.2)', borderRadius: 20,
            padding: '60px 32px',
          }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🛡️</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, marginBottom: 16 }}>
              Start Your Protection Today
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: 16, maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.7 }}>
              Join thousands of Prayagraj residents who use SafePrayag to navigate safely every day.
              100% free. No ads. Always protected.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              {isAuthenticated ? (
                <Link to="/route" className="btn btn-primary btn-lg">🗺️ Check a Route Now</Link>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary btn-lg">Create Free Account</Link>
                  <a href="tel:1091" className="btn btn-outline btn-lg">📞 Women Helpline: 1091</a>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
