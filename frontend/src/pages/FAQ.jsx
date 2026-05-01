import { useState } from 'react';

const FAQS = [
  {
    category: "About SafePrayag",
    icon: "🛡️",
    items: [
      { q: "What is SafePrayag?", a: "SafePrayag is a free AI-powered safety platform for Prayagraj. It uses XGBoost machine learning trained on 5,000+ real crime records to predict safety risks on any route. It provides live crime heatmaps, route safety scores, one-tap SOS alerts to guardians, and real-time location tracking." },
      { q: "Who is it built for?", a: "Primarily for women and children in Prayagraj, but all citizens benefit. The AI model accounts for gender, age group, time of day, and location to give personalised safety scores." },
      { q: "Is SafePrayag free?", a: "Completely free. No subscription, no ads, no data selling. The platform runs on free-tier MongoDB Atlas, Render, and Vercel infrastructure." },
      { q: "How accurate is the safety score?", a: "The XGBoost model is trained on real Prayagraj crime data. It gives a 0–100 risk score based on location, time of day, your gender, and age group. It improves automatically every time a user reports a new incident — the model retrains on the updated dataset." },
    ]
  },
  {
    category: "SOS & Emergency Features",
    icon: "🆘",
    items: [
      { q: "What happens when I press SOS?", a: "Your GPS location is captured instantly. The system finds the nearest Prayagraj police station. An SMS is sent to your guardian with your Google Maps location link and the police station's phone number. Everything happens within 3–5 seconds." },
      { q: "What if my guardian doesn't receive the SMS?", a: "Make sure: (1) Guardian phone is saved in your Profile page. (2) The number is a valid Indian mobile (10 digits, no +91 prefix needed). The SOS modal on screen always shows all emergency numbers — 100 (Police), 1091 (Women Helpline), 1098 (Childline), 108 (Ambulance)." },
      { q: "What is route deviation alert?", a: "When live tracking is on, your GPS is sent to the server every 5 seconds. If you stray more than 50 metres from your planned route, the system automatically fires another SOS alert to your guardian without you needing to press anything." },
      { q: "Can I connect with the nearest police station?", a: "Yes. After pressing SOS, the modal shows your nearest police station name and phone number as a direct call link. The Route Check page also shows the 3 nearest stations with their numbers." },
    ]
  },
  {
    category: "Route Safety Check",
    icon: "🗺️",
    items: [
      { q: "How do I check if my route is safe?", a: "Go to Route Check → enter your From and To locations (e.g. 'Civil Lines, Prayagraj' to 'Naini, Prayagraj') → select time of day → click Analyse. You get a safety score for origin, midpoint, and destination, with crime hotspots shown as red circles on the map." },
      { q: "What do the safety score colours mean?", a: "Green (0–35): Safe. Orange (36–65): Moderate risk, stay alert. Red (66–100): High risk, avoid if possible or take the precautions listed on screen." },
      { q: "The address I typed was not found. What do I do?", a: "Add 'Prayagraj' to your search. For example type 'Katra, Prayagraj' or 'Chowk, Allahabad, Uttar Pradesh'. You can also use the 📍 button to use your current GPS location as the starting point." },
      { q: "What are the red circles on the map?", a: "Each red circle marks a recorded crime incident within 500 metres of your route. Click any circle to see the crime type, severity level, and time of day it occurred." },
    ]
  },
  {
    category: "Account & Privacy",
    icon: "🔐",
    items: [
      { q: "What data does SafePrayag store?", a: "Only: your name, email (hashed password), phone, guardian phone, and anonymised route check history. Your exact GPS coordinates during SOS are stored temporarily. We do not sell or share any data." },
      { q: "How is my password stored?", a: "Passwords are hashed using bcrypt with a unique salt. The original password is never stored — not even the database admin can see it." },
      { q: "Is my location always being tracked?", a: "No. Location tracking only activates when you press 'Start Live Tracking' on the Route Check page or press SOS. It stops the moment you press 'I Am Safe Now'." },
    ]
  },
  {
    category: "Reporting Incidents",
    icon: "📋",
    items: [
      { q: "How do I report a crime I witnessed?", a: "Go to Dashboard → click 'Report Incident'. Enter the location coordinates, crime type, severity (1–5), time of day, and a brief description. Your report is saved and triggers automatic model retraining to improve predictions for everyone." },
      { q: "How quickly does the model update after a report?", a: "Retraining runs as a background task within seconds of your report. The new model is live for the next route check. A minimum of 100 total records is required before retraining triggers." },
    ]
  },
  {
    category: "Emergency Numbers",
    icon: "📞",
    items: [
      { q: "What are the key emergency numbers?", a: "Police: 100 | Women Helpline: 1091 | Childline: 1098 | Ambulance: 108 | Cyber Crime: 1930 | Disaster: 1078 | Railway Police: 1512 | Anti-Human Trafficking: 1800-419-8588" },
      { q: "Where is the nearest women's police station?", a: "Mahila Thana Prayagraj is located at Civil Lines. Phone: 0532-2623800. Available 24×7 for complaints by women." },
      { q: "How do I file an online FIR with UP Police?", a: "Visit https://uppolice.gov.in and click Citizen Services → File Complaint Online. For immediate danger always call 100 first — file FIR after you are safe." },
    ]
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: open ? 'var(--bg-card-2)' : 'var(--bg-card)',
      border: `1px solid ${open ? 'rgba(255,59,92,0.3)' : 'var(--border)'}`,
      borderRadius: 10, overflow: 'hidden', transition: 'all 0.2s', marginBottom: 2,
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '14px 18px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', gap: 12, textAlign: 'left',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text)', flex: 1 }}>
          {q}
        </span>
        <span style={{
          color: 'var(--red)', fontSize: 20, flexShrink: 0,
          transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block',
        }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 18px 16px', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.75, borderTop: '1px solid var(--border)' }}>
          <div style={{ paddingTop: 12 }}>{a}</div>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <main className="page-main">
      <div className="container" style={{ maxWidth: 860 }}>
        <div style={{ marginBottom: 40, animation: 'fade-in 0.4s ease' }}>
          <h1 className="section-title" style={{ fontSize: 28 }}>Frequently Asked Questions</h1>
          <div className="section-divider" />
          <p className="section-subtitle">Everything you need to know about SafePrayag</p>
        </div>

        {FAQS.map((section, si) => (
          <div key={si} style={{ marginBottom: 40, animation: `fade-in 0.4s ease ${si * 0.07}s both` }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700,
              color: 'var(--red)', marginBottom: 14, letterSpacing: 0.5,
              paddingBottom: 10, borderBottom: '1px solid var(--border)',
            }}>
              {section.icon} {section.category}
            </h2>
            {section.items.map((item, ii) => (
              <FAQItem key={ii} q={item.q} a={item.a} />
            ))}
          </div>
        ))}

        {/* Emergency CTA */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,59,92,0.1), rgba(123,47,190,0.1))',
          border: '1px solid rgba(255,59,92,0.25)', borderRadius: 14,
          padding: '32px 28px', textAlign: 'center', marginTop: 16,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🚨</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            In immediate danger? Don't browse — call now.
          </h3>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
            {[['100','Police','var(--red)'],['1091','Women Helpline','var(--violet-light)'],['108','Ambulance','var(--amber)'],['1098','Childline','var(--green)']].map(([n,l,c]) => (
              <a key={n} href={`tel:${n}`} style={{
                background: 'var(--bg-card)', border: `1px solid ${c}`,
                borderRadius: 10, padding: '12px 20px', textDecoration: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 110,
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: c }}>{n}</span>
                <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{l}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
