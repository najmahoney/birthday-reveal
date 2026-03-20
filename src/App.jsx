import { useState, useEffect, useRef, useCallback } from "react";

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

function FloatingHearts() {
  const h = ["💚","♥","🌿","✨","💚","♥","🍃","✨","💚","♥","🌱","✨"];
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      {h.map((e,i) => (
        <div key={i} style={{ position:"absolute", left:`${3+i*8}%`, fontSize:`${14+Math.random()*14}px`, opacity:0.07, animation:`floatUp ${10+i*1.2}s ${i*0.9}s ease-in-out infinite`, bottom:"-30px" }}>{e}</div>
      ))}
    </div>
  );
}

function SoftGlow({ color="rgba(125,184,138,0.12)", x="50%", y="50%", size="400px" }) {
  return <div style={{ position:"absolute", left:x, top:y, width:size, height:size, borderRadius:"50%", background:color, filter:"blur(80px)", transform:"translate(-50%,-50%)", pointerEvents:"none", animation:"breathe 7s ease-in-out infinite" }} />;
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
    ctx.font = "600 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH TO REVEAL", CARD_W / 2, CARD_H / 2 - 10);
    ctx.fillStyle = "rgba(168,213,176,0.25)";
    ctx.font = "400 11px monospace";
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
        <div style={{ fontSize:52, filter:"drop-shadow(0 4px 20px rgba(212,175,55,0.4))", animation: revealed ? "prizeReveal 0.8s cubic-bezier(.16,1,.3,1)" : "none" }}>🎹</div>
        <div style={{ fontFamily:"'Great Vibes', cursive", fontSize:32, background:"linear-gradient(135deg, #D4AF37, #F0E6A0, #D4AF37)", backgroundSize:"200% 200%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", animation:"shimmerGreen 3s ease-in-out infinite", filter:"drop-shadow(0 2px 10px rgba(212,175,55,0.3))" }}>A Piano</div>
        <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:13, fontStyle:"italic", color:"rgba(168,213,176,0.4)", letterSpacing:1, opacity: revealed ? 1 : 0, transition:"opacity 0.6s 0.5s ease" }}>just for you</div>
      </div>
      <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:CARD_W, height:CARD_H, borderRadius:16, cursor:"crosshair", touchAction:"none", opacity: revealed ? 0 : 1, transition:"opacity 0.6s ease" }}
        onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
        onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd} />
    </div>
  );
}

const itineraryData = [
  { emoji:"🎨", title:"The Art Institute of Chicago", description:"Walking hand in hand through rooms of Monet, Van Gogh, and Seurat. The Impressionist wing is pure magic.", time:"Saturday 1:00 PM", tag:"Art Together" },
  { emoji:"🏛️", title:"Chicago Cultural Center", description:"Stunning Tiffany glass domes glowing above us — a gorgeous, free hidden gem just for the two of us.", time:"Saturday 3:30 PM", tag:"Hidden Beauty" },
  { emoji:"🍽️", title:"Girl & The Goat", description:"Your birthday dinner at one of Chicago's best restaurants. Sharing plates, bold flavors, and a night to remember.", time:"Saturday 7:00 PM", tag:"Birthday Dinner" },
  { emoji:"🍹", title:"Three Dots and a Dash", description:"Down a secret alley, through a hidden door — a tropical cocktail paradise waiting just for us.", time:"Saturday 9:00 PM", tag:"Secret Spot" },
  { emoji:"🥃", title:"Gus' Sip & Dip", description:"Cozy retro vibes, incredible cocktails, and the perfect place to end the night together. Cheers to you.", time:"Saturday 10:30 PM", tag:"Nightcap" },
  { emoji:"🥞", title:"Batter & Berries", description:"Waking up to legendary French toast flights and BYOB birthday mimosas. The perfect morning after.", time:"Sunday 10:00 AM", tag:"Morning Together" },
  { emoji:"🪞", title:"Museum of Illusions", description:"Laughing together in infinity mirrors and the giant/tiny room. The best kind of silly, the best kind of us.", time:"Sunday 12:30 PM", tag:"Playful Moments" },
  { emoji:"☁️", title:"Millennium Park & The Bean", description:"Our reflection in the Bean, a walk along the lakefront, the skyline stretched out ahead. Breathtaking — like you.", time:"Sunday 2:00 PM", tag:"Just Us" },
  { emoji:"🧁", title:"Magnolia Bakery", description:"Famous banana pudding and cupcakes for the road. A sweet ending to the sweetest weekend.", time:"Sunday 3:00 PM", tag:"Sweet Ending" },
];

const LETTERS = ["C","H","I","C","A","G","O"];

export default function BirthdayReveal() {
  const [stage, setStage] = useState("login");
  const [showConfetti, setShowConfetti] = useState(false);
  const [giftShake, setGiftShake] = useState(false);
  const [revealedCards, setRevealedCards] = useState([]);
  const [cityLetters, setCityLetters] = useState([]);
  const [introVisible, setIntroVisible] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [showFinaleConfetti, setShowFinaleConfetti] = useState(false);
  const [showPrizeConfetti, setShowPrizeConfetti] = useState(false);
  const [scratchVisible, setScratchVisible] = useState(false);
  const [prizeRevealed, setPrizeRevealed] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [bootLines, setBootLines] = useState([]);
  const [bootDone, setBootDone] = useState(false);
  const inputRef = useRef(null);

  // Guards to prevent React StrictMode double-fire
  const bootStarted = useRef(false);
  const cityRevealStarted = useRef(false);
  const giftUnwrapStarted = useRef(false);

  useEffect(() => { window.scrollTo(0, 0); }, [stage]);
  useEffect(() => { const iv = setInterval(() => setCursorVisible(v => !v), 530); return () => clearInterval(iv); }, []);

  // Boot sequence — guarded
  useEffect(() => {
    if (stage !== "login" || bootStarted.current) return;
    bootStarted.current = true;
    const lines = [
      { text: "INITIALIZING SECURE TERMINAL...", delay: 200 },
      { text: "ESTABLISHING ENCRYPTED CONNECTION... OK", delay: 700 },
      { text: "LOADING SECURITY PROTOCOLS... OK", delay: 1200 },
      { text: "CLEARANCE LEVEL: EYES ONLY", delay: 1700 },
      { text: "AUTHENTICATION REQUIRED", delay: 2200 },
    ];
    const timeouts = [];
    lines.forEach(({ text, delay }) => {
      timeouts.push(setTimeout(() => setBootLines(prev => [...prev, text]), delay));
    });
    timeouts.push(setTimeout(() => { setBootDone(true); setLoginVisible(true); }, 2800));
    return () => timeouts.forEach(clearTimeout);
  }, [stage]);

  // City reveal letter animation — guarded
  useEffect(() => {
    if (stage !== "cityReveal" || cityRevealStarted.current) return;
    cityRevealStarted.current = true;
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 6000);
    const timeouts = [];
    LETTERS.forEach((l, i) => {
      timeouts.push(setTimeout(() => setCityLetters(prev => [...prev, l]), 400 + i * 200));
    });
    return () => timeouts.forEach(clearTimeout);
  }, [stage]);

  useEffect(() => { if (stage === "scratch") setTimeout(() => setScratchVisible(true), 400); }, [stage]);

  const handleLoginSubmit = () => {
    if (loginInput.trim().toLowerCase() === "bus") {
      setLoginSuccess(true); setLoginError(false);
      setTimeout(() => { setStage("intro"); setTimeout(() => setIntroVisible(true), 400); }, 1800);
    } else {
      setLoginError(true); setLoginInput("");
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const handleGiftTap = () => {
    if (giftUnwrapStarted.current) return;
    setTapCount(prev => {
      const next = prev + 1;
      setGiftShake(true);
      setTimeout(() => setGiftShake(false), 600);
      if (next >= 3) {
        giftUnwrapStarted.current = true;
        setTimeout(() => setStage("cityReveal"), 500);
      }
      return next;
    });
  };

  const revealCard = (index) => {
    if (!revealedCards.includes(index)) {
      setRevealedCards(prev => {
        const next = [...prev, index];
        if (next.length === itineraryData.length) {
          setTimeout(() => {
            setStage("finale");
            setShowFinaleConfetti(true);
            setTimeout(() => setShowFinaleConfetti(false), 7000);
          }, 1200);
        }
        return next;
      });
    }
  };

  const handleScratchComplete = useCallback(() => {
    setPrizeRevealed(true); setShowPrizeConfetti(true);
    setTimeout(() => { setStage("prizeRevealed"); setTimeout(() => setShowPrizeConfetti(false), 5000); }, 1500);
  }, []);

  const restart = () => {
    setStage("login"); setShowConfetti(false); setGiftShake(false);
    setRevealedCards([]); setCityLetters([]); setTapCount(0);
    setShowFinaleConfetti(false); setShowPrizeConfetti(false);
    setIntroVisible(false); setLoginInput(""); setLoginSuccess(false);
    setLoginError(false); setLoginVisible(false);
    setScratchVisible(false); setPrizeRevealed(false);
    setBootLines([]); setBootDone(false);
    bootStarted.current = false;
    cityRevealStarted.current = false;
    giftUnwrapStarted.current = false;
  };

  const showButton = cityLetters.length >= 7;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Nunito:wght@300;400;500;600;700&family=Great+Vibes&family=Share+Tech+Mono&display=swap');

        @keyframes heartFall{0%{transform:translateY(0) translateX(0) rotate(0deg) scale(.5);opacity:0}10%{opacity:1;transform:translateY(5vh) translateX(var(--wobble)) rotate(20deg) scale(1)}50%{opacity:.9;transform:translateY(50vh) translateX(calc(var(--drift)*.5)) rotate(calc(var(--rotation)*.5)) scale(.9)}100%{opacity:0;transform:translateY(115vh) translateX(var(--drift)) rotate(var(--rotation)) scale(.6)}}
        @keyframes floatUp{0%{transform:translateY(0) rotate(0deg);opacity:.07}50%{transform:translateY(-50vh) rotate(180deg);opacity:.04}100%{transform:translateY(-115vh) rotate(360deg);opacity:0}}
        @keyframes giftPulse{0%,100%{transform:scale(1);filter:drop-shadow(0 8px 30px rgba(125,184,138,.4))}50%{transform:scale(1.04);filter:drop-shadow(0 12px 40px rgba(125,184,138,.6))}}
        @keyframes giftShake{0%,100%{transform:rotate(0deg) scale(1)}12%{transform:rotate(-10deg) scale(1.06)}24%{transform:rotate(10deg) scale(1.1)}36%{transform:rotate(-7deg) scale(1.06)}48%{transform:rotate(7deg) scale(1.03)}60%{transform:rotate(-3deg) scale(1.01)}}
        @keyframes slideUpSoft{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes letterDrop{0%{transform:translateY(-60px) scale(0) rotate(-15deg);opacity:0}50%{transform:translateY(8px) scale(1.08) rotate(3deg);opacity:1}70%{transform:translateY(-4px) scale(.97) rotate(-1deg)}100%{transform:translateY(0) scale(1) rotate(0deg);opacity:1}}
        @keyframes shimmerGreen{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes softGlow{0%,100%{text-shadow:0 0 20px rgba(125,184,138,.2),0 0 40px rgba(125,184,138,.08)}50%{text-shadow:0 0 30px rgba(125,184,138,.35),0 0 60px rgba(125,184,138,.15)}}
        @keyframes breathe{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.7}50%{transform:translate(-50%,-50%) scale(1.08);opacity:1}}
        @keyframes fadeInScale{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes borderPulse{0%,100%{box-shadow:0 0 15px rgba(125,184,138,.15),inset 0 0 10px rgba(125,184,138,.04)}50%{box-shadow:0 0 25px rgba(125,184,138,.3),inset 0 0 20px rgba(125,184,138,.08)}}
        @keyframes heartbeat{0%,100%{transform:scale(1)}14%{transform:scale(1.15)}28%{transform:scale(1)}42%{transform:scale(1.1)}56%{transform:scale(1)}}
        @keyframes revealGlow{0%{box-shadow:0 0 0 rgba(125,184,138,0)}50%{box-shadow:0 0 30px rgba(125,184,138,.25)}100%{box-shadow:0 0 15px rgba(125,184,138,.08)}}
        @keyframes leafSway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
        @keyframes glitchShake{0%{transform:translate(0)}20%{transform:translate(-3px,2px)}40%{transform:translate(2px,-2px)}60%{transform:translate(-2px,1px)}80%{transform:translate(3px,-1px)}100%{transform:translate(0)}}
        @keyframes accessGranted{0%{opacity:0;transform:scale(.8)}50%{opacity:1;transform:scale(1.05);text-shadow:0 0 40px rgba(0,255,100,.6)}100%{opacity:1;transform:scale(1);text-shadow:0 0 20px rgba(0,255,100,.4)}}
        @keyframes fadeOutUp{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-30px)}}
        @keyframes errorFlash{0%,100%{border-color:rgba(255,60,60,.3)}50%{border-color:rgba(255,60,60,.7)}}
        @keyframes prizeReveal{0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.15) rotate(5deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:1}}
        @keyframes pianoFloat{0%,100%{transform:translateY(0px) scale(1)}50%{transform:translateY(-10px) scale(1.03)}}
        @keyframes bootLine{from{opacity:0;transform:translateX(-5px)}to{opacity:1;transform:translateX(0)}}
        @keyframes scanMove{0%{top:-2px}100%{top:100%}}
        @keyframes inputPulse{0%,100%{border-color:rgba(0,255,70,.12)}50%{border-color:rgba(0,255,70,.22)}}
        @keyframes cardEntrance{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}

        *{box-sizing:border-box;margin:0;padding:0}

        .login-screen{min-height:100vh;background:#0a0c0a;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;font-family:'Share Tech Mono',monospace;color:rgba(0,255,70,.7)}
        .login-screen::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:10;background:repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(0,0,0,.08) 1px,rgba(0,0,0,.08) 2px)}
        .login-screen::after{content:'';position:fixed;left:0;right:0;height:3px;z-index:10;pointer-events:none;background:linear-gradient(180deg,transparent,rgba(0,255,70,.04),transparent);animation:scanMove 4s linear infinite}
        .vignette{position:fixed;inset:0;pointer-events:none;z-index:5;background:radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.6) 100%)}
        .login-container{z-index:6;width:100%;max-width:520px;padding:0 24px}
        .class-bar{text-align:center;padding:8px 0;margin-bottom:32px;border-top:1px solid rgba(0,255,70,.1);border-bottom:1px solid rgba(0,255,70,.1);font-size:11px;font-weight:700;letter-spacing:6px;text-transform:uppercase;color:rgba(0,255,70,.35)}
        .boot-area{margin-bottom:28px;min-height:110px}
        .boot-line{font-size:11px;color:rgba(0,255,70,.3);letter-spacing:.5px;margin-bottom:4px;animation:bootLine .3s ease-out;line-height:1.6}
        .boot-line:last-child{color:rgba(0,255,70,.5);font-weight:700}
        .auth-panel{opacity:0;transform:translateY(15px);transition:all .8s cubic-bezier(.16,1,.3,1)}
        .auth-panel.show{opacity:1;transform:translateY(0)}
        .auth-panel.leaving{animation:fadeOutUp .8s ease-in forwards}
        .divider-line{height:1px;background:rgba(0,255,70,.06);margin:0 0 24px}
        .auth-label{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(0,255,70,.2);margin-bottom:16px}
        .question-text{font-size:clamp(17px,3.5vw,24px);color:rgba(0,255,70,.65);margin-bottom:6px;letter-spacing:.5px;line-height:1.5}
        .question-sub{font-size:10px;color:rgba(0,255,70,.15);letter-spacing:2px;text-transform:uppercase;margin-bottom:24px}
        .input-row{display:flex;align-items:center;gap:10px;margin-bottom:20px}
        .prompt-symbol{font-size:16px;color:rgba(0,255,70,.3);flex-shrink:0}
        .terminal-field{flex:1;padding:12px 16px;background:rgba(0,255,70,.02);border:1px solid rgba(0,255,70,.1);border-radius:2px;font-family:'Share Tech Mono',monospace;font-size:18px;color:rgba(0,255,70,.8);letter-spacing:3px;min-height:46px;display:flex;align-items:center;cursor:text;animation:inputPulse 3s ease-in-out infinite}
        .terminal-field.error{animation:errorFlash .4s ease-in-out 3,glitchShake .25s ease-in-out;border-color:rgba(255,50,50,.4)}
        .terminal-field.success{border-color:rgba(0,255,70,.4);box-shadow:0 0 20px rgba(0,255,70,.08)}
        .hidden-input{position:absolute;width:1px;height:1px;opacity:0;top:0;left:0;pointer-events:none}
        .typed-char{display:inline-block;text-transform:uppercase}
        .t-cursor{display:inline-block;width:8px;height:18px;background:rgba(0,255,70,.6);margin-left:1px;vertical-align:middle}
        .t-cursor.off{opacity:0}
        .submit-row{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
        .submit-key{padding:10px 28px;background:transparent;border:1px solid rgba(0,255,70,.15);border-radius:2px;font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:rgba(0,255,70,.4);cursor:pointer;transition:all .25s ease}
        .submit-key:hover{border-color:rgba(0,255,70,.35);color:rgba(0,255,70,.7);background:rgba(0,255,70,.03)}
        .status-text{font-size:11px;letter-spacing:1px}
        .status-text.err{color:rgba(255,50,50,.5)}
        .status-text.ok{color:rgba(0,255,70,.7);font-weight:700;animation:accessGranted .8s ease-out forwards}
        .login-bottom{position:fixed;bottom:0;left:0;right:0;z-index:6;padding:10px 0;text-align:center;border-top:1px solid rgba(0,255,70,.05);font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(0,255,70,.1);background:rgba(10,12,10,.8)}
        .sys-info{position:fixed;top:14px;right:20px;z-index:6;font-size:9px;color:rgba(0,255,70,.12);letter-spacing:1px;text-align:right;line-height:1.8}

        .app{min-height:100vh;background:linear-gradient(160deg,#0a1210,#0d1a14,#0a1610,#081310,#060f0b);font-family:'Nunito',sans-serif;color:#E0F0E4;overflow-x:hidden;position:relative}
        .stage{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;z-index:1;padding:40px 20px}
        .intro-wrap{text-align:center;opacity:0;transform:translateY(25px);transition:all 1.4s cubic-bezier(.16,1,.3,1)}
        .intro-wrap.show{opacity:1;transform:translateY(0)}
        .top-hearts{font-size:13px;letter-spacing:14px;color:rgba(125,184,138,.35);margin-bottom:24px}
        .happy-birthday{font-family:'Great Vibes',cursive;font-size:clamp(44px,10vw,82px);background:linear-gradient(135deg,#7DB88A,#A8D5B0,#D4AF37,#A8D5B0,#7DB88A);background-size:300% 300%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmerGreen 5s ease-in-out infinite;line-height:1.3;margin-bottom:8px;filter:drop-shadow(0 2px 15px rgba(125,184,138,.25))}
        .sub-line{font-family:'Cormorant Garamond',serif;font-size:clamp(16px,3vw,22px);font-weight:300;font-style:italic;color:rgba(168,213,176,.4);letter-spacing:1.5px;margin-bottom:52px}
        .gift-area{position:relative;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none}
        .gift-emoji{font-size:clamp(90px,22vw,150px);display:block;animation:giftPulse 3s ease-in-out infinite;transition:transform .3s}
        .gift-emoji:hover{transform:scale(1.06)}.gift-emoji.shake{animation:giftShake .6s ease-in-out}
        .gift-ring{position:absolute;inset:-18px;border-radius:50%;border:1px solid rgba(125,184,138,.15);animation:breathe 5s ease-in-out infinite;pointer-events:none}
        .gift-ring2{position:absolute;inset:-36px;border-radius:50%;border:1px solid rgba(125,184,138,.07);animation:breathe 7s 1s ease-in-out infinite;pointer-events:none}
        .tap-label{margin-top:28px;font-family:'Cormorant Garamond',serif;font-size:15px;font-style:italic;color:rgba(168,213,176,.3);letter-spacing:1px}
        .tap-hearts{display:flex;gap:12px;justify-content:center;margin-top:18px}
        .tap-heart{font-size:16px;opacity:.2;transition:all .4s cubic-bezier(.34,1.56,.64,1);filter:grayscale(1)}
        .tap-heart.lit{opacity:1;filter:grayscale(0);transform:scale(1.2);animation:heartbeat 1.2s ease-in-out}
        .city-stage{text-align:center}
        .going-to{font-family:'Cormorant Garamond',serif;font-size:clamp(17px,3.5vw,26px);font-weight:300;font-style:italic;color:rgba(168,213,176,.5);letter-spacing:3px;margin-bottom:20px;animation:slideUpSoft .8s ease-out}
        .letters-row{display:flex;justify-content:center;gap:clamp(4px,1.8vw,14px);flex-wrap:wrap;margin-bottom:8px}
        .letter{font-family:'Cormorant Garamond',serif;font-size:clamp(52px,13vw,110px);font-weight:600;background:linear-gradient(180deg,#A8D5B0,#7DB88A,#D4AF37);-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:letterDrop .75s cubic-bezier(.34,1.56,.64,1) forwards;filter:drop-shadow(0 4px 18px rgba(125,184,138,.3));line-height:1}
        .getaway-badge{display:inline-block;margin-top:20px;padding:10px 28px;border:1px solid rgba(125,184,138,.2);border-radius:40px;font-family:'Cormorant Garamond',serif;font-size:14px;font-weight:500;font-style:italic;letter-spacing:2px;color:rgba(168,213,176,.6);animation:slideUpSoft .8s .3s ease-out both,borderPulse 4s ease-in-out infinite}
        .discover-btn{margin-top:44px;padding:16px 44px;background:linear-gradient(135deg,#7DB88A,#5B9E6F);border:none;border-radius:40px;font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;font-style:italic;color:#0a1210;cursor:pointer;letter-spacing:1.5px;transition:all .35s ease;animation:slideUpSoft .8s .6s ease-out both;box-shadow:0 8px 30px rgba(125,184,138,.25)}
        .discover-btn:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 14px 40px rgba(125,184,138,.4)}
        .itin-stage{padding:50px 20px 80px;min-height:100vh;justify-content:flex-start}
        .itin-header{text-align:center;margin-bottom:44px;animation:slideUpSoft .6s ease-out}
        .itin-title{font-family:'Cormorant Garamond',serif;font-size:clamp(28px,6vw,46px);font-weight:600;font-style:italic;animation:softGlow 5s ease-in-out infinite;color:#A8D5B0}
        .itin-sub{font-size:14px;color:rgba(168,213,176,.3);font-weight:300;margin-top:8px;letter-spacing:.5px}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr));gap:18px;max-width:960px;width:100%}
        .card{position:relative;border-radius:20px;overflow:hidden;cursor:pointer;transition:all .5s cubic-bezier(.16,1,.3,1);min-height:175px;-webkit-tap-highlight-color:transparent}
        .card-hidden{background:linear-gradient(145deg,rgba(125,184,138,.06),rgba(125,184,138,.02));border:1px solid rgba(125,184,138,.08);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;backdrop-filter:blur(8px);min-height:175px;border-radius:20px}
        .card-hidden:hover{border-color:rgba(125,184,138,.25);transform:translateY(-4px);box-shadow:0 10px 35px rgba(0,0,0,.25)}
        .card-num{width:46px;height:46px;border-radius:50%;border:1.5px solid rgba(125,184,138,.2);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;color:rgba(125,184,138,.5)}
        .card-num-heart{font-size:11px;color:rgba(125,184,138,.25);margin-top:2px}
        .card-open{padding:22px;border:1px solid rgba(125,184,138,.15);background:linear-gradient(145deg,rgba(125,184,138,.07),rgba(125,184,138,.02));animation:fadeInScale .55s cubic-bezier(.16,1,.3,1),revealGlow 1s ease-out;border-radius:20px;min-height:175px}
        .card-tag{display:inline-block;padding:3px 12px;border-radius:20px;font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;background:rgba(125,184,138,.12);color:#7DB88A}
        .card-emoji{font-size:32px;margin-bottom:10px}
        .card-title{font-family:'Cormorant Garamond',serif;font-size:21px;font-weight:600;margin-bottom:6px;line-height:1.3;color:#B8DBBF}
        .card-time{font-size:12px;font-weight:500;letter-spacing:.8px;margin-bottom:10px;color:rgba(125,184,138,.5)}
        .card-heart-divider{margin:10px 0 8px;font-size:10px;color:rgba(125,184,138,.2);letter-spacing:6px;text-align:center}
        .card-desc{font-size:14px;line-height:1.75;color:rgba(224,240,228,.55);font-weight:300}
        .card-leaf{position:absolute;top:12px;right:14px;font-size:14px;opacity:.15;animation:leafSway 4s ease-in-out infinite}
        .finale{text-align:center;gap:20px}
        .finale-heart{font-size:clamp(50px,14vw,90px);animation:heartbeat 1.5s ease-in-out infinite;filter:drop-shadow(0 8px 30px rgba(125,184,138,.4))}
        .finale-title{font-family:'Great Vibes',cursive;font-size:clamp(34px,7.5vw,62px);background:linear-gradient(135deg,#7DB88A,#A8D5B0,#D4AF37,#A8D5B0,#7DB88A);background-size:300% 300%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmerGreen 4s ease-in-out infinite;line-height:1.3}
        .finale-msg{font-family:'Cormorant Garamond',serif;font-size:clamp(16px,3vw,21px);font-weight:300;font-style:italic;color:rgba(168,213,176,.5);max-width:460px;line-height:1.9}
        .finale-date{display:inline-flex;align-items:center;gap:10px;margin-top:12px;padding:13px 36px;border:1px solid rgba(125,184,138,.2);border-radius:40px;font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:500;font-style:italic;color:#7DB88A;animation:borderPulse 4s ease-in-out infinite;letter-spacing:1px}
        .one-more-btn{margin-top:36px;padding:14px 40px;background:linear-gradient(135deg,#D4AF37,#C49B30);border:none;border-radius:40px;font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:600;font-style:italic;color:#0a1210;cursor:pointer;letter-spacing:1.5px;transition:all .35s ease;box-shadow:0 6px 25px rgba(212,175,55,.25);animation:slideUpSoft .8s 1s ease-out both}
        .one-more-btn:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 10px 35px rgba(212,175,55,.4)}
        .scratch-stage{text-align:center;gap:24px}
        .scratch-wrap{opacity:0;transform:translateY(20px);transition:all 1s cubic-bezier(.16,1,.3,1)}
        .scratch-wrap.show{opacity:1;transform:translateY(0)}
        .scratch-title{font-family:'Cormorant Garamond',serif;font-size:clamp(22px,5vw,34px);font-weight:600;font-style:italic;color:#A8D5B0;margin-bottom:6px;animation:softGlow 5s ease-in-out infinite}
        .scratch-sub{font-size:13px;color:rgba(168,213,176,.3);font-weight:300;letter-spacing:.5px;margin-bottom:28px}
        .scratch-hint{font-family:'Cormorant Garamond',serif;font-size:13px;font-style:italic;color:rgba(168,213,176,.25);margin-top:16px;letter-spacing:.5px}
        .prize-stage{text-align:center;gap:16px}
        .prize-piano{font-size:clamp(70px,18vw,120px);animation:pianoFloat 3s ease-in-out infinite;filter:drop-shadow(0 8px 40px rgba(212,175,55,.35))}
        .prize-title{font-family:'Great Vibes',cursive;font-size:clamp(36px,8vw,64px);background:linear-gradient(135deg,#D4AF37,#F0E6A0,#D4AF37);background-size:300% 300%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmerGreen 3s ease-in-out infinite;filter:drop-shadow(0 2px 10px rgba(212,175,55,.2))}
        .prize-sub{font-family:'Cormorant Garamond',serif;font-size:clamp(16px,3vw,21px);font-weight:300;font-style:italic;color:rgba(168,213,176,.5);max-width:420px;line-height:1.8}
        .prize-badge{display:inline-block;margin-top:8px;padding:10px 28px;border:1px solid rgba(212,175,55,.2);border-radius:40px;font-family:'Cormorant Garamond',serif;font-size:14px;font-weight:500;font-style:italic;letter-spacing:2px;color:rgba(212,175,55,.6);animation:borderPulse 4s ease-in-out infinite}
        .restart{margin-top:28px;padding:10px 28px;background:transparent;border:1px solid rgba(168,213,176,.1);border-radius:40px;color:rgba(168,213,176,.25);font-family:'Cormorant Garamond',serif;font-size:14px;font-style:italic;cursor:pointer;transition:all .3s ease}
        .restart:hover{border-color:rgba(168,213,176,.25);color:rgba(168,213,176,.5)}
        .progress{position:fixed;bottom:0;left:0;height:2px;background:linear-gradient(90deg,#5B9E6F,#A8D5B0,#D4AF37,#A8D5B0,#5B9E6F);background-size:300% 100%;animation:shimmerGreen 3s ease-in-out infinite;transition:width .6s ease;z-index:100;box-shadow:0 0 10px rgba(125,184,138,.4)}
      `}</style>

      {stage === "login" && (
        <div className="login-screen" onClick={() => inputRef.current?.focus()}>
          <div className="vignette" />
          <div className="sys-info">SYS BUILD 4.7.2<br/>NODE 0x7A2F<br/>{new Date().toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" }).toUpperCase()}</div>
          <div className="login-container">
            <div className="class-bar">TOP SECRET // SENSITIVE COMPARTMENTED INFORMATION</div>
            <div className="boot-area">
              {bootLines.map((line, i) => (<div key={i} className="boot-line">&gt; {line}</div>))}
            </div>
            <div className={`auth-panel ${bootDone && loginVisible ? "show" : ""} ${loginSuccess ? "leaving" : ""}`}>
              <div className="divider-line" />
              <div className="auth-label">SECURITY VERIFICATION — LEVEL 5 CLEARANCE</div>
              <div className="question-text">Where did it all begin?</div>
              <div className="question-sub">ANSWER REQUIRED TO PROCEED</div>
              <div className="input-row">
                <span className="prompt-symbol">&gt;_</span>
                <div className={`terminal-field ${loginError ? "error" : ""} ${loginSuccess ? "success" : ""}`} style={{ position:"relative" }}>
                  {loginInput.split("").map((ch, i) => (<span key={i} className="typed-char">{ch}</span>))}
                  <span className={`t-cursor ${cursorVisible ? "" : "off"}`} />
                  <input ref={inputRef} className="hidden-input" type="text" autoFocus value={loginInput}
                    onChange={e => { setLoginInput(e.target.value); setLoginError(false); }}
                    onKeyDown={e => { if (e.key === "Enter") handleLoginSubmit(); }}
                    autoCapitalize="none" autoCorrect="off" spellCheck="false" />
                </div>
              </div>
              <div className="submit-row">
                <button className="submit-key" onClick={handleLoginSubmit}>AUTHENTICATE</button>
                {loginError && <span className="status-text err">ACCESS DENIED — INVALID RESPONSE</span>}
                {loginSuccess && <span className="status-text ok">ACCESS GRANTED</span>}
              </div>
            </div>
          </div>
          <div className="login-bottom">UNAUTHORIZED ACCESS IS PROHIBITED — ALL ACTIVITY IS MONITORED AND RECORDED</div>
        </div>
      )}

      {stage !== "login" && (
        <div className="app">
          <FloatingHearts />
          <HeartConfetti active={showConfetti} count={80} />
          <HeartConfetti active={showFinaleConfetti} count={100} />
          <HeartConfetti active={showPrizeConfetti} count={100} />

          {stage === "intro" && (
            <div className="stage">
              <SoftGlow color="rgba(125,184,138,.08)" x="30%" y="35%" size="500px"/>
              <SoftGlow color="rgba(212,175,55,.04)" x="70%" y="65%" size="400px"/>
              <div className={`intro-wrap ${introVisible?"show":""}`}>
                <div className="top-hearts">🌿 ♥ 🌿</div>
                <div className="happy-birthday">Happy Birthday</div>
                <div className="sub-line">I have a little surprise for you...</div>
                <div className="gift-area" onClick={handleGiftTap}>
                  <div className="gift-ring"/><div className="gift-ring2"/>
                  <span className={`gift-emoji ${giftShake?"shake":""}`}>🎁</span>
                </div>
                <div className="tap-label">tap to unwrap your surprise</div>
                <div className="tap-hearts">
                  {[0,1,2].map(i=>(<span key={i} className={`tap-heart ${tapCount>i?"lit":""}`}>{tapCount>i?"💚":"🤍"}</span>))}
                </div>
              </div>
            </div>
          )}

          {stage === "cityReveal" && (
            <div className="stage city-stage">
              <SoftGlow color="rgba(125,184,138,.1)" x="50%" y="40%" size="600px"/>
              <div className="going-to">We're going to...</div>
              <div className="letters-row">
                {cityLetters.map((l,i)=>(<span key={i} className="letter" style={{animationDelay:`${i*.08}s`}}>{l}</span>))}
              </div>
              {showButton && (
                <div style={{textAlign:"center"}}>
                  <div className="getaway-badge">🌿 a birthday weekend, just us 🌿</div>
                  <br/>
                  <button className="discover-btn" onClick={()=>setStage("itinerary")}>See What I Planned →</button>
                </div>
              )}
            </div>
          )}

          {stage === "itinerary" && (
            <div className="stage itin-stage">
              <div className="itin-header">
                <div className="itin-title">Our Weekend Together</div>
                <div className="itin-sub">tap each moment to reveal — {revealedCards.length} of {itineraryData.length}</div>
              </div>
              <div className="grid">
                {itineraryData.map((item,i)=>(
                  <div key={i} className="card" onClick={()=>revealCard(i)} style={{position:"relative", animation:`cardEntrance .5s ${i*.06}s ease-out both`}}>
                    {!revealedCards.includes(i)?(
                      <div className="card-hidden">
                        <div className="card-num">{i+1}</div>
                        <div className="card-num-heart">🌿 tap to reveal 🌿</div>
                      </div>
                    ):(
                      <div className="card-open">
                        <div className="card-leaf">🍃</div>
                        <div className="card-tag">{item.tag}</div>
                        <div className="card-emoji">{item.emoji}</div>
                        <div className="card-title">{item.title}</div>
                        <div className="card-time">{item.time}</div>
                        <div className="card-heart-divider">♥ 🌿 ♥</div>
                        <div className="card-desc">{item.description}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="progress" style={{width:`${(revealedCards.length/itineraryData.length)*100}%`}}/>
            </div>
          )}

          {stage === "finale" && (
            <div className="stage finale">
              <SoftGlow color="rgba(125,184,138,.1)" x="50%" y="45%" size="600px"/>
              <div className="finale-heart">💚</div>
              <div className="finale-title">This Is Going to Be<br/>Our Best Weekend Yet</div>
              <div className="finale-msg">Art that moves us, food that amazes, secret bars and city lights — all of it with you. I can't wait.</div>
              <div className="finale-date"><span>🌿</span> March 2026 <span>🌿</span></div>
              <button className="one-more-btn" onClick={()=>setStage("scratch")}>Oh wait... one more thing</button>
            </div>
          )}

          {stage === "scratch" && (
            <div className="stage scratch-stage">
              <SoftGlow color="rgba(212,175,55,.08)" x="50%" y="45%" size="500px"/>
              <div className={`scratch-wrap ${scratchVisible?"show":""}`}>
                <div className="scratch-title">One More Surprise...</div>
                <div className="scratch-sub">because you deserve it all</div>
                <ScratchCard onComplete={handleScratchComplete} />
                <div className="scratch-hint">use your finger or mouse to scratch</div>
              </div>
            </div>
          )}

          {stage === "prizeRevealed" && (
            <div className="stage prize-stage">
              <SoftGlow color="rgba(212,175,55,.12)" x="50%" y="40%" size="600px"/>
              <div className="prize-piano">🎹</div>
              <div className="prize-title">A Piano!</div>
              <div className="prize-sub">Every beautiful thing deserves a beautiful soundtrack. This one's yours to play, to learn, to fill our home with music.</div>
              <div className="prize-badge">🌿 happy birthday, my love 🌿</div>
              <button className="restart" onClick={restart}>relive the surprise</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
