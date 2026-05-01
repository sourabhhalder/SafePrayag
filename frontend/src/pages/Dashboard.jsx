import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard, getExtraStats, reportIncident } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, LineChart, Line,
  AreaChart, Area, Legend,
} from 'recharts';

const C = ['#FF3B5C','#7B2FBE','#F5A623','#00E676','#00B0FF','#FF6B9D','#C084FC','#34D399','#FCD34D','#F87171'];

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',fontSize:12 }}>
      <div style={{ color:'var(--text-2)',marginBottom:4,fontFamily:'var(--font-cond)',letterSpacing:1,textTransform:'uppercase',fontSize:11 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color: p.color || 'var(--text)', fontWeight:600 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

const Card = ({ title, children, style }) => (
  <div className="card" style={style}>
    <div style={{ fontFamily:'var(--font-display)',fontWeight:700,marginBottom:18,fontSize:15 }}>{title}</div>
    {children}
  </div>
);

export default function Dashboard() {
  const [data,    setData]    = useState(null);
  const [extra,   setExtra]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({
    lat:'', lon:'', crime_type:'Assault', severity:3, description:'', time_of_day:'Evening', area:''
  });
  const [reportMsg, setReportMsg] = useState('');

  useEffect(() => {
    Promise.all([getDashboard(), getExtraStats()])
      .then(([d, e]) => { setData(d.data); setExtra(e.data); })
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
      setReportMsg('✅ Incident reported. Model will retrain with new data!');
      setShowReport(false);
    } catch (err) {
      setReportMsg('❌ ' + (err.response?.data?.detail || 'Report failed'));
    }
  };

  if (loading) return (
    <div className="loading-center page-main">
      <div className="spinner" /><p>Loading dashboard…</p>
    </div>
  );
  if (!data) return (
    <div className="loading-center page-main">
      <p style={{ color:'var(--red)' }}>Dashboard failed to load. Is the backend running on port 8000?</p>
    </div>
  );

  const sc = s => s === 'Safe' ? 'var(--green)' : s === 'Moderate Risk' ? 'var(--amber)' : 'var(--red)';

  // Build stacked area/crime-by-area data
  let areaCrimeData = [];
  let crimeTypes = [];
  if (extra?.area_crime?.length) {
    const areaMap = {};
    const ctSet = new Set();
    extra.area_crime.forEach(r => {
      if (!areaMap[r.area]) areaMap[r.area] = { area: r.area };
      areaMap[r.area][r.crime_type] = (areaMap[r.area][r.crime_type] || 0) + r.count;
      ctSet.add(r.crime_type);
    });
    // Top 6 areas by total
    areaCrimeData = Object.values(areaMap)
      .map(a => ({ ...a, _total: Object.values(a).filter(v => typeof v === 'number').reduce((s,v) => s+v, 0) }))
      .sort((a,b) => b._total - a._total)
      .slice(0, 6);
    crimeTypes = [...ctSet].slice(0, 6);
  }

  return (
    <main className="page-main">
      <div className="container">
        <div style={{ animation:'fade-in 0.4s ease' }}>

          {/* Header */}
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:32,flexWrap:'wrap',gap:16 }}>
            <div>
              <h1 className="section-title">📊 Safety Dashboard</h1>
              <div className="section-divider" />
              <p className="section-subtitle">Prayagraj crime analytics — live XGBoost model</p>
            </div>
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={() => setShowReport(true)} className="btn btn-outline btn-sm">📋 Report Incident</button>
              <Link to="/route" className="btn btn-primary btn-sm">🗺️ Check Route</Link>
            </div>
          </div>

          {reportMsg && <div className="alert alert-success" style={{ marginBottom:16 }}>{reportMsg}</div>}

          {/* ── Global Stats ── */}
          <div className="grid-4" style={{ marginBottom:24 }}>
            {[
              { label:'Total Crimes',        value: data.total_crimes?.toLocaleString(),        icon:'📊', color:'red-accent'    },
              { label:'High Risk Incidents', value: data.high_risk_incidents?.toLocaleString(), icon:'⚠️', color:'amber-accent'  },
              { label:'Platform Users',      value: data.total_users?.toLocaleString(),         icon:'👤', color:'violet-accent' },
              { label:'SOS Events',          value: data.sos_events_total?.toLocaleString(),    icon:'🆘', color:'green-accent'  },
            ].map(s => (
              <div key={s.label} className={`stat-card ${s.color}`}>
                <div className="stat-number">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-icon">{s.icon}</div>
              </div>
            ))}
          </div>

          {/* ── My Stats ── */}
          <div className="grid-3" style={{ marginBottom:24 }}>
            {[
              { label:'My Routes Checked',     value: data.my_stats?.routes_checked,     icon:'🗺️', color:'var(--violet-light)' },
              { label:'My SOS Used',           value: data.my_stats?.sos_used,           icon:'🆘', color:'var(--red)'          },
              { label:'My Incidents Reported', value: data.my_stats?.incidents_reported, icon:'📋', color:'var(--amber)'        },
            ].map(s => (
              <div key={s.label} className="card" style={{ display:'flex',alignItems:'center',gap:16 }}>
                <div style={{ fontSize:32 }}>{s.icon}</div>
                <div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:30,fontWeight:700,color:s.color }}>{s.value ?? 0}</div>
                  <div style={{ fontFamily:'var(--font-cond)',fontSize:11,letterSpacing:1.2,textTransform:'uppercase',color:'var(--text-2)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── ROW 1: Crime Distribution (Donut) + Time of Day ── */}
          <div className="grid-2" style={{ marginBottom:24 }}>
            <Card title="🍩 Crime Distribution (All Types)">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data.crime_by_type} dataKey="count" nameKey="name"
                    cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={2}>
                    {data.crime_by_type?.map((_,i) => <Cell key={i} fill={C[i % C.length]} />)}
                  </Pie>
                  <Tooltip content={<TT />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize:11, color:'var(--text-2)' }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card title="🕐 Time-wise Crime Distribution">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.crime_by_time} barSize={38}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill:'var(--text-muted)',fontSize:11 }} axisLine={false} />
                  <YAxis tick={{ fill:'var(--text-muted)',fontSize:11 }} axisLine={false} />
                  <Tooltip content={<TT />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" name="Crimes" radius={[4,4,0,0]}>
                    {data.crime_by_time?.map((d,i) => (
                      <Cell key={i} fill={d.time === 'Night' || d.time === 'Late Night' ? '#FF3B5C' : C[i % C.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* ── ROW 2: Monthly Trend + Day-wise ── */}
          <div className="grid-2" style={{ marginBottom:24 }}>
            <Card title="📈 Monthly Crime Trend">
              {extra?.monthly_trend?.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={extra.monthly_trend}>
                    <defs>
                      <linearGradient id="mgr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#7B2FBE" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#7B2FBE" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill:'var(--text-muted)',fontSize:10 }} axisLine={false}
                      tickFormatter={v => v?.slice(5) || v} />
                    <YAxis tick={{ fill:'var(--text-muted)',fontSize:10 }} axisLine={false} />
                    <Tooltip content={<TT />} />
                    <Area type="monotone" dataKey="count" name="Crimes" stroke="#7B2FBE" strokeWidth={2} fill="url(#mgr)" dot={{ r:3, fill:'#7B2FBE' }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color:'var(--text-muted)',fontSize:13,textAlign:'center',padding:'40px 0' }}>
                  No monthly data yet — add date-formatted crime records
                </div>
              )}
            </Card>

            <Card title="📅 Day-wise Crime Distribution">
              {extra?.day_wise?.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={extra.day_wise} barSize={30}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill:'var(--text-muted)',fontSize:10 }} axisLine={false}
                      tickFormatter={v => v?.slice(0,3)} />
                    <YAxis tick={{ fill:'var(--text-muted)',fontSize:10 }} axisLine={false} />
                    <Tooltip content={<TT />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="count" name="Crimes" radius={[4,4,0,0]}>
                      {extra.day_wise?.map((_,i) => <Cell key={i} fill={C[i % C.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color:'var(--text-muted)',fontSize:13,textAlign:'center',padding:'40px 0' }}>
                  No day-wise data available
                </div>
              )}
            </Card>
          </div>

          {/* ── ROW 3: Top 10 Police Stations + Severity ── */}
          <div className="grid-2" style={{ marginBottom:24 }}>
            <Card title="🚔 Top 10 Police Stations by Crime Count">
              {extra?.police_stats?.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={extra.police_stats} layout="vertical" barSize={14}>
                    <XAxis type="number" tick={{ fill:'var(--text-muted)',fontSize:10 }} axisLine={false} />
                    <YAxis dataKey="station" type="category" tick={{ fill:'var(--text-2)',fontSize:10 }} width={110} axisLine={false}
                      tickFormatter={v => v?.replace(' PS','')?.replace(' Police Station','')} />
                    <Tooltip content={<TT />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="count" name="Crimes" radius={[0,4,4,0]}>
                      {extra.police_stats?.map((_,i) => <Cell key={i} fill={C[i % C.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color:'var(--text-muted)',fontSize:13,textAlign:'center',padding:'40px 0' }}>
                  No police station data — add police_station field to crime records
                </div>
              )}
            </Card>

            <Card title="⚠️ Severity Distribution">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.crime_by_severity} barSize={40}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="severity" tick={{ fill:'var(--text-muted)',fontSize:12 }} axisLine={false}
                    label={{ value:'Severity Level', position:'insideBottom', offset:-4, fill:'var(--text-muted)',fontSize:11 }} />
                  <YAxis tick={{ fill:'var(--text-muted)',fontSize:11 }} axisLine={false} />
                  <Tooltip content={<TT />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" name="Incidents" radius={[4,4,0,0]}>
                    {data.crime_by_severity?.map((_,i) => <Cell key={i} fill={C[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* ── ROW 4: Crime Type by Area (Stacked Bar) ── */}
          {areaCrimeData.length > 0 && (
            <Card title="🏘️ Crime Type Distribution by Area (Top 6 Areas)" style={{ marginBottom:24 }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={areaCrimeData} barSize={28}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="area" tick={{ fill:'var(--text-muted)',fontSize:10 }} axisLine={false}
                    tickFormatter={v => v?.split(' ').slice(0,2).join(' ')} />
                  <YAxis tick={{ fill:'var(--text-muted)',fontSize:10 }} axisLine={false} />
                  <Tooltip content={<TT />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize:11,color:'var(--text-2)' }} />
                  {crimeTypes.map((ct, i) => (
                    <Bar key={ct} dataKey={ct} stackId="a" fill={C[i % C.length]}
                      radius={i === crimeTypes.length-1 ? [4,4,0,0] : [0,0,0,0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* ── ROW 5: Top 10 Crime Hotspots ── */}
          {data.top_hotspots?.length > 0 && (
            <Card title="🔥 Top 10 Crime Hotspot Areas" style={{ marginBottom:24 }}>
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {data.top_hotspots.map((h, i) => (
                  <div key={i} style={{
                    display:'flex',alignItems:'center',gap:12,
                    background:'var(--bg-2)',borderRadius:8,padding:'10px 14px',
                  }}>
                    <div style={{
                      width:28,height:28,borderRadius:'50%',
                      background: i < 3 ? 'var(--red)' : i < 6 ? 'var(--amber)' : 'var(--violet)',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontFamily:'var(--font-display)',fontWeight:700,fontSize:13,color:'white',flexShrink:0,
                    }}>#{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:'var(--font-cond)',fontWeight:600,fontSize:13 }}>{h.area}</div>
                      <div style={{ fontSize:11,color:'var(--text-muted)' }}>Top crime: {h.top_crime}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:18,
                        color: i < 3 ? 'var(--red)' : i < 6 ? 'var(--amber)' : 'var(--violet)' }}>
                        {h.count}
                      </div>
                      <div style={{ fontSize:10,color:'var(--text-muted)' }}>incidents</div>
                    </div>
                    {/* Bar fill */}
                    <div style={{ width:80,background:'var(--bg-card)',borderRadius:4,height:6 }}>
                      <div style={{
                        width: `${Math.round((h.count / (data.top_hotspots[0]?.count || 1)) * 100)}%`,
                        height:'100%',borderRadius:4,
                        background: i < 3 ? 'var(--red)' : i < 6 ? 'var(--amber)' : 'var(--violet)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ── ROW 6: XGBoost Feature Importance ── */}
          {data.feature_importance?.length > 0 && (
            <Card title="🤖 XGBoost Model — Feature Importance" style={{ marginBottom:24 }}>
              {data.feature_importance.map(fi => (
                <div key={fi.feature} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                    <span style={{ fontFamily:'var(--font-cond)',fontSize:12,color:'var(--text-2)' }}>{fi.feature}</span>
                    <span style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:14 }}>{fi.importance}%</span>
                  </div>
                  <div style={{ background:'var(--bg-2)',borderRadius:4,height:8,overflow:'hidden' }}>
                    <div style={{
                      width:`${fi.importance}%`,height:'100%',
                      background:'linear-gradient(90deg,var(--red),var(--violet))',
                      borderRadius:4,transition:'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* ── ROW 7: Target Groups + Recent Routes ── */}
          <div className="grid-2" style={{ marginBottom:24 }}>
            <Card title="👥 Target Groups">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.target_groups} barSize={22}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="group" tick={{ fill:'var(--text-muted)',fontSize:9 }} axisLine={false}
                    tickFormatter={v => v?.split(' ').slice(0,2).join(' ')} />
                  <YAxis tick={{ fill:'var(--text-muted)',fontSize:10 }} axisLine={false} />
                  <Tooltip content={<TT />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" name="Incidents" radius={[4,4,0,0]}>
                    {data.target_groups?.map((_,i) => <Cell key={i} fill={C[i % C.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {data.recent_routes?.length > 0 && (
              <Card title="🗺️ My Recent Routes">
                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {data.recent_routes.map((r,i) => (
                    <div key={i} style={{
                      background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:8,
                      padding:'10px 14px',display:'flex',justifyContent:'space-between',
                      alignItems:'center',flexWrap:'wrap',gap:8,
                    }}>
                      <div style={{ flex:1,minWidth:140 }}>
                        <div style={{ fontFamily:'var(--font-cond)',fontSize:12,fontWeight:600,marginBottom:2 }}>
                          {r.from_address || 'Origin'} → {r.to_address || 'Destination'}
                        </div>
                        <div style={{ fontSize:10,color:'var(--text-muted)' }}>
                          {new Date(r.timestamp).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'})}
                        </div>
                      </div>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <span style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:18,color:sc(r.status) }}>{r.safety_score}</span>
                        <span className={`badge ${r.status==='Safe'?'badge-safe':r.status==='Moderate Risk'?'badge-warn':'badge-danger'}`}>{r.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/route" className="btn btn-outline btn-sm" style={{ marginTop:12,display:'inline-flex' }}>+ New Check</Link>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ── Report Incident Modal ── */}
      {showReport && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:20 }}
          onClick={() => setShowReport(false)}>
          <div className="card" style={{ maxWidth:480,width:'100%',animation:'fade-in 0.3s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily:'var(--font-display)',fontSize:20,fontWeight:700,marginBottom:20 }}>📋 Report an Incident</div>
            <form onSubmit={submitReport}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px' }}>
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input className="form-input" type="number" step="any" placeholder="25.4484"
                    value={reportForm.lat} onChange={e => setReportForm(f=>({...f,lat:e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input className="form-input" type="number" step="any" placeholder="81.8322"
                    value={reportForm.lon} onChange={e => setReportForm(f=>({...f,lon:e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Crime Type</label>
                  <select className="form-select" value={reportForm.crime_type}
                    onChange={e => setReportForm(f=>({...f,crime_type:e.target.value}))}>
                    {['Assault','Robbery','Harassment','Theft','Eve Teasing','Domestic Violence','Stalking','Other'].map(ct => <option key={ct}>{ct}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Severity (1–5)</label>
                  <input className="form-input" type="number" min={1} max={5}
                    value={reportForm.severity} onChange={e => setReportForm(f=>({...f,severity:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Time of Day</label>
                  <select className="form-select" value={reportForm.time_of_day}
                    onChange={e => setReportForm(f=>({...f,time_of_day:e.target.value}))}>
                    {['Morning','Afternoon','Evening','Night','Late Night'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Area</label>
                  <input className="form-input" type="text" placeholder="Civil Lines, Prayagraj"
                    value={reportForm.area} onChange={e => setReportForm(f=>({...f,area:e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="form-input" type="text" placeholder="Brief description…"
                  value={reportForm.description} onChange={e => setReportForm(f=>({...f,description:e.target.value}))} />
              </div>
              <div style={{ display:'flex',gap:10 }}>
                <button type="submit" className="btn btn-primary" style={{ flex:1 }}>Submit Report</button>
                <button type="button" onClick={() => setShowReport(false)} className="btn btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
