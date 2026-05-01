import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { analyseRoute, getPoliceStations } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SOSButton from '../components/SOSButton';

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const policeIcon = new L.DivIcon({
  html: '<div style="background:rgba(0,176,255,0.9);width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 8px rgba(0,176,255,0.5)"></div>',
  iconSize: [14, 14], iconAnchor: [7, 7], className: '',
});
const fromIcon = new L.DivIcon({
  html: '<div style="background:#00E676;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(0,230,118,0.7)"></div>',
  iconSize: [14, 14], iconAnchor: [7, 7], className: '',
});
const toIcon = new L.DivIcon({
  html: '<div style="background:#FF3B5C;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(255,59,92,0.7)"></div>',
  iconSize: [14, 14], iconAnchor: [7, 7], className: '',
});
const userIcon = new L.DivIcon({
  html: '<div style="background:#7B2FBE;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 16px rgba(123,47,190,0.9)"></div>',
  iconSize: [16, 16], iconAnchor: [8, 8], className: '',
});

function FlyTo({ coords }) {
  const map = useMap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (coords) map.flyTo(coords, 14, { animate: true, duration: 1.2 });
  }, [coords]); // map reference is stable — intentionally omitted
  return null;
}

const PRAYAGRAJ_CENTER = [25.4358, 81.8463];

async function geocode(q) {
  if (!q) return null;
  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ', Prayagraj, UP, India')}&format=json&limit=1`);
    const data = await res.json();
    if (data?.length) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch (e) {
    console.error('Geocode error:', e);
  }
  return null;
}

export default function RouteEnquiry() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    from_address: '',
    to_address:   '',
    time_of_day:  'Evening',
    gender:       user?.gender    || 'Female',
    age_group:    user?.age_group || 'Adult',
  });
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords,   setToCoords]   = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [routeResult, setRouteResult] = useState(null);
  const [routePath, setRoutePath]   = useState(null);
  const [police, setPolice]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [err, setErr]               = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [flyTo, setFlyTo]           = useState(null);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const getMyLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const c = [pos.coords.latitude, pos.coords.longitude];
        setUserCoords(c);
        setFromCoords(c);
        setForm(f => ({ ...f, from_address: `My Location (${c[0].toFixed(4)}, ${c[1].toFixed(4)})` }));
        setFlyTo(c);
        getPoliceStations(c[0], c[1]).then(r => setPolice(r.data)).catch(() => {});
        setLocLoading(false);
      },
      () => { setLocLoading(false); setErr('Location access denied. Please allow location in your browser.'); }
    );
  };

  const analyse = async e => {
    e.preventDefault();
    setErr(''); setLoading(true); setRouteResult(null);
    try {
      let fc = fromCoords;
      let tc = toCoords;
      if (!fc) fc = await geocode(form.from_address);
      if (!tc) tc = await geocode(form.to_address);

      if (!fc || !tc) {
        setErr('Could not locate one or both addresses. Try adding "Prayagraj" to the address.');
        setLoading(false);
        return;
      }
      setFromCoords(fc); setToCoords(tc);
      setFlyTo([(fc[0] + tc[0]) / 2, (fc[1] + tc[1]) / 2]);

      const res = await analyseRoute({
        from_lat: fc[0], from_lon: fc[1],
        to_lat:   tc[0], to_lon:   tc[1],
        from_address: form.from_address,
        to_address:   form.to_address,
        time_of_day:  form.time_of_day,
        gender:       form.gender,
        age_group:    form.age_group,
      });
      setRouteResult(res.data);

      // Extract OSRM route geometry
      const coords = res.data.route?.routes?.[0]?.geometry?.coordinates;
      if (coords) setRoutePath(coords.map(([lon, lat]) => [lat, lon]));

      // Load nearby police stations
      const ps = await getPoliceStations(fc[0], fc[1]);
      setPolice(ps.data.slice(0, 5));
    } catch (e) {
      setErr(e.response?.data?.detail || 'Analysis failed. Make sure the backend is running on port 8000.');
    } finally { setLoading(false); }
  };

  const score       = routeResult?.safety_score;
  const scoreColor  = !score ? '#888' : score > 65 ? 'var(--red)' : score > 35 ? 'var(--amber)' : 'var(--green)';
  const badgeClass  = !score ? '' : score > 65 ? 'badge-danger' : score > 35 ? 'badge-warn' : 'badge-safe';

  return (
    <main className="page-main">
      <div className="container">
        <div style={{ marginBottom: 28, animation: 'fade-in 0.4s ease' }}>
          <h1 className="section-title">🗺️ Route Safety Check</h1>
          <div className="section-divider" />
          <p className="section-subtitle">AI-powered crime risk analysis with live Prayagraj map</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: 24,
          alignItems: 'start',
        }}>

          {/* ── Left Panel ───────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'slide-in 0.4s ease' }}>

            {/* Enquiry Form */}
            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>
                Enter Your Journey
              </div>
              {err && <div className="alert alert-error">{err}</div>}
              <form onSubmit={analyse}>
                <div className="form-group">
                  <label className="form-label">From (Origin)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" placeholder="Civil Lines, Prayagraj"
                      value={form.from_address} onChange={set('from_address')} required style={{ flex: 1 }} />
                    <button type="button" onClick={getMyLocation} disabled={locLoading}
                      className="btn btn-outline btn-sm" title="Use my location"
                      style={{ flexShrink: 0, padding: '0 12px' }}>
                      {locLoading ? '⏳' : '📍'}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">To (Destination)</label>
                  <input className="form-input" placeholder="Naini, Prayagraj"
                    value={form.to_address} onChange={set('to_address')} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <select className="form-select" value={form.time_of_day} onChange={set('time_of_day')}>
                      {['Morning','Afternoon','Evening','Night','Late Night'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="form-select" value={form.gender} onChange={set('gender')}>
                      {['Female','Male','Other'].map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Age Group</label>
                    <select className="form-select" value={form.age_group} onChange={set('age_group')}>
                      {['Child','Teen','Adult','Senior'].map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-full"
                  disabled={loading} style={{ fontSize: 15, letterSpacing: 0.5 }}>
                  {loading ? '⏳ Analysing…' : '🔍 Analyse Route Safety'}
                </button>
              </form>
            </div>

            {/* Result Card */}
            {routeResult && (
              <div className="card card-glow" style={{ animation: 'fade-in 0.5s ease' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                    {score}
                  </div>
                  <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: 2, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 8 }}>
                    Safety Score / 100
                  </div>
                  <span className={`badge ${badgeClass}`} style={{ fontSize: 14, padding: '6px 16px' }}>
                    {routeResult.status}
                  </span>
                </div>

                {/* Distance + Travel Time */}
                {routeResult.route?.routes?.[0] && (() => {
                  const distM = routeResult.route.routes[0].distance;
                  const distKm = (distM / 1000).toFixed(1);
                  const bikeMin = Math.round((distM / 1000) / 20 * 60);
                  const taxiMin = Math.round((distM / 1000) / 28 * 60);
                  const fmt = m => m < 60 ? `${m} min` : `${Math.floor(m/60)}h ${m%60}min`;
                  return (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
                      <div style={{ background:'var(--bg-2)', borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
                        <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:20, color:'var(--bl, #00B0FF)' }}>{distKm} km</div>
                        <div style={{ fontFamily:'var(--font-cond)', fontSize:10, letterSpacing:.8, color:'var(--text-muted)', textTransform:'uppercase', marginTop:2 }}>Distance</div>
                      </div>
                      <div style={{ background:'var(--bg-2)', borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
                        <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:20, color:'var(--amber)' }}>{fmt(bikeMin)}</div>
                        <div style={{ fontFamily:'var(--font-cond)', fontSize:10, letterSpacing:.8, color:'var(--text-muted)', textTransform:'uppercase', marginTop:2 }}>🛵 Bike / Auto</div>
                      </div>
                      <div style={{ background:'var(--bg-2)', borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
                        <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:20, color:'var(--green)' }}>{fmt(taxiMin)}</div>
                        <div style={{ fontFamily:'var(--font-cond)', fontSize:10, letterSpacing:.8, color:'var(--text-muted)', textTransform:'uppercase', marginTop:2 }}>🚕 Taxi / Car</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Segment scores */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    ['Origin',      routeResult.from_safety],
                    ['Midpoint',    routeResult.mid_safety],
                    ['Destination', routeResult.to_safety],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: 'var(--bg-2)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: val > 65 ? 'var(--red)' : val > 35 ? 'var(--amber)' : 'var(--green)' }}>{val}</div>
                      <div style={{ fontFamily: 'var(--font-cond)', fontSize: 10, letterSpacing: 0.8, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Precautions */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Precautions</div>
                  {routeResult.precautions?.map((p, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--text-2)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>{p}</div>
                  ))}
                </div>

                {/* Recommendations */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Recommendations</div>
                  {routeResult.recommendations?.map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--text-2)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>{r}</div>
                  ))}
                </div>

                {/* Nearest Police */}
                {routeResult.nearest_police_stations?.length > 0 && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Nearest Police Stations</div>
                    {routeResult.nearest_police_stations.slice(0, 2).map(ps => (
                      <a key={ps.name} href={`tel:${ps.phone}`} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'var(--bg-2)', border: '1px solid var(--border)',
                        borderRadius: 6, padding: '8px 12px', marginBottom: 6, textDecoration: 'none',
                      }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 600, fontSize: 12, color: 'var(--text)' }}>🚔 {ps.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ps.distance_km?.toFixed(1)} km away</div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--amber)', fontSize: 14 }}>📞 {ps.phone}</div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Map ───────────────────────────────────────────────── */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div style={{ height: '75vh', minHeight: 480, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
              <MapContainer center={PRAYAGRAJ_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap contributors"
                />
                {flyTo && <FlyTo coords={flyTo} />}
                {fromCoords && (
                  <Marker position={fromCoords} icon={fromIcon}>
                    <Popup><strong>Origin</strong><br />{form.from_address}</Popup>
                  </Marker>
                )}
                {toCoords && (
                  <Marker position={toCoords} icon={toIcon}>
                    <Popup><strong>Destination</strong><br />{form.to_address}</Popup>
                  </Marker>
                )}
                {userCoords && (
                  <Marker position={userCoords} icon={userIcon}>
                    <Popup>📍 Your Current Location</Popup>
                  </Marker>
                )}
                {routePath && (
                  <Polyline
                    positions={routePath}
                    pathOptions={{
                      color:   score > 65 ? '#FF3B5C' : score > 35 ? '#F5A623' : '#00E676',
                      weight:  4,
                      opacity: 0.85,
                    }}
                  />
                )}
                {/* Crime hotspots */}
                {routeResult?.crimes_near_route?.map((c, i) => (
                  <Circle key={i} center={[c.latitude, c.longitude]} radius={80}
                    pathOptions={{ color: 'var(--red)', fillColor: 'var(--red)', fillOpacity: 0.25, weight: 1 }}>
                    <Popup>
                      <strong>⚠️ {c.crime_type}</strong><br />
                      Severity: {c.severity}<br />
                      {c.time_of_day}
                    </Popup>
                  </Circle>
                ))}
                {/* Police stations */}
                {police.map(ps => (
                  <Marker key={ps.name} position={[ps.lat, ps.lon]} icon={policeIcon}>
                    <Popup>
                      <strong>🚔 {ps.name}</strong><br />
                      📞 {ps.phone}
                      {ps.distance_km ? `\n${ps.distance_km.toFixed(1)} km away` : ''}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Map Legend */}
            <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { color: '#00E676',              label: 'Safe Route'          },
                { color: '#F5A623',              label: 'Moderate Risk Route' },
                { color: '#FF3B5C',              label: 'High Risk Route'     },
                { color: 'rgba(255,59,92,0.4)',  label: 'Crime Hotspot'       },
                { color: '#00B0FF',              label: 'Police Station'      },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SOSButton routeId={routeResult?.route_id} />
    </main>
  );
}
