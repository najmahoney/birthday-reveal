import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// STORAGE LAYER — works in Claude preview, localStorage, or Firebase
// For Firebase production, replace this block with:
//
//   import { db, ref, set, onValue } from "./firebase";
//   const storage = {
//     save: (data) => set(ref(db, "tripPlanner/assignments"), data),
//     listen: (callback) => {
//       return onValue(ref(db, "tripPlanner/assignments"), (snap) => callback(snap.val() || {}));
//     },
//   };
// ============================================================
const storage = {
  save: async (data) => {
    try {
      if (window.storage && window.storage.set) {
        await window.storage.set("trip-planner-320", JSON.stringify(data), true);
      } else {
        localStorage.setItem("trip-planner-320", JSON.stringify(data));
      }
    } catch (e) { localStorage.setItem("trip-planner-320", JSON.stringify(data)); }
  },
  listen: (callback) => {
    const load = async () => {
      try {
        if (window.storage && window.storage.get) {
          const r = await window.storage.get("trip-planner-320", true);
          callback(r && r.value ? JSON.parse(r.value) : {});
        } else {
          const raw = localStorage.getItem("trip-planner-320");
          callback(raw ? JSON.parse(raw) : {});
        }
      } catch (e) { callback({}); }
    };
    load();
    const iv = setInterval(load, 3000);
    return () => clearInterval(iv);
  },
};

// ============================================================
// DATA
// ============================================================
const ALL_EVENTS = [
  { id: "art", emoji: "🎨", title: "The Art Institute of Chicago", time: "~2.5 hrs", tag: "Art" },
  { id: "cultural", emoji: "🏛️", title: "Chicago Cultural Center", time: "~45 min", tag: "Culture" },
  { id: "goat", emoji: "🍽️", title: "Girl & The Goat", time: "~1.5 hrs", tag: "Dinner" },
  { id: "dots", emoji: "🍹", title: "Three Dots and a Dash", time: "~1 hr", tag: "Cocktails" },
  { id: "gus", emoji: "🥃", title: "Gus' Sip & Dip", time: "~1 hr", tag: "Cocktails" },
  { id: "batter", emoji: "🥞", title: "Batter & Berries", time: "~1 hr", tag: "Brunch" },
  { id: "illusions", emoji: "🪞", title: "Museum of Illusions", time: "~1 hr", tag: "Fun" },
  { id: "bean", emoji: "☁️", title: "Millennium Park & The Bean", time: "~45 min", tag: "Sightseeing" },
  { id: "magnolia", emoji: "🧁", title: "Magnolia Bakery", time: "~20 min", tag: "Sweets" },
];

const BUCKETS = [
  { id: "unassigned", label: "Activities", icon: "✦", color: "gray", desc: "Drag or tap into a day" },
  { id: "friday", label: "Friday", icon: "🌙", color: "amber", desc: "Arrival day" },
  { id: "saturday", label: "Saturday", icon: "🌿", color: "green", desc: "Full day of adventure" },
  { id: "sunday", label: "Sunday", icon: "☀️", color: "teal", desc: "Last day together" },
];

const C = {
  gray:  { bg:"rgba(180,180,170,.06)", bdr:"rgba(180,180,170,.12)", tag:"rgba(180,180,170,.15)", tt:"rgba(180,180,170,.6)", hdr:"rgba(180,180,170,.08)", ht:"rgba(200,200,190,.5)" },
  amber: { bg:"rgba(212,175,55,.05)", bdr:"rgba(212,175,55,.12)", tag:"rgba(212,175,55,.15)", tt:"rgba(212,175,55,.6)", hdr:"rgba(212,175,55,.08)", ht:"rgba(212,175,55,.5)" },
  green: { bg:"rgba(125,184,138,.05)", bdr:"rgba(125,184,138,.12)", tag:"rgba(125,184,138,.15)", tt:"rgba(125,184,138,.6)", hdr:"rgba(125,184,138,.08)", ht:"rgba(125,184,138,.5)" },
  teal:  { bg:"rgba(93,202,165,.05)", bdr:"rgba(93,202,165,.12)", tag:"rgba(93,202,165,.15)", tt:"rgba(93,202,165,.6)", hdr:"rgba(93,202,165,.08)", ht:"rgba(93,202,165,.5)" },
};

// ============================================================
// HEART CONFETTI
// ============================================================
function Confetti({ active }) {
  const [ps, setPs] = useState([]);
  useEffect(() => {
    if (!active) return;
    const cols = ["#7DB88A","#A8D5B0","#5B9E6F","#D4AF37","#8FBF9A","#E8D880"];
    setPs(Array.from({ length: 60 }, (_, i) => ({
      i, x: Math.random()*100, sz: 8+Math.random()*16, c: cols[i % cols.length],
      dl: Math.random()*2.5, dur: 3+Math.random()*3.5,
      dr: (Math.random()-.5)*50, rot: Math.random()*360, h: Math.random()>.3,
    })));
  }, [active]);
  if (!active || !ps.length) return null;
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9999, overflow:"hidden" }}>
      {ps.map(p => (
        <div key={p.i} style={{
          position:"absolute", left:p.x+"%", top:"-5%", fontSize:p.sz, color:p.c, opacity:0,
          animation:`cFall ${p.dur}s ${p.dl}s ease-in forwards`,
          "--dr":`${p.dr}px`, "--rot":`${p.rot}deg`,
        }}>{p.h ? "♥" : "✦"}</div>
      ))}
    </div>
  );
}

// ============================================================
// SCRATCH CARD
// ============================================================
function ScratchCard({ onComplete }) {
  const cvs = useRef(null);
  const drawing = useRef(false);
  const done = useRef(false);
  const [rev, setRev] = useState(false);
  const W = 320, H = 220;

  useEffect(() => {
    const c = cvs.current; if (!c) return;
    const x = c.getContext("2d");
    c.width = W*2; c.height = H*2; x.scale(2,2);
    const g = x.createLinearGradient(0,0,W,H);
    g.addColorStop(0,"#2a3a2e"); g.addColorStop(.5,"#1e2e22"); g.addColorStop(1,"#1a2a1e");
    x.fillStyle = g; x.fillRect(0,0,W,H);
    for (let i=0;i<100;i++) {
      x.fillStyle = `rgba(${180+Math.random()*70},${200+Math.random()*50},${160+Math.random()*50},${.03+Math.random()*.05})`;
      x.beginPath(); x.arc(Math.random()*W, Math.random()*H, .5+Math.random()*1.5, 0, Math.PI*2); x.fill();
    }
    x.fillStyle = "rgba(168,213,176,.5)"; x.font = "600 13px sans-serif"; x.textAlign = "center";
    x.fillText("SCRATCH TO REVEAL", W/2, H/2-10);
    x.fillStyle = "rgba(168,213,176,.25)"; x.font = "400 11px sans-serif";
    x.fillText("one more surprise...", W/2, H/2+14);
  }, []);

  const pos = useCallback((e) => {
    const r = cvs.current.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x:(t.clientX-r.left)*(W/r.width), y:(t.clientY-r.top)*(H/r.height) };
  }, []);

  const scratch = useCallback((p) => {
    const c = cvs.current; if (!c) return;
    const x = c.getContext("2d");
    x.globalCompositeOperation = "destination-out";
    x.beginPath(); x.arc(p.x*2, p.y*2, 36, 0, Math.PI*2); x.fill();
    x.globalCompositeOperation = "source-over";
    const d = x.getImageData(0,0,W*2,H*2); let t=0;
    for (let i=3;i<d.data.length;i+=4) if(d.data[i]===0) t++;
    if ((t/(d.data.length/4))*100 > 45 && !done.current) {
      done.current = true; setRev(true);
      setTimeout(() => { x.clearRect(0,0,W*2,H*2); onComplete?.(); }, 600);
    }
  }, [onComplete]);

  const onS = useCallback((e) => { e.preventDefault(); drawing.current=true; scratch(pos(e)); }, [pos,scratch]);
  const onM = useCallback((e) => { e.preventDefault(); if(!drawing.current)return; scratch(pos(e)); }, [pos,scratch]);
  const onE = useCallback(() => { drawing.current=false; }, []);

  return (
    <div style={{ position:"relative", width:W, height:H, borderRadius:16, overflow:"hidden",
      boxShadow: rev ? "0 0 60px rgba(212,175,55,.3)" : "0 8px 40px rgba(0,0,0,.4)", transition:"box-shadow .8s",
    }}>
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(145deg,#0f1a14,#142018)", border:"1px solid rgba(212,175,55,.2)", borderRadius:16, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}>
        <div style={{ fontSize:52, filter:"drop-shadow(0 4px 20px rgba(212,175,55,.4))", animation:rev?"prizeReveal .8s cubic-bezier(.16,1,.3,1)":"none" }}>📞</div>
        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:22, fontWeight:600, color:"rgba(168,213,176,.8)", letterSpacing:2 }}>1-800-CALL-YOUR-MAN</div>
        <div style={{ fontFamily:"sans-serif", fontSize:13, fontStyle:"italic", color:"rgba(168,213,176,.4)", letterSpacing:1, opacity:rev?1:0, transition:"opacity .6s .5s" }}>open 24/7, just for you</div>
      </div>
      <canvas ref={cvs} style={{ position:"absolute", inset:0, width:W, height:H, borderRadius:16, cursor:"crosshair", touchAction:"none", opacity:rev?0:1, transition:"opacity .6s" }}
        onMouseDown={onS} onMouseMove={onM} onMouseUp={onE} onMouseLeave={onE}
        onTouchStart={onS} onTouchMove={onM} onTouchEnd={onE} />
    </div>
  );
}

// ============================================================
// EVENT CARD
// ============================================================
function Card({ ev, dragStart, dragging, selected, onSelect }) {
  return (
    <div draggable
      onDragStart={e => { e.dataTransfer.setData("text/plain",ev.id); e.dataTransfer.effectAllowed="move"; dragStart(ev.id); }}
      onDragEnd={() => dragStart(null)}
      onClick={() => onSelect(ev.id)}
      style={{
        padding:"14px 16px", borderRadius:12, display:"flex", alignItems:"center", gap:12,
        cursor:"grab", transition:"all .2s", userSelect:"none", WebkitUserSelect:"none",
        background: selected?"rgba(125,184,138,.15)":dragging?"rgba(125,184,138,.12)":"rgba(255,255,255,.03)",
        border: selected?"1.5px solid rgba(125,184,138,.5)":dragging?"1px solid rgba(125,184,138,.3)":"1px solid rgba(255,255,255,.06)",
        opacity: dragging?.5:1, transform: selected?"scale(1.02)":"none",
        boxShadow: selected?"0 4px 20px rgba(125,184,138,.2)":"none",
      }}
    >
      <span style={{ fontSize:24, flexShrink:0 }}>{ev.emoji}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:15, fontWeight:600, color:selected?"#A8D5B0":"rgba(224,240,228,.95)", lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.title}</div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:5 }}>
          <span style={{ fontSize:13, color:"rgba(168,213,176,.55)" }}>{ev.time}</span>
          <span style={{ fontSize:11, padding:"2px 10px", borderRadius:10, background:"rgba(125,184,138,.1)", color:"rgba(125,184,138,.6)", fontWeight:600 }}>{ev.tag}</span>
        </div>
      </div>
      {selected ? <span style={{ fontSize:12, color:"rgba(125,184,138,.6)", flexShrink:0, fontWeight:600 }}>TAP A DAY</span>
        : <span style={{ fontSize:14, color:"rgba(168,213,176,.2)", flexShrink:0 }}>⠿</span>}
    </div>
  );
}

// ============================================================
// BUCKET
// ============================================================
function Bucket({ b, evs, onDrop, dragId, dragStart, selId, onSelect, onTap }) {
  const [over, setOver] = useState(false);
  const c = C[b.color];
  const hint = selId && !evs.find(e => e.id === selId);

  return (
    <div
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect="move"; setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); const id=e.dataTransfer.getData("text/plain"); if(id)onDrop(id,b.id); }}
      style={{
        background: (over||(hint&&b.id!=="unassigned"))?c.bg.replace(".05",".12").replace(".06",".14"):c.bg,
        border:`1px solid ${(over||(hint&&b.id!=="unassigned"))?c.bdr.replace(".12",".3"):c.bdr}`,
        borderRadius:16, transition:"all .25s", minHeight:b.id==="unassigned"?"auto":120,
        boxShadow: over?`0 0 24px ${c.bdr}`:"none",
      }}
    >
      <div onClick={() => { if(selId) onTap(b.id); }}
        style={{ padding:"12px 16px", background:(hint&&b.id!=="unassigned")?c.bdr.replace(".12",".08"):c.hdr, borderRadius:"15px 15px 0 0", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:selId?"pointer":"default", transition:"background .2s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>{b.icon}</span>
          <span style={{ fontSize:17, fontWeight:700, color:"rgba(224,240,228,.9)", letterSpacing:.5 }}>{b.label}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {(hint&&b.id!=="unassigned") ? <span style={{ fontSize:13, color:c.tt, fontWeight:600, animation:"pulse 1.5s ease-in-out infinite" }}>Tap to place here</span>
            : <span style={{ fontSize:13, color:c.ht, fontStyle:"italic" }}>{b.desc}</span>}
          {evs.length>0 && <span style={{ fontSize:12, fontWeight:700, width:24, height:24, borderRadius:"50%", background:c.tag, color:c.tt, display:"flex", alignItems:"center", justifyContent:"center" }}>{evs.length}</span>}
        </div>
      </div>
      <div onClick={() => { if(selId&&b.id!=="unassigned") onTap(b.id); }}
        style={{ padding:"8px 10px 10px", display:"flex", flexDirection:"column", gap:6, cursor:selId?"pointer":"default" }}>
        {evs.map(ev => <Card key={ev.id} ev={ev} dragStart={dragStart} dragging={dragId===ev.id} selected={selId===ev.id} onSelect={onSelect} />)}
        {evs.length===0 && b.id!=="unassigned" && (
          <div onClick={() => { if(selId) onTap(b.id); }}
            style={{ padding:"24px 16px", textAlign:"center", fontSize:14, borderRadius:10, cursor:selId?"pointer":"default",
              color:(hint||over)?c.tt:c.ht, fontWeight:(hint||over)?600:400, fontStyle:(hint||over)?"normal":"italic",
              border:`1px dashed ${(hint||over)?c.bdr.replace(".12",".35"):c.bdr}`, opacity:(hint||over)?1:.6, transition:"all .2s",
            }}>{(hint||over)?"Tap to place here!":"Drop activities here"}</div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Nunito:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
@keyframes fadeIn{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}
@keyframes softGlow{0%,100%{text-shadow:0 0 20px rgba(125,184,138,.2)}50%{text-shadow:0 0 30px rgba(125,184,138,.35)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes warningSlam{0%{opacity:0;transform:scale(1.15)}40%{opacity:1;transform:scale(.97)}60%{transform:scale(1.02)}100%{transform:scale(1)}}
@keyframes warningPulse{0%,100%{box-shadow:0 0 30px rgba(212,175,55,.1)}50%{box-shadow:0 0 50px rgba(212,175,55,.2)}}
@keyframes overlayFade{from{opacity:0}to{opacity:1}}
@keyframes iconShake{0%,100%{transform:rotate(0)}15%{transform:rotate(-8deg)}30%{transform:rotate(8deg)}45%{transform:rotate(-5deg)}60%{transform:rotate(5deg)}}
@keyframes barFill{from{width:0}to{width:100%}}
@keyframes lockPulse{0%,100%{box-shadow:0 6px 28px rgba(212,175,55,.3)}50%{box-shadow:0 8px 36px rgba(212,175,55,.5)}}
@keyframes cFall{0%{transform:translateY(0) translateX(0) rotate(0) scale(.5);opacity:0}10%{opacity:1;transform:translateY(5vh) rotate(20deg) scale(1)}50%{opacity:.9;transform:translateY(50vh) translateX(calc(var(--dr)*.5)) rotate(calc(var(--rot)*.5)) scale(.9)}100%{opacity:0;transform:translateY(115vh) translateX(var(--dr)) rotate(var(--rot)) scale(.6)}}
@keyframes prizeReveal{0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.15) rotate(5deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes pianoFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-10px) scale(1.03)}}
@keyframes bootLine{from{opacity:0;transform:translateX(-5px)}to{opacity:1;transform:translateX(0)}}
@keyframes scanMove{0%{top:-2px}100%{top:100%}}
@keyframes inputPulse{0%,100%{border-color:rgba(0,255,70,.12)}50%{border-color:rgba(0,255,70,.22)}}
@keyframes errorFlash{0%,100%{border-color:rgba(255,60,60,.3)}50%{border-color:rgba(255,60,60,.7)}}
@keyframes glitchShake{0%{transform:translate(0)}20%{transform:translate(-3px,2px)}40%{transform:translate(2px,-2px)}60%{transform:translate(-2px,1px)}80%{transform:translate(3px,-1px)}100%{transform:translate(0)}}
@keyframes accessGranted{0%{opacity:0;transform:scale(.8)}50%{opacity:1;transform:scale(1.05);text-shadow:0 0 40px rgba(0,255,100,.6)}100%{opacity:1;transform:scale(1);text-shadow:0 0 20px rgba(0,255,100,.4)}}
@keyframes fadeOutUp{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-30px)}}
`;

const BG = "linear-gradient(160deg,#0a1210,#0d1a14,#0a1610,#081310,#060f0b)";

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function TripPlanner() {
  const [route, setRoute] = useState(window.location.hash);
  const [stage, setStage] = useState("login");
  const [asgn, setAsgn] = useState({});
  const [dragId, setDragId] = useState(null);
  const [selId, setSelId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(null);
  const [warn, setWarn] = useState(false);
  const [locked, setLocked] = useState(false);
  const [showScratch, setShowScratch] = useState(false);
  const [scratchVis, setScratchVis] = useState(false);
  const [prizeReveal, setPrizeReveal] = useState(false);
  const [confetti, setConfetti] = useState(false);

  // Login
  const [inp, setInp] = useState("");
  const [err, setErr] = useState(false);
  const [ok, setOk] = useState(false);
  const [loginVis, setLoginVis] = useState(false);
  const [cursor, setCursor] = useState(true);
  const [bootLines, setBootLines] = useState([]);
  const [bootDone, setBootDone] = useState(false);
  const inpRef = useRef(null);

  // Listen for hash changes
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => { const iv = setInterval(() => setCursor(v => !v), 530); return () => clearInterval(iv); }, []);
  useEffect(() => { window.scrollTo(0,0); }, [stage]);
  useEffect(() => { if (showScratch) setTimeout(() => setScratchVis(true), 400); }, [showScratch]);

  // Boot
  useEffect(() => {
    if (stage !== "login") return;
    const lines = [
      { t: "INITIALIZING SECURE TERMINAL v3.2.0...", d: 200 },
      { t: "ESTABLISHING ENCRYPTED CONNECTION... OK", d: 700 },
      { t: "LOADING OPERATION: CODENAME 320... OK", d: 1200 },
      { t: "CLEARANCE LEVEL: EYES ONLY — SECTOR 3-20", d: 1700 },
      { t: "IDENTITY VERIFICATION REQUIRED", d: 2200 },
    ];
    lines.forEach(({ t, d }) => setTimeout(() => setBootLines(p => [...p, t]), d));
    setTimeout(() => { setBootDone(true); setLoginVis(true); }, 2800);
  }, [stage]);

  // Storage
  useEffect(() => {
    const unsub = storage.listen((data) => { setAsgn(data); setLoaded(true); });
    return () => { if (typeof unsub === "function") unsub(); };
  }, []);

  const save = useCallback(async (d) => {
    try { await storage.save(d); setSaved(new Date()); } catch(e) {}
  }, []);

  const login = () => {
    if (inp.trim().toLowerCase() === "bus") {
      setOk(true); setErr(false);
      setTimeout(() => setStage("planner"), 1800);
    } else { setErr(true); setInp(""); setTimeout(() => setErr(false), 2000); }
  };

  const drop = useCallback((eid, bid) => {
    setAsgn(p => {
      const n = { ...p }; if (bid === "unassigned") delete n[eid]; else n[eid] = bid;
      save(n); return n;
    });
    setDragId(null);
  }, [save]);

  const select = useCallback((eid) => setSelId(p => p === eid ? null : eid), []);
  const tapBucket = useCallback((bid) => { if (selId) { drop(selId, bid); setSelId(null); } }, [selId, drop]);

  const scratchDone = useCallback(() => {
    setPrizeReveal(true); setConfetti(true);
    setTimeout(() => setConfetti(false), 6000);
  }, []);

  const reset = async () => {
    setAsgn({}); setWarn(false); setLocked(false); setSelId(null);
    setShowScratch(false); setScratchVis(false); setPrizeReveal(false); setConfetti(false);
    await save({});
  };

  const evFor = (bid) => bid === "unassigned" ? ALL_EVENTS.filter(e => !asgn[e.id]) : ALL_EVENTS.filter(e => asgn[e.id] === bid);
  const total = Object.keys(asgn).length;
  const pct = (total / ALL_EVENTS.length) * 100;
  const DAYS = BUCKETS.filter(b => b.id !== "unassigned");
  const unassigned = ALL_EVENTS.filter(e => !asgn[e.id]);

  // ==================== VIEWER MODE ====================
  if (route === "#/view") return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight:"100vh", background:BG, fontFamily:"'Nunito',sans-serif", color:"#E0F0E4", padding:"32px 16px 80px" }}>
        <div style={{ textAlign:"center", marginBottom:32, animation:"fadeIn .8s ease-out" }}>
          <div style={{ fontSize:13, letterSpacing:14, color:"rgba(125,184,138,.3)", marginBottom:12 }}>🌿 ♥ 🌿</div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(28px,6vw,42px)", fontWeight:600, fontStyle:"italic", color:"#A8D5B0", animation:"softGlow 5s ease-in-out infinite", marginBottom:6 }}>Our Weekend Together</h1>
          <p style={{ fontSize:16, color:"rgba(168,213,176,.45)", marginBottom:16 }}>Watching the plan come together</p>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px", borderRadius:20, background:"rgba(125,184,138,.06)", border:"1px solid rgba(125,184,138,.1)" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#7DB88A", animation:"pulse 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize:13, color:"rgba(168,213,176,.5)", fontWeight:500 }}>LIVE — {total} of {ALL_EVENTS.length} planned</span>
          </div>
        </div>

        <div style={{ maxWidth:600, margin:"0 auto", display:"flex", flexDirection:"column", gap:16 }}>
          {DAYS.map((b, i) => {
            const c = C[b.color];
            const items = evFor(b.id);
            return (
              <div key={b.id} style={{ animation:`fadeIn .5s ${i*.1}s ease-out both` }}>
                <div style={{ background:c.bg, border:`1px solid ${c.bdr}`, borderRadius:16, minHeight:100 }}>
                  <div style={{ padding:"12px 16px", background:c.hdr, borderRadius:"15px 15px 0 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:18 }}>{b.icon}</span>
                      <span style={{ fontSize:17, fontWeight:700, color:"rgba(224,240,228,.9)" }}>{b.label}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:13, color:c.ht, fontStyle:"italic" }}>{b.desc}</span>
                      {items.length > 0 && <span style={{ fontSize:12, fontWeight:700, width:24, height:24, borderRadius:"50%", background:c.tag, color:c.tt, display:"flex", alignItems:"center", justifyContent:"center" }}>{items.length}</span>}
                    </div>
                  </div>
                  <div style={{ padding:"8px 10px 10px", display:"flex", flexDirection:"column", gap:6 }}>
                    {items.map(ev => (
                      <div key={ev.id} style={{ padding:"14px 16px", background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)", borderRadius:12, display:"flex", alignItems:"center", gap:12 }}>
                        <span style={{ fontSize:24 }}>{ev.emoji}</span>
                        <div>
                          <div style={{ fontSize:15, fontWeight:600, color:"rgba(224,240,228,.95)" }}>{ev.title}</div>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:5 }}>
                            <span style={{ fontSize:13, color:"rgba(168,213,176,.55)" }}>{ev.time}</span>
                            <span style={{ fontSize:11, padding:"2px 10px", borderRadius:10, background:"rgba(125,184,138,.1)", color:"rgba(125,184,138,.6)", fontWeight:600 }}>{ev.tag}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && <div style={{ padding:"20px 16px", textAlign:"center", color:c.ht, fontSize:14, fontStyle:"italic", opacity:.5 }}>Nothing planned yet</div>}
                  </div>
                </div>
              </div>
            );
          })}

          {unassigned.length > 0 && (
            <div style={{ animation:"fadeIn .5s .3s ease-out both" }}>
              <div style={{ background:"rgba(180,180,170,.04)", border:"1px solid rgba(180,180,170,.08)", borderRadius:16 }}>
                <div style={{ padding:"12px 16px", background:"rgba(180,180,170,.06)", borderRadius:"15px 15px 0 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:18 }}>✦</span>
                    <span style={{ fontSize:17, fontWeight:700, color:"rgba(224,240,228,.7)" }}>Not yet placed</span>
                  </div>
                  <span style={{ fontSize:13, color:"rgba(200,200,190,.35)", fontStyle:"italic" }}>Waiting on her picks</span>
                </div>
                <div style={{ padding:"8px 10px 10px", display:"flex", flexDirection:"column", gap:6 }}>
                  {unassigned.map(ev => (
                    <div key={ev.id} style={{ padding:"14px 16px", background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)", borderRadius:12, display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontSize:24 }}>{ev.emoji}</span>
                      <div>
                        <div style={{ fontSize:15, fontWeight:600, color:"rgba(224,240,228,.95)" }}>{ev.title}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:5 }}>
                          <span style={{ fontSize:13, color:"rgba(168,213,176,.55)" }}>{ev.time}</span>
                          <span style={{ fontSize:11, padding:"2px 10px", borderRadius:10, background:"rgba(125,184,138,.1)", color:"rgba(125,184,138,.6)", fontWeight:600 }}>{ev.tag}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {total === ALL_EVENTS.length && (
          <div style={{ textAlign:"center", marginTop:32, animation:"fadeIn .6s" }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:600, fontStyle:"italic", color:"#A8D5B0", padding:"12px 28px", border:"1px solid rgba(125,184,138,.15)", borderRadius:40, display:"inline-block" }}>🌿 The weekend is set 🌿</div>
          </div>
        )}

        <div style={{ textAlign:"center", marginTop:32, fontSize:12, color:"rgba(168,213,176,.2)", letterSpacing:1.5 }}>VIEW ONLY — UPDATES APPEAR IN REAL TIME</div>
      </div>
    </>
  );

  // ==================== LOGIN ====================
  if (stage === "login") return (
    <>
      <style>{CSS}</style>
      <div onClick={() => inpRef.current?.focus()} style={{ minHeight:"100vh", background:"#0a0c0a", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", fontFamily:"'Share Tech Mono',monospace", color:"rgba(0,255,70,.7)" }}>
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:10, background:"repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(0,0,0,.08) 1px,rgba(0,0,0,.08) 2px)" }} />
        <div style={{ position:"fixed", left:0, right:0, height:3, zIndex:10, pointerEvents:"none", background:"linear-gradient(180deg,transparent,rgba(0,255,70,.04),transparent)", animation:"scanMove 4s linear infinite" }} />
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:5, background:"radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.6) 100%)" }} />

        <div style={{ position:"fixed", top:14, left:20, zIndex:6, fontSize:9, color:"rgba(0,255,70,.08)", letterSpacing:1, lineHeight:1.8 }}>SEC//320<br/>ENCRYPTED<br/>CHANNEL 03.20</div>
        <div style={{ position:"fixed", top:14, right:20, zIndex:6, fontSize:9, color:"rgba(0,255,70,.12)", letterSpacing:1, textAlign:"right", lineHeight:1.8 }}>SYS BUILD 3.2.0<br/>NODE 0x320F<br/>OP-320 ACTIVE</div>

        <div style={{ zIndex:6, width:"100%", maxWidth:520, padding:"0 24px" }}>
          <div style={{ textAlign:"center", padding:"8px 0", marginBottom:32, borderTop:"1px solid rgba(0,255,70,.1)", borderBottom:"1px solid rgba(0,255,70,.1)", fontSize:11, fontWeight:700, letterSpacing:6, color:"rgba(0,255,70,.35)" }}>TOP SECRET // CODENAME 320</div>

          <div style={{ marginBottom:28, minHeight:110 }}>
            {bootLines.map((l, i) => <div key={i} style={{ fontSize:11, color:i===bootLines.length-1?"rgba(0,255,70,.5)":"rgba(0,255,70,.3)", fontWeight:i===bootLines.length-1?700:400, letterSpacing:.5, marginBottom:4, animation:"bootLine .3s ease-out", lineHeight:1.6 }}>&gt; {l}</div>)}
          </div>

          <div style={{ opacity:bootDone&&loginVis?1:0, transform:bootDone&&loginVis?"translateY(0)":"translateY(15px)", transition:"all .8s cubic-bezier(.16,1,.3,1)", ...(ok?{animation:"fadeOutUp .8s ease-in forwards"}:{}) }}>
            <div style={{ height:1, background:"rgba(0,255,70,.06)", marginBottom:24 }} />
            <div style={{ fontSize:10, letterSpacing:3, color:"rgba(0,255,70,.2)", marginBottom:16 }}>OPERATION 320 — IDENTITY VERIFICATION</div>
            <div style={{ fontSize:"clamp(17px,3.5vw,24px)", color:"rgba(0,255,70,.65)", marginBottom:6, letterSpacing:.5, lineHeight:1.5 }}>Where did it all begin?</div>
            <div style={{ fontSize:10, color:"rgba(0,255,70,.15)", letterSpacing:2, marginBottom:24 }}>PROTOCOL 3-20 REQUIRES VERIFICATION TO PROCEED</div>

            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
              <span style={{ fontSize:16, color:"rgba(0,255,70,.3)" }}>&gt;_</span>
              <div style={{
                flex:1, padding:"12px 16px", background:"rgba(0,255,70,.02)", border:"1px solid rgba(0,255,70,.1)", borderRadius:2,
                fontFamily:"'Share Tech Mono',monospace", fontSize:18, color:"rgba(0,255,70,.8)", letterSpacing:3, minHeight:46,
                display:"flex", alignItems:"center", cursor:"text", position:"relative",
                ...(err?{animation:"errorFlash .4s ease-in-out 3,glitchShake .25s",borderColor:"rgba(255,50,50,.4)"}:{}),
                ...(ok?{borderColor:"rgba(0,255,70,.4)",boxShadow:"0 0 20px rgba(0,255,70,.08)"}:{}),
                ...(!err&&!ok?{animation:"inputPulse 3s ease-in-out infinite"}:{}),
              }}>
                {inp.split("").map((ch,i) => <span key={i} style={{ display:"inline-block", textTransform:"uppercase" }}>{ch}</span>)}
                <span style={{ display:"inline-block", width:8, height:18, background:"rgba(0,255,70,.6)", marginLeft:1, verticalAlign:"middle", opacity:cursor?1:0 }} />
                <input ref={inpRef} type="text" autoFocus value={inp} onChange={e=>{setInp(e.target.value);setErr(false)}} onKeyDown={e=>{if(e.key==="Enter")login()}}
                  autoCapitalize="none" autoCorrect="off" spellCheck="false" style={{ position:"absolute", width:1, height:1, opacity:0, top:0, left:0 }} />
              </div>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              <button onClick={login} style={{ padding:"10px 28px", background:"transparent", border:"1px solid rgba(0,255,70,.15)", borderRadius:2, fontFamily:"'Share Tech Mono',monospace", fontSize:14, fontWeight:600, letterSpacing:2, color:"rgba(0,255,70,.4)", cursor:"pointer", transition:"all .25s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(0,255,70,.35)";e.currentTarget.style.color="rgba(0,255,70,.7)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(0,255,70,.15)";e.currentTarget.style.color="rgba(0,255,70,.4)"}}>AUTHENTICATE</button>
              {err && <span style={{ fontSize:12, color:"rgba(255,50,50,.5)" }}>ERR 320: ACCESS DENIED — IDENTITY NOT VERIFIED</span>}
              {ok && <span style={{ fontSize:12, color:"rgba(0,255,70,.7)", fontWeight:700, animation:"accessGranted .8s ease-out forwards" }}>OPERATION 320: ACCESS GRANTED</span>}
            </div>
          </div>
        </div>

        <div style={{ position:"fixed", bottom:44, left:0, right:0, zIndex:6, textAlign:"center" }}>
          <button
            onClick={() => { window.location.hash = "#/view"; setRoute("#/view"); }}
            style={{
              fontFamily:"'Share Tech Mono',monospace", fontSize:14, letterSpacing:2,
              color:"rgba(0,255,70,.35)", background:"transparent",
              border:"1px solid rgba(0,255,70,.12)", borderRadius:4,
              padding:"10px 28px", cursor:"pointer", transition:"all .3s",
              textTransform:"uppercase",
            }}
            onMouseEnter={e=>{e.currentTarget.style.color="rgba(0,255,70,.7)";e.currentTarget.style.borderColor="rgba(0,255,70,.3)";e.currentTarget.style.background="rgba(0,255,70,.04)"}}
            onMouseLeave={e=>{e.currentTarget.style.color="rgba(0,255,70,.35)";e.currentTarget.style.borderColor="rgba(0,255,70,.12)";e.currentTarget.style.background="transparent"}}
          >
            [ DON'T HAVE CLEARANCE? SEE WHAT SHE'S PLANNING → ]
          </button>
        </div>
        <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:6, padding:"10px 0", textAlign:"center", borderTop:"1px solid rgba(0,255,70,.05)", fontSize:9, letterSpacing:3, color:"rgba(0,255,70,.1)", background:"rgba(10,12,10,.8)" }}>OPERATION 320 — UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED</div>
      </div>
    </>
  );

  // ==================== LOADING ====================
  if (!loaded) return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight:"100vh", background:BG, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Nunito',sans-serif", color:"rgba(168,213,176,.4)" }}>Loading...</div>
    </>
  );

  // ==================== PLANNER ====================
  return (
    <>
      <style>{CSS}</style>
      <Confetti active={confetti} />

      <div style={{ minHeight:"100vh", background:BG, fontFamily:"'Nunito',sans-serif", color:"#E0F0E4", padding:"32px 16px 80px" }}>
        <div style={{ textAlign:"center", marginBottom:32, animation:"fadeIn .8s ease-out" }}>
          <div style={{ fontSize:13, letterSpacing:14, color:"rgba(125,184,138,.3)", marginBottom:12 }}>🌿 ♥ 🌿</div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(28px,6vw,42px)", fontWeight:600, fontStyle:"italic", color:"#A8D5B0", animation:"softGlow 5s ease-in-out infinite", marginBottom:6 }}>Plan Our Weekend</h1>
          <p style={{ fontSize:17, color:"rgba(168,213,176,.5)", marginBottom:20 }}>Drag or tap each activity, then tap a day to place it</p>
          <div style={{ maxWidth:360, margin:"0 auto" }}>
            <div style={{ height:3, background:"rgba(125,184,138,.08)", borderRadius:2, overflow:"hidden" }}>
              <div style={{ height:"100%", width:pct+"%", background:"linear-gradient(90deg,#5B9E6F,#A8D5B0,#D4AF37)", borderRadius:2, transition:"width .5s" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:13, color:"rgba(168,213,176,.4)" }}>
              <span>{total} of {ALL_EVENTS.length} planned</span>
              <span>{saved ? `saved ${saved.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}` : ""}</span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth:600, margin:"0 auto", display:"flex", flexDirection:"column", gap:16 }}>
          {BUCKETS.map((b,i) => (
            <div key={b.id} style={{ animation:`fadeIn .5s ${i*.1}s ease-out both` }}>
              <Bucket b={b} evs={evFor(b.id)} onDrop={drop} dragId={dragId} dragStart={setDragId} selId={selId} onSelect={select} onTap={tapBucket} />
            </div>
          ))}
        </div>

        <div style={{ textAlign:"center", marginTop:32, display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
          {total > 0 && !locked && (
            <>
              <button onClick={() => setWarn(true)} style={{ padding:"16px 48px", background:"linear-gradient(135deg,#D4AF37,#C49B30)", border:"none", borderRadius:40, fontSize:17, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"#0a1210", cursor:"pointer", transition:"all .3s", boxShadow:"0 6px 28px rgba(212,175,55,.3)", animation:"fadeIn .6s ease-out,lockPulse 2.5s 1s ease-in-out infinite" }}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px) scale(1.03)";e.currentTarget.style.boxShadow="0 10px 36px rgba(212,175,55,.45)"}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 6px 28px rgba(212,175,55,.3)"}}>LOCK IT IN</button>
              <div style={{ fontSize:13, color:"rgba(168,213,176,.3)" }}>Happy with your choices? Make it official.</div>
            </>
          )}
          {locked && <div style={{ fontSize:15, fontWeight:500, color:"rgba(168,213,176,.5)", animation:"fadeIn .6s", padding:"10px 24px", border:"1px solid rgba(125,184,138,.1)", borderRadius:40 }}>🌿 locked in — no take-backs 🌿</div>}
          <button onClick={reset} style={{ padding:"8px 24px", background:"transparent", border:"1px solid rgba(168,213,176,.08)", borderRadius:40, color:"rgba(168,213,176,.3)", fontSize:14, cursor:"pointer", transition:"all .3s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(168,213,176,.2)";e.currentTarget.style.color="rgba(168,213,176,.5)"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(168,213,176,.08)";e.currentTarget.style.color="rgba(168,213,176,.3)"}}>reset all</button>
        </div>

        <div style={{ textAlign:"center", marginTop:24, fontSize:12, color:"rgba(168,213,176,.25)", letterSpacing:1.5 }}>SHARED VIEW — CHANGES ARE VISIBLE TO EVERYONE WITH THIS LINK</div>

        {selId && (
          <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:100, background:"rgba(10,18,16,.95)", borderTop:"1px solid rgba(125,184,138,.2)", backdropFilter:"blur(10px)", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", animation:"fadeIn .2s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:20 }}>{ALL_EVENTS.find(e=>e.id===selId)?.emoji}</span>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:"#A8D5B0" }}>{ALL_EVENTS.find(e=>e.id===selId)?.title}</div>
                <div style={{ fontSize:12, color:"rgba(168,213,176,.4)" }}>Tap a day bucket to place it</div>
              </div>
            </div>
            <button onClick={()=>setSelId(null)} style={{ padding:"6px 16px", background:"transparent", border:"1px solid rgba(168,213,176,.15)", borderRadius:20, color:"rgba(168,213,176,.4)", fontSize:12, cursor:"pointer" }}>Cancel</button>
          </div>
        )}

        {/* WARNING MODAL */}
        {warn && (
          <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,.7)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, animation:"overlayFade .3s" }}>
            <div onClick={e=>e.stopPropagation()} style={{ background:"linear-gradient(160deg,#111a14,#0d1510,#0f1812)", border:"1px solid rgba(212,175,55,.2)", borderRadius:16, maxWidth:400, width:"100%", animation:"warningSlam .5s cubic-bezier(.16,1,.3,1),warningPulse 3s .5s ease-in-out infinite", overflow:"hidden" }}>
              <div style={{ background:"rgba(212,175,55,.08)", borderBottom:"1px solid rgba(212,175,55,.1)", padding:"14px 20px", display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:20, animation:"iconShake .6s .3s ease-in-out" }}>⚠️</span>
                <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:14, fontWeight:700, letterSpacing:3, color:"rgba(212,175,55,.8)" }}>WARNING</span>
              </div>
              <div style={{ padding:"28px 24px 24px", textAlign:"center" }}>
                <div style={{ fontSize:24, fontWeight:700, color:"#D4C090", lineHeight:1.3, marginBottom:14 }}>You've made your picks.</div>
                <div style={{ fontSize:16, color:"rgba(200,220,205,.6)", lineHeight:1.7, marginBottom:10 }}>No take-backs — you're standing on your picks.<br/>I hope you're ready for this weekend.</div>
                <div style={{ fontSize:14, color:"rgba(168,213,176,.4)", marginBottom:24 }}>🌿 it's going to be perfect 🌿</div>
                <div style={{ height:2, background:"rgba(212,175,55,.08)", borderRadius:1, overflow:"hidden", marginBottom:20 }}>
                  <div style={{ height:"100%", background:"linear-gradient(90deg,#D4AF37,#A8D5B0)", borderRadius:1, animation:"barFill 2s ease-out forwards" }} />
                </div>
                <button onClick={()=>{setWarn(false);setLocked(true);setShowScratch(true)}} style={{ padding:"12px 36px", background:"transparent", border:"1px solid rgba(212,175,55,.2)", borderRadius:8, fontFamily:"'Share Tech Mono',monospace", fontSize:14, fontWeight:600, letterSpacing:2, color:"rgba(212,175,55,.6)", cursor:"pointer", transition:"all .25s" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(212,175,55,.4)";e.currentTarget.style.color="rgba(212,175,55,.9)";e.currentTarget.style.background="rgba(212,175,55,.05)"}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(212,175,55,.2)";e.currentTarget.style.color="rgba(212,175,55,.6)";e.currentTarget.style.background="transparent"}}>CONFIRM</button>
              </div>
            </div>
          </div>
        )}

        {/* SCRATCH CARD */}
        {showScratch && !prizeReveal && (
          <div style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(8,14,12,.95)", backdropFilter:"blur(10px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20, padding:20, animation:"fadeIn .6s" }}>
            <div style={{ opacity:scratchVis?1:0, transform:scratchVis?"translateY(0)":"translateY(20px)", transition:"all 1s cubic-bezier(.16,1,.3,1)", display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(22px,5vw,34px)", fontWeight:600, fontStyle:"italic", color:"#A8D5B0", textAlign:"center", animation:"softGlow 5s ease-in-out infinite" }}>One more thing...</div>
              <div style={{ fontSize:15, color:"rgba(168,213,176,.35)", textAlign:"center" }}>because you deserve it all</div>
              <ScratchCard onComplete={scratchDone} />
              <div style={{ fontSize:13, color:"rgba(168,213,176,.25)", textAlign:"center" }}>Use your finger or mouse to scratch</div>
            </div>
          </div>
        )}

        {/* PRIZE REVEALED */}
        {prizeReveal && (
          <div onClick={() => { setPrizeReveal(false); setShowScratch(false); }}
            style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(8,14,12,.95)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, animation:"fadeIn .6s", overflowY:"auto", cursor:"pointer" }}>
            <div onClick={e => e.stopPropagation()}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, background:"rgba(125,184,138,.04)", border:"1px solid rgba(125,184,138,.1)", borderRadius:24, padding:"40px 32px 32px", maxWidth:440, width:"100%", cursor:"default" }}>
              <div style={{ fontSize:"clamp(60px,16vw,100px)", animation:"pianoFloat 3s ease-in-out infinite", filter:"drop-shadow(0 8px 40px rgba(212,175,55,.35))" }}>📞</div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"clamp(18px,4.5vw,30px)", fontWeight:700, color:"rgba(168,213,176,.85)", letterSpacing:2, textAlign:"center" }}>1-800-CALL-YOUR-MAN</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(15px,3vw,19px)", fontWeight:300, fontStyle:"italic", color:"rgba(168,213,176,.5)", lineHeight:1.8, textAlign:"center" }}>For all emotional support needs, complaints about the cold, late-night snack requests, and unlimited "I love you"s — this line is open 24/7, just for you.</div>
              <div style={{ padding:"8px 24px", border:"1px solid rgba(125,184,138,.12)", borderRadius:40, fontFamily:"'Cormorant Garamond',serif", fontSize:14, fontWeight:500, fontStyle:"italic", letterSpacing:2, color:"rgba(168,213,176,.45)" }}>🌿 always on the line for you 🌿</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}