import { useState, useEffect, useRef, useCallback } from "react";
import { db, ref, set, onValue } from "./firebase";

const ALL_EVENTS = [
  { id: "art-institute", emoji: "🎨", title: "The Art Institute of Chicago", time: "~2.5 hrs", tag: "Art" },
  { id: "cultural-center", emoji: "🏛️", title: "Chicago Cultural Center", time: "~45 min", tag: "Culture" },
  { id: "girl-goat", emoji: "🍽️", title: "Girl & The Goat", time: "~1.5 hrs", tag: "Dinner" },
  { id: "three-dots", emoji: "🍹", title: "Three Dots and a Dash", time: "~1 hr", tag: "Cocktails" },
  { id: "gus-sip", emoji: "🥃", title: "Gus' Sip & Dip", time: "~1 hr", tag: "Cocktails" },
  { id: "batter-berries", emoji: "🥞", title: "Batter & Berries", time: "~1 hr", tag: "Brunch" },
  { id: "museum-illusions", emoji: "🪞", title: "Museum of Illusions", time: "~1 hr", tag: "Fun" },
  { id: "millennium-park", emoji: "☁️", title: "Millennium Park & The Bean", time: "~45 min", tag: "Sightseeing" },
  { id: "magnolia-bakery", emoji: "🧁", title: "Magnolia Bakery", time: "~20 min", tag: "Sweets" },
];

const BUCKETS = [
  { id: "unassigned", label: "Activities", icon: "✦", color: "gray", desc: "Drag these into a day" },
  { id: "friday", label: "Friday", icon: "🌙", color: "amber", desc: "Arrival day" },
  { id: "saturday", label: "Saturday", icon: "🌿", color: "green", desc: "Full day of adventure" },
  { id: "sunday", label: "Sunday", icon: "☀️", color: "teal", desc: "Last day together" },
];

const COLORS = {
  gray:  { bg: "rgba(180,180,170,0.06)", border: "rgba(180,180,170,0.12)", tag: "rgba(180,180,170,0.15)", tagText: "rgba(180,180,170,0.6)", header: "rgba(180,180,170,0.08)", headerText: "rgba(200,200,190,0.5)" },
  amber: { bg: "rgba(212,175,55,0.05)", border: "rgba(212,175,55,0.12)", tag: "rgba(212,175,55,0.15)", tagText: "rgba(212,175,55,0.6)", header: "rgba(212,175,55,0.08)", headerText: "rgba(212,175,55,0.5)" },
  green: { bg: "rgba(125,184,138,0.05)", border: "rgba(125,184,138,0.12)", tag: "rgba(125,184,138,0.15)", tagText: "rgba(125,184,138,0.6)", header: "rgba(125,184,138,0.08)", headerText: "rgba(125,184,138,0.5)" },
  teal:  { bg: "rgba(93,202,165,0.05)", border: "rgba(93,202,165,0.12)", tag: "rgba(93,202,165,0.15)", tagText: "rgba(93,202,165,0.6)", header: "rgba(93,202,165,0.08)", headerText: "rgba(93,202,165,0.5)" },
};

function EventCard({ event, onDragStart, isDragging, isSelected, onSelect }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", event.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(event.id);
      }}
      onDragEnd={() => onDragStart(null)}
      onClick={() => onSelect(event.id)}
      style={{
        padding: "14px 16px",
        background: isSelected ? "rgba(125,184,138,0.15)" : isDragging ? "rgba(125,184,138,0.12)" : "rgba(255,255,255,0.03)",
        border: isSelected ? "1.5px solid rgba(125,184,138,0.5)" : isDragging ? "1px solid rgba(125,184,138,0.3)" : "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        cursor: "grab",
        transition: "all 0.2s ease",
        opacity: isDragging ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        gap: 12,
        userSelect: "none",
        WebkitUserSelect: "none",
        transform: isSelected ? "scale(1.02)" : "none",
        boxShadow: isSelected ? "0 4px 20px rgba(125,184,138,0.2)" : "none",
      }}
    >
      <span style={{ fontSize: 24, flexShrink: 0 }}>{event.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: isSelected ? "#A8D5B0" : "rgba(224,240,228,0.95)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {event.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
          <span style={{ fontSize: 13, color: "rgba(168,213,176,0.55)" }}>{event.time}</span>
          <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 10, background: "rgba(125,184,138,0.1)", color: "rgba(125,184,138,0.6)", fontWeight: 600, letterSpacing: 0.5 }}>
            {event.tag}
          </span>
        </div>
      </div>
      {isSelected ? (
        <span style={{ fontSize: 12, color: "rgba(125,184,138,0.6)", flexShrink: 0, fontWeight: 600 }}>TAP A DAY</span>
      ) : (
        <span style={{ fontSize: 14, color: "rgba(168,213,176,0.2)", flexShrink: 0 }}>⠿</span>
      )}
    </div>
  );
}

function Bucket({ bucket, events, onDrop, draggingId, onDragStart, selectedId, onSelect, onBucketTap }) {
  const [dragOver, setDragOver] = useState(false);
  const c = COLORS[bucket.color];
  const showDropHint = selectedId && !events.find(e => e.id === selectedId);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const eventId = e.dataTransfer.getData("text/plain");
        if (eventId) onDrop(eventId, bucket.id);
      }}
      style={{
        background: (dragOver || (showDropHint && bucket.id !== "unassigned")) ? c.bg.replace("0.05", "0.12").replace("0.06", "0.14") : c.bg,
        border: `1px solid ${(dragOver || (showDropHint && bucket.id !== "unassigned")) ? c.border.replace("0.12", "0.3") : c.border}`,
        borderRadius: 16,
        padding: 0,
        transition: "all 0.25s ease",
        minHeight: bucket.id === "unassigned" ? "auto" : 120,
        boxShadow: dragOver ? `0 0 24px ${c.border}` : "none",
      }}
    >
      {/* Header — tappable to place selected card */}
      <div
        onClick={() => { if (selectedId) onBucketTap(bucket.id); }}
        style={{
          padding: "12px 16px",
          background: (showDropHint && bucket.id !== "unassigned") ? c.border.replace("0.12", "0.08") : c.header,
          borderRadius: "15px 15px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: selectedId ? "pointer" : "default",
          transition: "background 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{bucket.icon}</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: "rgba(224,240,228,0.9)", letterSpacing: 0.5 }}>
            {bucket.label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {(showDropHint && bucket.id !== "unassigned") ? (
            <span style={{ fontSize: 13, color: c.tagText, fontWeight: 600, animation: "pulse 1.5s ease-in-out infinite" }}>
              Tap to place here
            </span>
          ) : (
            <span style={{ fontSize: 13, color: c.headerText, fontStyle: "italic" }}>{bucket.desc}</span>
          )}
          {events.length > 0 && (
            <span style={{
              fontSize: 12, fontWeight: 700, width: 24, height: 24, borderRadius: "50%",
              background: c.tag, color: c.tagText,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {events.length}
            </span>
          )}
        </div>
      </div>

      {/* Body — also tappable */}
      <div
        onClick={() => { if (selectedId && bucket.id !== "unassigned") onBucketTap(bucket.id); }}
        style={{ padding: "8px 10px 10px", display: "flex", flexDirection: "column", gap: 6, cursor: selectedId ? "pointer" : "default" }}
      >
        {events.map((ev) => (
          <EventCard key={ev.id} event={ev} onDragStart={onDragStart} isDragging={draggingId === ev.id} isSelected={selectedId === ev.id} onSelect={onSelect} />
        ))}
        {events.length === 0 && bucket.id !== "unassigned" && (
          <div
            onClick={() => { if (selectedId) onBucketTap(bucket.id); }}
            style={{
              padding: "24px 16px",
              textAlign: "center",
              color: (showDropHint || dragOver) ? c.tagText : c.headerText,
              fontSize: 14,
              fontWeight: (showDropHint || dragOver) ? 600 : 400,
              fontStyle: (showDropHint || dragOver) ? "normal" : "italic",
              border: `1px dashed ${(showDropHint || dragOver) ? c.border.replace("0.12", "0.35") : c.border}`,
              borderRadius: 10,
              opacity: (showDropHint || dragOver) ? 1 : 0.6,
              transition: "all 0.2s",
              cursor: selectedId ? "pointer" : "default",
            }}
          >
            {(showDropHint || dragOver) ? "Tap to place here!" : "Drop activities here"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── HEART CONFETTI ─── */
function HeartConfetti({ active, count = 60 }) {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    if (active) {
      const colors = ["#7DB88A","#A8D5B0","#5B9E6F","#C8E6CF","#D4AF37","#F0E6A0","#8FBF9A","#B5D8BF","#6BAF7B","#E8D880"];
      setParticles(Array.from({ length: count }, (_, i) => ({
        id: i, x: Math.random()*100, y: -10-Math.random()*40,
        size: 8+Math.random()*16, color: colors[Math.floor(Math.random()*colors.length)],
        delay: Math.random()*2.5, duration: 3+Math.random()*3.5,
        drift: (Math.random()-0.5)*50, rotation: Math.random()*360,
        wobble: Math.random()*25, isHeart: Math.random()>0.3,
      })));
    }
  }, [active, count]);
  if (!active || !particles.length) return null;
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9999, overflow:"hidden" }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position:"absolute", left:`${p.x}%`, top:`${p.y}%`, fontSize:`${p.size}px`, color:p.color,
          animation:`heartFall ${p.duration}s ${p.delay}s ease-in forwards`,
          "--drift":`${p.drift}px`, "--rotation":`${p.rotation}deg`, "--wobble":`${p.wobble}px`, opacity:0,
        }}>{p.isHeart ? "♥" : "✦"}</div>
      ))}
    </div>
  );
}

/* ─── SCRATCH CARD ─── */
function ScratchCard({ onComplete }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const hasCompleted = useRef(false);
  const [revealed, setRevealed] = useState(false);
  const CARD_W = 320;
  const CARD_H = 220;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = CARD_W * 2;
    canvas.height = CARD_H * 2;
    ctx.scale(2, 2);
    const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    grad.addColorStop(0, "#2a3a2e");
    grad.addColorStop(0.3, "#1e2e22");
    grad.addColorStop(0.7, "#2a3a2e");
    grad.addColorStop(1, "#1a2a1e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CARD_W, CARD_H);
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `rgba(${180+Math.random()*75}, ${200+Math.random()*55}, ${160+Math.random()*60}, ${0.03+Math.random()*0.06})`;
      ctx.beginPath();
      ctx.arc(Math.random() * CARD_W, Math.random() * CARD_H, 0.5 + Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(168,213,176,0.5)";
    ctx.font = "600 13px 'Nunito', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH TO REVEAL", CARD_W / 2, CARD_H / 2 - 10);
    ctx.fillStyle = "rgba(168,213,176,0.25)";
    ctx.font = "400 12px 'Nunito', sans-serif";
    ctx.fillText("one more surprise...", CARD_W / 2, CARD_H / 2 + 14);
  }, []);

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CARD_W / rect.width;
    const scaleY = CARD_H / rect.height;
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }, []);

  const scratch = useCallback((pos) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(pos.x * 2, pos.y * 2, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    const imageData = ctx.getImageData(0, 0, CARD_W * 2, CARD_H * 2);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) { if (imageData.data[i] === 0) transparent++; }
    const pct = (transparent / (imageData.data.length / 4)) * 100;
    if (pct > 45 && !hasCompleted.current) {
      hasCompleted.current = true;
      setRevealed(true);
      setTimeout(() => { ctx.clearRect(0, 0, CARD_W * 2, CARD_H * 2); onComplete?.(); }, 600);
    }
  }, [onComplete]);

  const handleStart = useCallback((e) => { e.preventDefault(); isDrawing.current = true; scratch(getPos(e)); }, [getPos, scratch]);
  const handleMove = useCallback((e) => { e.preventDefault(); if (!isDrawing.current) return; scratch(getPos(e)); }, [getPos, scratch]);
  const handleEnd = useCallback(() => { isDrawing.current = false; }, []);

  return (
    <div style={{ position:"relative", width:CARD_W, height:CARD_H, borderRadius:16, overflow:"hidden",
      boxShadow: revealed ? "0 0 60px rgba(212,175,55,0.3)" : "0 8px 40px rgba(0,0,0,0.4)",
      transition:"box-shadow 0.8s ease",
    }}>
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(145deg, #0f1a14, #142018)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}>
        <div style={{ fontSize:52, filter:"drop-shadow(0 4px 20px rgba(212,175,55,0.4))", animation: revealed ? "prizeReveal 0.8s cubic-bezier(.16,1,.3,1)" : "none" }}>📞</div>
        <div style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:22, fontWeight:600, color:"rgba(168,213,176,0.8)", letterSpacing:2 }}>1-800-CALL-YOUR-MAN</div>
        <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:14, fontStyle:"italic", color:"rgba(168,213,176,0.4)", letterSpacing:1, opacity: revealed ? 1 : 0, transition:"opacity 0.6s 0.5s ease" }}>open 24/7, just for you</div>
      </div>
      <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:CARD_W, height:CARD_H, borderRadius:16, cursor:"crosshair", touchAction:"none", opacity: revealed ? 0 : 1, transition:"opacity 0.6s ease" }}
        onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
        onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd} />
    </div>
  );
}

export default function TripPlanner() {
  const [stage, setStage] = useState("login");
  const [assignments, setAssignments] = useState({});
  const [draggingId, setDraggingId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [viewerCount] = useState(Math.floor(Math.random() * 3) + 1);
  const [showWarning, setShowWarning] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showScratch, setShowScratch] = useState(false);
  const [scratchVisible, setScratchVisible] = useState(false);
  const [prizeRevealed, setPrizeRevealed] = useState(false);
  const [showPrizeConfetti, setShowPrizeConfetti] = useState(false);

  // Login state
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [bootLines, setBootLines] = useState([]);
  const [bootDone, setBootDone] = useState(false);
  const inputRef = useRef(null);

  // Blinking cursor
  useEffect(() => {
    const iv = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(iv);
  }, []);

  // Boot sequence
  useEffect(() => {
    if (stage === "login") {
      const lines = [
        { text: "INITIALIZING SECURE TERMINAL...", delay: 200 },
        { text: "ESTABLISHING ENCRYPTED CONNECTION... OK", delay: 700 },
        { text: "VERIFYING PLANNER CREDENTIALS... OK", delay: 1200 },
        { text: "CLEARANCE LEVEL: EYES ONLY", delay: 1700 },
        { text: "AUTHENTICATION REQUIRED", delay: 2200 },
      ];
      lines.forEach(({ text, delay }) => {
        setTimeout(() => setBootLines(prev => [...prev, text]), delay);
      });
      setTimeout(() => { setBootDone(true); setLoginVisible(true); }, 2800);
    }
  }, [stage]);

  useEffect(() => {
    if (showScratch) setTimeout(() => setScratchVisible(true), 400);
  }, [showScratch]);

  const handleScratchComplete = useCallback(() => {
    setPrizeRevealed(true);
    setShowPrizeConfetti(true);
    setTimeout(() => setShowPrizeConfetti(false), 6000);
  }, []);

  const handleLoginSubmit = () => {
    if (loginInput.trim().toLowerCase() === "bus") {
      setLoginSuccess(true); setLoginError(false);
      setTimeout(() => setStage("planner"), 1800);
    } else {
      setLoginError(true); setLoginInput("");
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  // Real-time Firebase listener — loads data AND syncs live updates
  useEffect(() => {
    const bucketsRef = ref(db, "tripPlanner/assignments");
    const unsubscribe = onValue(bucketsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAssignments(data);
      } else {
        setAssignments({});
      }
      setLoaded(true);
    }, (error) => {
      console.error("Firebase read failed:", error);
      setLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  // Save to Firebase
  const save = useCallback(async (newAssignments) => {
    try {
      await set(ref(db, "tripPlanner/assignments"), newAssignments);
      setLastSaved(new Date());
    } catch (e) {
      console.error("Firebase save failed:", e);
    }
  }, []);

  const handleDrop = useCallback((eventId, bucketId) => {
    setAssignments((prev) => {
      const next = { ...prev };
      if (bucketId === "unassigned") {
        delete next[eventId];
      } else {
        next[eventId] = bucketId;
      }
      save(next);
      return next;
    });
    setDraggingId(null);
  }, [save]);

  const handleSelect = useCallback((eventId) => {
    setSelectedId(prev => prev === eventId ? null : eventId);
  }, []);

  const handleBucketTap = useCallback((bucketId) => {
    if (selectedId) {
      handleDrop(selectedId, bucketId);
      setSelectedId(null);
    }
  }, [selectedId, handleDrop]);

  const getEventsForBucket = (bucketId) => {
    if (bucketId === "unassigned") {
      return ALL_EVENTS.filter((ev) => !assignments[ev.id]);
    }
    return ALL_EVENTS.filter((ev) => assignments[ev.id] === bucketId);
  };

  const resetAll = async () => {
    setAssignments({});
    setShowWarning(false);
    setWarningDismissed(false);
    setSelectedId(null);
    setShowScratch(false);
    setScratchVisible(false);
    setPrizeRevealed(false);
    setShowPrizeConfetti(false);
    try {
      await set(ref(db, "tripPlanner/assignments"), {});
      setLastSaved(new Date());
    } catch (e) {}
  };

  const totalAssigned = Object.keys(assignments).length;
  const progress = (totalAssigned / ALL_EVENTS.length) * 100;

  if (stage === "planner" && !loaded) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#0a1210,#0d1a14,#0a1610,#081310,#060f0b)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Nunito', sans-serif", color: "rgba(168,213,176,0.4)",
      }}>
        Loading your trip planner...
      </div>
    );
  }

  if (stage === "login") {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          @keyframes bootLine { from { opacity:0; transform:translateX(-5px); } to { opacity:1; transform:translateX(0); } }
          @keyframes scanMove { 0% { top:-2px; } 100% { top:100%; } }
          @keyframes inputPulse { 0%,100% { border-color:rgba(0,255,70,.12); } 50% { border-color:rgba(0,255,70,.22); } }
          @keyframes errorFlash { 0%,100% { border-color:rgba(255,60,60,.3); } 50% { border-color:rgba(255,60,60,.7); } }
          @keyframes glitchShake { 0%{transform:translate(0)}20%{transform:translate(-3px,2px)}40%{transform:translate(2px,-2px)}60%{transform:translate(-2px,1px)}80%{transform:translate(3px,-1px)}100%{transform:translate(0)} }
          @keyframes accessGranted { 0%{opacity:0;transform:scale(.8)}50%{opacity:1;transform:scale(1.05);text-shadow:0 0 40px rgba(0,255,100,.6)}100%{opacity:1;transform:scale(1);text-shadow:0 0 20px rgba(0,255,100,.4)} }
          @keyframes fadeOutUp { 0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-30px)} }
        `}</style>
        <div
          onClick={() => inputRef.current?.focus()}
          style={{
            minHeight: "100vh", background: "#0a0c0a",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
            fontFamily: "'Share Tech Mono', monospace", color: "rgba(0,255,70,.7)",
          }}
        >
          {/* CRT scanlines */}
          <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:10, background:"repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(0,0,0,.08) 1px,rgba(0,0,0,.08) 2px)" }} />
          {/* Moving scan bar */}
          <div style={{ position:"fixed", left:0, right:0, height:3, zIndex:10, pointerEvents:"none", background:"linear-gradient(180deg,transparent,rgba(0,255,70,.04),transparent)", animation:"scanMove 4s linear infinite" }} />
          {/* Vignette */}
          <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:5, background:"radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.6) 100%)" }} />

          {/* Sys info */}
          <div style={{ position:"fixed", top:14, right:20, zIndex:6, fontSize:9, color:"rgba(0,255,70,.12)", letterSpacing:1, textAlign:"right", lineHeight:1.8 }}>
            SYS BUILD 4.7.2<br/>NODE 0x7A2F<br/>{new Date().toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}).toUpperCase()}
          </div>

          <div style={{ zIndex:6, width:"100%", maxWidth:520, padding:"0 24px" }}>
            {/* Classification bar */}
            <div style={{ textAlign:"center", padding:"8px 0", marginBottom:32, borderTop:"1px solid rgba(0,255,70,.1)", borderBottom:"1px solid rgba(0,255,70,.1)", fontSize:11, fontWeight:700, letterSpacing:6, textTransform:"uppercase", color:"rgba(0,255,70,.35)" }}>
              TOP SECRET // SENSITIVE COMPARTMENTED INFORMATION
            </div>

            {/* Boot sequence */}
            <div style={{ marginBottom:28, minHeight:110 }}>
              {bootLines.map((line, i) => (
                <div key={i} style={{ fontSize:11, color: i === bootLines.length-1 ? "rgba(0,255,70,.5)" : "rgba(0,255,70,.3)", fontWeight: i === bootLines.length-1 ? 700 : 400, letterSpacing:0.5, marginBottom:4, animation:"bootLine .3s ease-out", lineHeight:1.6 }}>
                  &gt; {line}
                </div>
              ))}
            </div>

            {/* Auth panel */}
            <div style={{
              opacity: bootDone && loginVisible ? 1 : 0,
              transform: bootDone && loginVisible ? "translateY(0)" : "translateY(15px)",
              transition: "all .8s cubic-bezier(.16,1,.3,1)",
              ...(loginSuccess ? { animation: "fadeOutUp .8s ease-in forwards" } : {}),
            }}>
              <div style={{ height:1, background:"rgba(0,255,70,.06)", marginBottom:24 }} />
              <div style={{ fontSize:10, letterSpacing:3, textTransform:"uppercase", color:"rgba(0,255,70,.2)", marginBottom:16 }}>
                SECURITY VERIFICATION — LEVEL 5 CLEARANCE
              </div>
              <div style={{ fontSize:"clamp(17px,3.5vw,24px)", color:"rgba(0,255,70,.65)", marginBottom:6, letterSpacing:0.5, lineHeight:1.5 }}>
                Where did it all begin?
              </div>
              <div style={{ fontSize:10, color:"rgba(0,255,70,.15)", letterSpacing:2, textTransform:"uppercase", marginBottom:24 }}>
                ANSWER REQUIRED TO PROCEED
              </div>

              {/* Input row */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <span style={{ fontSize:16, color:"rgba(0,255,70,.3)", flexShrink:0 }}>&gt;_</span>
                <div
                  style={{
                    flex:1, padding:"12px 16px", background:"rgba(0,255,70,.02)",
                    border:"1px solid rgba(0,255,70,.1)", borderRadius:2,
                    fontFamily:"'Share Tech Mono',monospace", fontSize:18, color:"rgba(0,255,70,.8)",
                    letterSpacing:3, minHeight:46, display:"flex", alignItems:"center", cursor:"text",
                    position:"relative",
                    ...(loginError ? { animation:"errorFlash .4s ease-in-out 3, glitchShake .25s ease-in-out", borderColor:"rgba(255,50,50,.4)" } : {}),
                    ...(loginSuccess ? { borderColor:"rgba(0,255,70,.4)", boxShadow:"0 0 20px rgba(0,255,70,.08)" } : {}),
                    ...(!loginError && !loginSuccess ? { animation:"inputPulse 3s ease-in-out infinite" } : {}),
                  }}
                >
                  {loginInput.split("").map((ch, i) => (
                    <span key={i} style={{ display:"inline-block", textTransform:"uppercase" }}>{ch}</span>
                  ))}
                  <span style={{ display:"inline-block", width:8, height:18, background:"rgba(0,255,70,.6)", marginLeft:1, verticalAlign:"middle", opacity: cursorVisible ? 1 : 0 }} />
                  <input
                    ref={inputRef}
                    type="text"
                    autoFocus
                    value={loginInput}
                    onChange={e => { setLoginInput(e.target.value); setLoginError(false); }}
                    onKeyDown={e => { if (e.key === "Enter") handleLoginSubmit(); }}
                    autoCapitalize="none" autoCorrect="off" spellCheck="false"
                    style={{ position:"absolute", width:1, height:1, opacity:0, top:0, left:0, pointerEvents:"none" }}
                  />
                </div>
              </div>

              {/* Submit row */}
              <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                <button
                  onClick={handleLoginSubmit}
                  style={{
                    padding:"10px 28px", background:"transparent",
                    border:"1px solid rgba(0,255,70,.15)", borderRadius:2,
                    fontFamily:"'Share Tech Mono',monospace", fontSize:14, fontWeight:600,
                    letterSpacing:2, textTransform:"uppercase", color:"rgba(0,255,70,.4)",
                    cursor:"pointer", transition:"all .25s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(0,255,70,.35)"; e.currentTarget.style.color="rgba(0,255,70,.7)"; e.currentTarget.style.background="rgba(0,255,70,.03)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(0,255,70,.15)"; e.currentTarget.style.color="rgba(0,255,70,.4)"; e.currentTarget.style.background="transparent"; }}
                >
                  AUTHENTICATE
                </button>
                {loginError && <span style={{ fontSize:12, letterSpacing:1, color:"rgba(255,50,50,.5)" }}>ACCESS DENIED — INVALID RESPONSE</span>}
                {loginSuccess && <span style={{ fontSize:12, letterSpacing:1, color:"rgba(0,255,70,.7)", fontWeight:700, animation:"accessGranted .8s ease-out forwards" }}>ACCESS GRANTED</span>}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:6, padding:"10px 0", textAlign:"center", borderTop:"1px solid rgba(0,255,70,.05)", fontSize:9, letterSpacing:3, textTransform:"uppercase", color:"rgba(0,255,70,.1)", background:"rgba(10,12,10,.8)" }}>
            UNAUTHORIZED ACCESS IS PROHIBITED — ALL ACTIVITY IS MONITORED AND RECORDED
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Nunito:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmerGreen { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes softGlow { 0%,100% { text-shadow: 0 0 20px rgba(125,184,138,.2); } 50% { text-shadow: 0 0 30px rgba(125,184,138,.35); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes warningSlam { 0% { opacity:0; transform:scale(1.15); } 40% { opacity:1; transform:scale(0.97); } 60% { transform:scale(1.02); } 100% { transform:scale(1); } }
        @keyframes warningPulse { 0%,100% { box-shadow: 0 0 30px rgba(212,175,55,0.1), 0 0 60px rgba(0,0,0,0.3); } 50% { box-shadow: 0 0 50px rgba(212,175,55,0.2), 0 0 80px rgba(0,0,0,0.4); } }
        @keyframes overlayFade { from { opacity:0; } to { opacity:1; } }
        @keyframes iconShake { 0%,100%{transform:rotate(0deg)} 15%{transform:rotate(-8deg)} 30%{transform:rotate(8deg)} 45%{transform:rotate(-5deg)} 60%{transform:rotate(5deg)} 75%{transform:rotate(-2deg)} }
        @keyframes barFill { from { width:0; } to { width:100%; } }
        @keyframes lockPulse { 0%,100% { box-shadow: 0 6px 28px rgba(212,175,55,0.3); } 50% { box-shadow: 0 8px 36px rgba(212,175,55,0.5); } }
        @keyframes heartFall { 0%{transform:translateY(0) translateX(0) rotate(0deg) scale(.5);opacity:0}10%{opacity:1;transform:translateY(5vh) translateX(var(--wobble)) rotate(20deg) scale(1)}50%{opacity:.9;transform:translateY(50vh) translateX(calc(var(--drift)*.5)) rotate(calc(var(--rotation)*.5)) scale(.9)}100%{opacity:0;transform:translateY(115vh) translateX(var(--drift)) rotate(var(--rotation)) scale(.6)} }
        @keyframes prizeReveal { 0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.15) rotate(5deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:1} }
        @keyframes pianoFloat { 0%,100%{transform:translateY(0px) scale(1)}50%{transform:translateY(-10px) scale(1.03)} }
        @keyframes shimmerGreen { 0%{background-position:-200% center}100%{background-position:200% center} }
        @keyframes bootLine { from { opacity:0; transform:translateX(-5px); } to { opacity:1; transform:translateX(0); } }
        @keyframes scanMove { 0% { top:-2px; } 100% { top:100%; } }
        @keyframes inputPulse { 0%,100% { border-color:rgba(0,255,70,.12); } 50% { border-color:rgba(0,255,70,.22); } }
        @keyframes errorFlash { 0%,100% { border-color:rgba(255,60,60,.3); } 50% { border-color:rgba(255,60,60,.7); } }
        @keyframes glitchShake { 0%{transform:translate(0)}20%{transform:translate(-3px,2px)}40%{transform:translate(2px,-2px)}60%{transform:translate(-2px,1px)}80%{transform:translate(3px,-1px)}100%{transform:translate(0)} }
        @keyframes accessGranted { 0%{opacity:0;transform:scale(.8)}50%{opacity:1;transform:scale(1.05);text-shadow:0 0 40px rgba(0,255,100,.6)}100%{opacity:1;transform:scale(1);text-shadow:0 0 20px rgba(0,255,100,.4)} }
        @keyframes fadeOutUp { 0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-30px)} }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#0a1210 0%,#0d1a14 20%,#0a1610 45%,#081310 70%,#060f0b 100%)",
        fontFamily: "'Nunito', sans-serif",
        color: "#E0F0E4",
        padding: "32px 16px 80px",
      }}>
        {/* Header */}
        <div style={{
          textAlign: "center",
          marginBottom: 32,
          animation: "fadeIn 0.8s ease-out",
        }}>
          <div style={{ fontSize: 13, letterSpacing: 14, color: "rgba(125,184,138,0.3)", marginBottom: 12 }}>
            🌿 ♥ 🌿
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(28px, 6vw, 42px)",
            fontWeight: 600,
            fontStyle: "italic",
            color: "#A8D5B0",
            animation: "softGlow 5s ease-in-out infinite",
            marginBottom: 6,
          }}>
            Plan Our Weekend
          </h1>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 17,
            fontWeight: 400,
            color: "rgba(168,213,176,0.5)",
            marginBottom: 20,
          }}>
            Drag or tap each activity, then tap a day to place it
          </p>

          {/* Progress bar */}
          <div style={{ maxWidth: 360, margin: "0 auto", position: "relative" }}>
            <div style={{
              height: 3,
              background: "rgba(125,184,138,0.08)",
              borderRadius: 2,
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${progress}%`,
                background: "linear-gradient(90deg, #5B9E6F, #A8D5B0, #D4AF37)",
                borderRadius: 2,
                transition: "width 0.5s ease",
              }} />
            </div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              fontSize: 13,
              color: "rgba(168,213,176,0.4)",
            }}>
              <span>{totalAssigned} of {ALL_EVENTS.length} planned</span>
              <span>
                {lastSaved ? `saved ${lastSaved.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Buckets */}
        <div style={{
          maxWidth: 600,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}>
          {BUCKETS.map((bucket, i) => (
            <div key={bucket.id} style={{ animation: `fadeIn 0.5s ${i * 0.1}s ease-out both` }}>
              <Bucket
                bucket={bucket}
                events={getEventsForBucket(bucket.id)}
                onDrop={handleDrop}
                draggingId={draggingId}
                onDragStart={setDraggingId}
                selectedId={selectedId}
                onSelect={handleSelect}
                onBucketTap={handleBucketTap}
              />
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div style={{
          textAlign: "center",
          marginTop: 32,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}>
          {/* Lock it in button - shows when at least one event is placed */}
          {totalAssigned > 0 && !warningDismissed && (
            <>
              <button
                onClick={() => setShowWarning(true)}
                style={{
                  padding: "16px 48px",
                  background: "linear-gradient(135deg, #D4AF37, #C49B30)",
                  border: "none",
                  borderRadius: 40,
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  color: "#0a1210",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 6px 28px rgba(212,175,55,0.3)",
                  animation: "fadeIn 0.6s ease-out, lockPulse 2.5s 1s ease-in-out infinite",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.03)";
                  e.currentTarget.style.boxShadow = "0 10px 36px rgba(212,175,55,0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "0 6px 28px rgba(212,175,55,0.3)";
                }}
              >
                LOCK IT IN
              </button>
              <div style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 13,
                color: "rgba(168,213,176,0.3)",
                marginTop: 4,
              }}>
                Happy with your choices? Make it official.
              </div>
            </>
          )}

          {totalAssigned > 0 && warningDismissed && (
            <div style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 15,
              fontWeight: 500,
              color: "rgba(168,213,176,0.5)",
              animation: "fadeIn 0.6s ease-out",
              padding: "10px 24px",
              border: "1px solid rgba(125,184,138,0.1)",
              borderRadius: 40,
            }}>
              🌿 locked in — no take-backs 🌿
            </div>
          )}

        {/* WARNING MODAL */}
        {showWarning && (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 20,
              animation: "overlayFade 0.3s ease-out",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "linear-gradient(160deg, #111a14, #0d1510, #0f1812)",
                border: "1px solid rgba(212,175,55,0.2)",
                borderRadius: 16,
                padding: "0",
                maxWidth: 400,
                width: "100%",
                animation: "warningSlam 0.5s cubic-bezier(.16,1,.3,1), warningPulse 3s 0.5s ease-in-out infinite",
                overflow: "hidden",
              }}
            >
              {/* Warning header bar */}
              <div style={{
                background: "rgba(212,175,55,0.08)",
                borderBottom: "1px solid rgba(212,175,55,0.1)",
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <span style={{
                  fontSize: 20,
                  animation: "iconShake 0.6s 0.3s ease-in-out",
                }}>
                  ⚠️
                </span>
                <span style={{
                  fontFamily: "'Share Tech Mono', 'JetBrains Mono', monospace",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: "rgba(212,175,55,0.8)",
                }}>
                  WARNING
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: "28px 24px 24px", textAlign: "center" }}>
                <div style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#D4C090",
                  lineHeight: 1.3,
                  marginBottom: 14,
                }}>
                  You've made your picks.
                </div>
                <div style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 16,
                  fontWeight: 400,
                  color: "rgba(200,220,205,0.6)",
                  lineHeight: 1.7,
                  marginBottom: 10,
                }}>
                  No take-backs — you're standing on your picks.
                  <br />
                  I hope you're ready for this weekend.
                </div>
                <div style={{
                  fontSize: 14,
                  color: "rgba(168,213,176,0.4)",
                  marginBottom: 24,
                }}>
                  🌿 it's going to be perfect 🌿
                </div>

                {/* Fake loading bar */}
                <div style={{
                  height: 2,
                  background: "rgba(212,175,55,0.08)",
                  borderRadius: 1,
                  overflow: "hidden",
                  marginBottom: 20,
                }}>
                  <div style={{
                    height: "100%",
                    background: "linear-gradient(90deg, #D4AF37, #A8D5B0)",
                    borderRadius: 1,
                    animation: "barFill 2s ease-out forwards",
                  }} />
                </div>

                {/* Confirm button */}
                <button
                  onClick={() => { setShowWarning(false); setWarningDismissed(true); setShowScratch(true); }}
                  style={{
                    padding: "12px 36px",
                    background: "transparent",
                    border: "1px solid rgba(212,175,55,0.2)",
                    borderRadius: 8,
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "rgba(212,175,55,0.6)",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)";
                    e.currentTarget.style.color = "rgba(212,175,55,0.9)";
                    e.currentTarget.style.background = "rgba(212,175,55,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)";
                    e.currentTarget.style.color = "rgba(212,175,55,0.6)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  CONFIRM
                </button>
              </div>
            </div>
          </div>
        )}
          <button
            onClick={resetAll}
            style={{
              padding: "8px 24px",
              background: "transparent",
              border: "1px solid rgba(168,213,176,0.08)",
              borderRadius: 40,
              color: "rgba(168,213,176,0.3)",
              fontFamily: "'Nunito', sans-serif",
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(168,213,176,0.2)";
              e.currentTarget.style.color = "rgba(168,213,176,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(168,213,176,0.08)";
              e.currentTarget.style.color = "rgba(168,213,176,0.2)";
            }}
          >
            reset all
          </button>
        </div>

        {/* Shared storage notice */}
        <div style={{
          textAlign: "center",
          marginTop: 24,
          fontSize: 12,
          color: "rgba(168,213,176,0.25)",
          letterSpacing: 1.5,
        }}>
          SHARED VIEW — CHANGES ARE VISIBLE TO EVERYONE WITH THIS LINK
        </div>

        {/* Floating selection banner for mobile */}
        {selectedId && (
          <div style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: "rgba(10,18,16,0.95)",
            borderTop: "1px solid rgba(125,184,138,0.2)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "fadeIn 0.2s ease-out",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>
                {ALL_EVENTS.find(e => e.id === selectedId)?.emoji}
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#A8D5B0" }}>
                  {ALL_EVENTS.find(e => e.id === selectedId)?.title}
                </div>
                <div style={{ fontSize: 12, color: "rgba(168,213,176,0.4)" }}>
                  Tap a day bucket to place it
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              style={{
                padding: "6px 16px",
                background: "transparent",
                border: "1px solid rgba(168,213,176,0.15)",
                borderRadius: 20,
                color: "rgba(168,213,176,0.4)",
                fontFamily: "'Nunito', sans-serif",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* SCRATCH CARD OVERLAY */}
        {showScratch && !prizeRevealed && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 9998,
            background: "rgba(8,14,12,0.95)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 20, padding: 20,
            animation: "fadeIn 0.6s ease-out",
          }}>
            <div style={{
              opacity: scratchVisible ? 1 : 0,
              transform: scratchVisible ? "translateY(0)" : "translateY(20px)",
              transition: "all 1s cubic-bezier(.16,1,.3,1)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
            }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(22px, 5vw, 34px)",
                fontWeight: 600, fontStyle: "italic",
                color: "#A8D5B0",
                textAlign: "center",
                animation: "softGlow 5s ease-in-out infinite",
              }}>
                One more thing...
              </div>
              <div style={{
                fontSize: 15, color: "rgba(168,213,176,0.35)",
                fontWeight: 300, textAlign: "center",
              }}>
                because you deserve it all
              </div>
              <ScratchCard onComplete={handleScratchComplete} />
              <div style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 13, color: "rgba(168,213,176,0.25)",
                textAlign: "center",
              }}>
                Use your finger or mouse to scratch
              </div>
            </div>
          </div>
        )}

        {/* PRIZE REVEALED OVERLAY */}
        {prizeRevealed && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 9998,
            background: "rgba(8,14,12,0.95)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 16, padding: 20,
            animation: "fadeIn 0.6s ease-out",
          }}>
            <HeartConfetti active={showPrizeConfetti} count={100} />
            <div style={{
              fontSize: "clamp(70px, 18vw, 120px)",
              animation: "pianoFloat 3s ease-in-out infinite",
              filter: "drop-shadow(0 8px 40px rgba(212,175,55,0.35))",
            }}>
              📞
            </div>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "clamp(20px, 5vw, 36px)",
              fontWeight: 700,
              color: "rgba(168,213,176,0.85)",
              letterSpacing: 2,
            }}>
              1-800-CALL-YOUR-MAN
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(16px, 3vw, 21px)",
              fontWeight: 300, fontStyle: "italic",
              color: "rgba(168,213,176,0.5)",
              maxWidth: 420, lineHeight: 1.8,
              textAlign: "center",
            }}>
              For all emotional support needs, complaints about the cold,
              late-night snack requests, and unlimited "I love you"s —
              this line is open 24/7, just for you.
            </div>
            <div style={{
              marginTop: 8, padding: "10px 28px",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: 40,
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 15, fontWeight: 500, fontStyle: "italic",
              letterSpacing: 2, color: "rgba(212,175,55,0.6)",
            }}>
              🌿 always on the line for you 🌿
            </div>
          </div>
        )}
      </div>
    </>
  );
}