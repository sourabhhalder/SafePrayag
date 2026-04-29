import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard, reportIncident } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';

const COLORS = ['#FF3B5C','#7B2FBE','#F5A623','#00E676','#00B0FF','#FF6B9D','#C084FC','#34D399'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <div style={{ fontFamily: 'var(--font-cond)', letterSpacing: 1, textTransform: 'uppercase', fontSize: 11, color: 'var(--text-2)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || 'var(--text)', fontWeight: 600 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({
    lat: '', lon: '', crime_type: 'Assault', severity: 3,
    description: '', time_of_day: 'Evening', area: ''
  });
  const [reportMsg, setReportMsg] = useState('');

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const submitReport = async e => {
    e.preventDefault();
    try {
      await reportIncident({
        ...reportForm,
        lat: parseFloat(reportForm.lat),
        lon: parseFloat(reportForm.lon),
        severity: parseInt(reportForm.severity),
      });
      setReportMsg('✅ Incident reported. Thank you for keeping Prayagraj safer!');
      setShowReport(false);
      setReportForm({ lat: '', lon: '', crime_type: 'Assault', severity: 3, description: '', time_of_day: 'Evening', area: '' });
    } catch (e) {
      setReportMsg('❌ ' + (e.response?.data?.detail || 'Report failed'));
    }
  };

  if (loading) return (
    <div className="loading-center page-main">
      <div className="spinner" />
      <p>Loading dashboard…</p>
    </div>
  );

  if (!data) return (
    <div className="loading-center page-main">
      <p style={{ color: 'var(--red)' }}>Failed to load dashboard. Is the backend running on port 8000?</p>
    </div>
  );

  const statusColor = s => s === 'Safe' ? 'var(--green)' : s === 'Moderate Risk' ? 'var(--amber)' : 'var(--red)';

  return (
    <main className="page-main">
      <div className="container">
        <div style={{ animation: 'fade-in 0.4s ease' }}>

          {/* Page Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 className="section-title">📊 Safety Dashboard</h1>
              <div className="section-divider" />
              <p className="section-subtitle">Prayagraj crime analytics — powered by live XGBoost model</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowReport(true)} className="btn btn-outline btn-sm">📋 Report Incident</button>
              <Link to="/route" className="btn btn-primary btn-sm">🗺️ Check Route</Link>
            </div>
          </div>

          {reportMsg && <div className="alert alert-success" style={{ marginBottom: 16 }}>{reportMsg}</div>}

          {/* Global Stats */}
          <div className="grid-4" style={{ marginBottom: 28 }}>
            {[
              { label: 'Total Crime Records',  value: data.total_crimes?.toLocaleString(),          icon: '📊', color: 'red-accent'    },
              { label: 'High Risk Incidents',   value: data.high_risk_incidents?.toLocaleString(),   icon: '⚠️',  color: 'amber-accent'  },
              { label: 'Platform Users',        value: data.total_users?.toLocaleString(),           icon: '👤', color: 'violet-accent' },
              { label: 'SOS Events Total',      value: data.sos_events_total?.toLocaleString(),      icon: '🆘', color: 'green-accent'  },
            ].map(s => (
              <div key={s.label} className={`stat-card ${s.color}`}>
                <div className="stat-number">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-icon">{s.icon}</div>
              </div>
            ))}
          </div>

          {/* My Activity */}
          <div className="grid-3" style={{ marginBottom: 28 }}>
            {[
              { label: 'My Routes Checked',     value: data.my_stats?.routes_checked,     icon: '🗺️', color: 'var(--violet-light)' },
              { label: 'My SOS Used',           value: data.my_stats?.sos_used,           icon: '🆘', color: 'var(--red)'          },
              { label: 'My Incidents Reported', value: data.my_stats?.incidents_reported, icon: '📋', color: 'var(--amber)'        },
            ].map(s => (
              <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 32 }}>{s.icon}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: s.color }}>{s.value ?? 0}</div>
                  <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--text-2)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid-2" style={{ marginBottom: 24 }}>
            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>Crime by Type</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.crime_by_type} layout="vertical" barSize={14}>
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-2)', fontSize: 11 }} width={90} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" name="Incidents" radius={[0, 4, 4, 0]}>
                    {data.crime_by_type?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>Crime by Time of Day</div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={data.crime_by_time}
                    dataKey="count"
                    nameKey="time"
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={3}
                    label={({ time, percent }) => `${time} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.crime_by_time?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid-2" style={{ marginBottom: 24 }}>
            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>Severity Distribution</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.crime_by_severity} barSize={32}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="severity" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" name="Incidents" radius={[4, 4, 0, 0]}>
                    {data.crime_by_severity?.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>Target Groups</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.target_groups} barSize={20}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="group" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" name="Incidents" radius={[4, 4, 0, 0]}>
                    {data.target_groups?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feature Importance */}
          {data.feature_importance?.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>🤖 XGBoost Model — Feature Importance</div>
              {data.feature_importance.map(fi => (
                <div key={fi.feature} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: 0.8, color: 'var(--text-2)' }}>{fi.feature}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{fi.importance}%</span>
                  </div>
                  <div style={{ background: 'var(--bg-2)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${fi.importance}%`, height: '100%', background: 'linear-gradient(90deg, var(--red), var(--violet))', borderRadius: 4, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Routes */}
          {data.recent_routes?.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>My Recent Route Checks</div>
                <Link to="/route" className="btn btn-outline btn-sm">+ New Check</Link>
              </div>
              {data.recent_routes.map((r, i) => (
                <div key={i} style={{
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '12px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  flexWrap: 'wrap', gap: 10, marginBottom: 8,
                }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontFamily: 'var(--font-cond)', fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
                      {r.from_address || 'Origin'} → {r.to_address || 'Destination'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(r.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: statusColor(r.status) }}>
                      {r.safety_score}
                    </div>
                    <span className={`badge ${r.status === 'Safe' ? 'badge-safe' : r.status === 'Moderate Risk' ? 'badge-warn' : 'badge-danger'}`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReport && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }} onClick={() => setShowReport(false)}>
          <div className="card" style={{ maxWidth: 480, width: '100%', animation: 'fade-in 0.3s ease' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>📋 Report an Incident</div>
            <form onSubmit={submitReport}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input className="form-input" type="number" step="any" placeholder="25.4484"
                    value={reportForm.lat} onChange={e => setReportForm(f => ({ ...f, lat: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input className="form-input" type="number" step="any" placeholder="81.8322"
                    value={reportForm.lon} onChange={e => setReportForm(f => ({ ...f, lon: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Crime Type</label>
                  <select className="form-select" value={reportForm.crime_type}
                    onChange={e => setReportForm(f => ({ ...f, crime_type: e.target.value }))}>
                    {['Assault','Robbery','Harassment','Theft','Eve Teasing','Domestic Violence','Stalking','Other'].map(ct => <option key={ct}>{ct}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Severity (1–5)</label>
                  <input className="form-input" type="number" min={1} max={5}
                    value={reportForm.severity} onChange={e => setReportForm(f => ({ ...f, severity: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Time of Day</label>
                  <select className="form-select" value={reportForm.time_of_day}
                    onChange={e => setReportForm(f => ({ ...f, time_of_day: e.target.value }))}>
                    {['Morning','Afternoon','Evening','Night','Late Night'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Area</label>
                  <input className="form-input" type="text" placeholder="Civil Lines, Prayagraj"
                    value={reportForm.area} onChange={e => setReportForm(f => ({ ...f, area: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="form-input" type="text" placeholder="Brief description…"
                  value={reportForm.description} onChange={e => setReportForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Report</button>
                <button type="button" onClick={() => setShowReport(false)} className="btn btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
