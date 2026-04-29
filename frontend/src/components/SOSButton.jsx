import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { triggerSOS, sendLocation } from '../services/api';

export default function SOSButton({ routeId }) {
  const { isAuthenticated } = useAuth();
  const [active, setActive] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [sosResult, setSosResult] = useState(null);
  const [devAlert, setDevAlert] = useState(false);
  const watchId = useRef(null);

  // Start location tracking when tracking is on
  useEffect(() => {
    if (tracking) {
      watchId.current = navigator.geolocation.watchPosition(async pos => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const res = await sendLocation({ lat, lon, route_id: routeId });
          if (res.data.deviation_alert) setDevAlert(true);
        } catch { /* silent */ }
      }, null, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
    } else {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      setDevAlert(false);
    }
    return () => { if (watchId.current) navigator.geolocation.clearWatch(watchId.current); };
  }, [tracking, routeId]);

  if (!isAuthenticated) return null;

  const handleSOS = () => {
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const res = await triggerSOS({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setSosResult(res.data);
        setActive(true);
        setTracking(true);
      } catch (e) {
        alert('SOS Error: ' + (e.response?.data?.detail || e.message));
      }
    }, () => alert('Enable location access to use SOS'));
  };

  return (
    <>
      {/* Deviation Alert */}
      {devAlert && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,59,92,0.95)', color: 'white',
          borderRadius: 10, padding: '14px 24px', zIndex: 9998,
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
          boxShadow: '0 0 40px rgba(255,59,92,0.5)',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fade-in 0.3s ease',
        }}>
          ⚠️ ROUTE DEVIATION DETECTED — SOS has been triggered!
          <button onClick={() => setDevAlert(false)}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* SOS Result Modal */}
      {sosResult && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }} onClick={() => setSosResult(null)}>
          <div style={{
            background: 'var(--bg-card)', border: '2px solid var(--red)',
            borderRadius: 16, padding: 32, maxWidth: 440, width: '100%',
            boxShadow: 'var(--shadow-red)', animation: 'fade-in 0.3s ease',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🆘</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--red)' }}>
                SOS TRIGGERED
              </div>
              <div style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 4 }}>
                {sosResult.guardian_notified ? '✅ Guardian notified via SMS' : '⚠️ No guardian set — add one in Profile'}
              </div>
            </div>
            <div style={{
              background: 'var(--bg-2)', borderRadius: 10, padding: 16, marginBottom: 16,
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 8 }}>
                Nearest Police Station
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--amber)' }}>
                {sosResult.nearest_police?.name}
              </div>
              <a href={`tel:${sosResult.nearest_police?.phone}`} style={{
                color: 'var(--red)', fontSize: 20, fontWeight: 700,
                fontFamily: 'var(--font-display)', textDecoration: 'none',
              }}>
                📞 {sosResult.nearest_police?.phone}
              </a>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {sosResult.nearest_police?.distance_km?.toFixed(1)} km away
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {Object.entries(sosResult.emergency_numbers || {}).map(([k, v]) => (
                <a key={k} href={`tel:${v}`} style={{
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 12px', textDecoration: 'none',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--red)' }}>{v}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}</span>
                </a>
              ))}
            </div>
            <a href={sosResult.maps_link} target="_blank" rel="noreferrer"
              className="btn btn-primary btn-full" style={{ marginBottom: 10, display: 'flex' }}>
              📍 Share My Location
            </a>
            <button onClick={() => { setSosResult(null); setTracking(false); setActive(false); }}
              className="btn btn-outline btn-full">
              ✅ I am Safe Now
            </button>
          </div>
        </div>
      )}

      {/* Floating SOS Pill */}
      <div style={{
        position: 'fixed', bottom: 32, right: 24, zIndex: 9000,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
      }}>
        {/* Tracking indicator */}
        {tracking && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--green)',
            borderRadius: 20, padding: '6px 14px',
            fontFamily: 'var(--font-cond)', fontSize: 12, letterSpacing: 1,
            color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse-red 1.5s infinite' }} />
            LIVE TRACKING
            <button onClick={() => setTracking(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
          </div>
        )}

        {/* Main SOS Button */}
        <button
          onClick={active ? () => { setActive(false); setTracking(false); setSosResult(null); } : handleSOS}
          style={{
            background: active ? 'var(--green)' : 'var(--red)',
            color: 'white', border: 'none',
            borderRadius: 28, padding: '14px 28px',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
            letterSpacing: 1, cursor: 'pointer',
            boxShadow: active ? '0 0 30px rgba(0,230,118,0.4)' : '0 0 30px rgba(255,59,92,0.5)',
            animation: active ? 'none' : 'pulse-red 2s infinite',
            transition: 'background 0.3s',
          }}
        >
          {active ? '✅ SAFE' : '🆘 SOS'}
        </button>

        {/* Track toggle when not in SOS */}
        {!active && (
          <button onClick={() => setTracking(!tracking)} style={{
            background: 'var(--bg-card)', border: `1px solid ${tracking ? 'var(--green)' : 'var(--border)'}`,
            borderRadius: 20, padding: '6px 14px', color: tracking ? 'var(--green)' : 'var(--text-2)',
            fontFamily: 'var(--font-cond)', fontSize: 11, letterSpacing: 1, cursor: 'pointer',
          }}>
            {tracking ? '🟢 Tracking ON' : '⚫ Start Tracking'}
          </button>
        )}
      </div>
    </>
  );
}
