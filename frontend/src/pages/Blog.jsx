import { useState } from 'react';

const POSTS = [
  {
    id: 1, category: "Self Defence", readTime: "5 min",
    title: "7 Self-Defence Techniques Every Woman Should Know",
    summary: "Practical physical techniques you can learn without martial arts training — and use instantly in an emergency.",
    content: `**1. Palm Strike** — Instead of a closed fist (which can break your fingers), use the heel of your palm. Aim for the nose or chin. Drive straight forward with full body weight.

**2. Knee to Groin** — If grabbed from the front, grab their shoulders for balance and drive your knee upward with maximum force. This works regardless of height difference.

**3. Elbow Strike** — Your elbow is the hardest point on your body. If someone is close behind you, drive your elbow backward into their solar plexus or face.

**4. Wrist Escape** — If your wrist is grabbed: rotate your wrist toward the attacker's thumb (the weakest point of their grip) and pull sharply. Practice this until it is instinctive.

**5. Eye Gouge** — As a last resort when in serious danger, drive your thumbs toward the attacker's eyes. The threat alone often causes release.

**6. Stomp** — If grabbed from behind with arms pinned, raise your foot and drive it down hard onto their instep. Immediately follow with a backward head-butt.

**7. Yell "FIRE" not "HELP"** — Research shows bystanders respond faster to "Fire" than "Help" or "Rape". Loud noise also startles attackers and draws attention.

**Key principle:** Your goal is not to win a fight. Your goal is to create 3 seconds of opportunity to run. Strike once hard, then escape immediately.`,
    tags: ["Self Defence", "Safety Tips", "Physical Safety"],
    icon: "🥋",
  },
  {
    id: 2, category: "Digital Safety", readTime: "4 min",
    title: "Staying Safe Online: Cyber Threats Targeting Women",
    summary: "How to protect yourself from stalking, doxxing, sextortion, and online harassment — and what to do if you're targeted.",
    content: `**Cyberstalking** — Signs include: someone knowing your location when you haven't shared it, anonymous accounts that seem to know you, repeated contact from blocked numbers using new accounts. Action: Change all passwords, enable 2FA, check if location sharing is on in any app.

**Doxxing** — Your home address, workplace, or family information being shared publicly without consent. Prevention: Never use your real name on public forums. Use different usernames across platforms. Remove your data from Truecaller and similar apps.

**Sextortion** — Criminals threaten to share intimate images unless paid. Critical: Do NOT pay. Payment leads to more demands. Report immediately to Cyber Crime: 1930. The images can be removed through NCMEC's Take It Down service.

**Fake profiles / Catfishing** — Before meeting anyone online: reverse image search their photos, video call before meeting, always meet in public.

**Phone safety checklist:**
- Enable screen lock with biometrics
- Review which apps have location access (Settings → Privacy)
- Turn off Bluetooth and WiFi in unknown areas
- Use SafePrayag's live tracking when meeting strangers

**Report cybercrime:** Call 1930 or visit cybercrime.gov.in`,
    tags: ["Cyber Safety", "Digital Privacy", "Online Harassment"],
    icon: "💻",
  },
  {
    id: 3, category: "Public Safety", readTime: "6 min",
    title: "Safe Travel Guide for Women in Prayagraj",
    summary: "Area-by-area safety assessment, safest routes by time of day, and practical precautions for the most common journeys.",
    content: `**Relatively Safer Areas (Day & Night):**
Civil Lines, Cantonment, Colonelganj, and areas near medical colleges — higher foot traffic, better lighting, frequent police patrols.

**Areas Requiring Extra Caution at Night:**
Katra Bazaar, Chowk, areas near railway stations after 10pm, isolated stretches on the Naini bridge. Use SafePrayag route check before travelling these areas after dark.

**Auto-rickshaws:** Note the vehicle registration number and share it with someone before boarding. Sit behind the driver, not beside. Keep your phone charged and accessible.

**Shared transport (tempo/minibus):** Avoid being the last passenger. Stay near the exit. Trust your instinct — if something feels wrong, get off at the next populated stop.

**Late night travel checklist:**
✓ Inform at least one person of your route and ETA
✓ Enable SafePrayag live tracking before you leave
✓ Have police number (100) and nearest station saved
✓ Keep emergency SOS one tap away
✓ Share your live location via WhatsApp with a trusted person
✓ Avoid talking on phone while walking — stay alert

**Mela and crowded events (Kumbh Mela etc.):**
The Prayagraj Mela area sees high footfall and historically elevated eve-teasing incidents. Always travel in groups, set a meeting point in case of separation, and use the buddy system.`,
    tags: ["Prayagraj Safety", "Travel Safety", "Public Transport"],
    icon: "🚌",
  },
  {
    id: 4, category: "Legal Rights", readTime: "5 min",
    title: "Know Your Legal Rights: Laws Protecting Women in India",
    summary: "Key sections of IPC, POCSO, and new BNS laws that directly protect women — and how to use them.",
    content: `**Zero FIR:** You can file an FIR at ANY police station regardless of where the crime occurred. The station must accept it and transfer it to the correct jurisdiction. If refused, approach the SP/DSP directly.

**Section 354 BNS (formerly IPC):** Assault or criminal force with intent to outrage modesty. Punishment: 1–5 years imprisonment. Applies to eve-teasing, unwanted touching, physical intimidation.

**Section 354A BNS:** Sexual harassment including unwelcome physical contact, demand for sexual favours, showing pornography without consent. Punishment: up to 3 years.

**Section 354D BNS (Stalking):** Following a woman or monitoring her digital communication despite clear disinterest. First offence: 3 years. Repeat offence: 5 years. This applies to online stalking too.

**POCSO Act (Children):** Any sexual activity involving a person under 18 is automatically criminal regardless of claimed consent. Minimum sentence: 7 years. Teachers, family members, and known adults are not exempt.

**How to file an online FIR with UP Police:**
1. Visit: https://uppolice.gov.in
2. Click Citizen Services → Complaint Registration
3. Select crime type and fill details
4. Note your complaint number for follow-up
5. For emergencies, always call 100 FIRST, file FIR second.

**One Stop Centre (Sakhi):** A government scheme providing free legal aid, police assistance, medical help, and counselling for women facing violence. Prayagraj OSC: 0532-2407012`,
    tags: ["Legal Rights", "IPC", "Women Protection Laws", "FIR"],
    icon: "⚖️",
  },
  {
    id: 5, category: "Mental Health", readTime: "4 min",
    title: "After an Incident: Mental Health Support and Recovery",
    summary: "Recognising trauma responses, where to get help in Prayagraj, and how to support a survivor.",
    content: `**Normal trauma responses** that can appear after a safety incident: flashbacks, hypervigilance (being startled easily), avoiding certain places, difficulty sleeping, feeling numb or disconnected. These are normal responses to abnormal events — not signs of weakness.

**What helps immediately:**
- Tell someone you trust what happened
- Do not be alone for the first 24–48 hours if possible
- Avoid replaying the event repeatedly
- Basic care: water, food, warmth

**What does NOT help:**
- Being told to "move on" or "forget it"
- Isolating completely
- Self-medicating with alcohol

**Getting professional help in Prayagraj:**
- iCall (Tata Institute of Social Sciences): 9152987821 — free phone counselling
- Vandrevala Foundation: 1860-2662-345 — 24/7 free
- Manas Foundation Prayagraj counselling services

**If you are supporting a survivor:**
Listen without judgement. Believe them. Ask "how can I help?" rather than giving advice. Do not ask what they were wearing or why they were there. Help them access professional support.

**National Commission for Women:** 7827170170 (WhatsApp helpline)`,
    tags: ["Mental Health", "Trauma", "Support Resources"],
    icon: "💙",
  },
  {
    id: 6, category: "Child Safety", readTime: "5 min",
    title: "Protecting Children: What Parents & Teachers Must Know",
    summary: "Age-appropriate safety conversations, recognising abuse signs, and the POCSO Act explained simply.",
    content: `**The 'Safe and Unsafe Touch' rule:** Teach children from age 3+ that no one should touch their private parts (the areas covered by a swimsuit) except a doctor with a parent present. Any adult asking for secrecy about touch is wrong.

**Body autonomy:** Children should know they can say NO to any unwanted physical contact — including hugs from relatives. Forcing children to hug adults "to be polite" undermines their understanding of consent.

**Warning signs of abuse:** Sudden changes in behaviour, age-inappropriate sexual knowledge, reluctance to be with a specific adult, nightmares or regression, unexplained physical marks.

**What to tell children about online safety:**
- Never share photos with strangers online
- If anyone asks you to keep a secret from parents online, tell a parent immediately
- Never agree to meet someone you only know online without a parent
- SafePrayag can be shown to older children as a tool they can use

**Reporting child abuse:**
- Childline: 1098 (free, 24/7, child-run helpline)
- POCSO e-Box: https://pocso.ncpcr.gov.in
- Local police: 100 — child abuse reports are handled urgently

**For schools:** The POCSO Act requires all schools to designate a child protection officer and report any suspected abuse within 24 hours. Failure to report is itself a crime.`,
    tags: ["Child Safety", "POCSO", "Parenting", "School Safety"],
    icon: "🧒",
  },
];

const CATEGORY_COLORS = {
  "Self Defence": "var(--red)", "Digital Safety": "var(--violet-light)",
  "Public Safety": "var(--amber)", "Legal Rights": "var(--green)",
  "Mental Health": "#00B0FF", "Child Safety": "#FF6B9D",
};

export default function Blog() {
  const [active, setActive] = useState(null);
  const [filter, setFilter] = useState("All");

  const categories = ["All", ...new Set(POSTS.map(p => p.category))];
  const filtered = filter === "All" ? POSTS : POSTS.filter(p => p.category === filter);

  if (active) {
    const post = POSTS.find(p => p.id === active);
    return (
      <main className="page-main">
        <div className="container" style={{ maxWidth: 760 }}>
          <button onClick={() => setActive(null)} className="btn btn-outline btn-sm" style={{ marginBottom: 24 }}>
            ← Back to Blog
          </button>
          <div className="card" style={{ animation: 'fade-in 0.3s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{post.icon}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ background: CATEGORY_COLORS[post.category], color: 'white', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontFamily: 'var(--font-cond)', letterSpacing: 1 }}>
                {post.category}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12, padding: '4px 0' }}>📖 {post.readTime} read</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 12, lineHeight: 1.3 }}>
              {post.title}
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.7, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 24 }}>
              {post.summary}
            </p>
            <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.85 }}>
              {post.content.split('\n\n').map((para, i) => (
                <p key={i} style={{ marginBottom: 16 }}
                  dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text);font-weight:600">$1</strong>') }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
              {post.tags.map(t => (
                <span key={t} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: 'var(--text-muted)' }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(255,59,92,0.06)', border: '1px solid rgba(255,59,92,0.2)', borderRadius: 12, padding: '20px 24px', marginTop: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 12 }}>Found this useful? Use SafePrayag to stay protected on your daily routes.</p>
            <a href="/route" className="btn btn-primary btn-sm">🗺️ Check My Route Safety</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-main">
      <div className="container">
        <div style={{ marginBottom: 36, animation: 'fade-in 0.4s ease' }}>
          <h1 className="section-title" style={{ fontSize: 28 }}>Safety Blog</h1>
          <div className="section-divider" />
          <p className="section-subtitle">Expert guides on self-defence, legal rights, and staying safe in Prayagraj</p>
          {/* Online FIR Banner */}
          <a href="https://uppolice.gov.in" target="_blank" rel="noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'rgba(0,176,255,0.08)', border: '1px solid rgba(0,176,255,0.25)',
            borderRadius: 10, padding: '14px 20px', textDecoration: 'none', marginTop: 20,
          }}>
            <span style={{ fontSize: 28 }}>🚔</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                File Online FIR with UP Police →
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                uppolice.gov.in — Citizen Services → Complaint Registration
              </div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#00B0FF', fontSize: 20 }}>↗</span>
          </a>
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)} style={{
              padding: '7px 16px', borderRadius: 20,
              background: filter === c ? 'var(--red)' : 'var(--bg-card)',
              border: `1px solid ${filter === c ? 'var(--red)' : 'var(--border)'}`,
              color: filter === c ? 'white' : 'var(--text-2)',
              fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 600,
              letterSpacing: 0.8, cursor: 'pointer', transition: 'all 0.2s',
            }}>{c}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filtered.map((post, i) => (
            <div key={post.id} onClick={() => setActive(post.id)} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 24, cursor: 'pointer',
              transition: 'all 0.2s', animation: `fade-in 0.4s ease ${i * 0.08}s both`,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = CATEGORY_COLORS[post.category]; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ fontSize: 36, marginBottom: 14 }}>{post.icon}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ background: CATEGORY_COLORS[post.category], color: 'white', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontFamily: 'var(--font-cond)', letterSpacing: 0.8 }}>
                  {post.category}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📖 {post.readTime}</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 10, lineHeight: 1.4, color: 'var(--text)' }}>
                {post.title}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 16 }}>{post.summary}</p>
              <div style={{ color: 'var(--red)', fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
                READ ARTICLE →
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
