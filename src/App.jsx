import { useState, useEffect, useRef, useCallback } from "react";
import { db, ref, set, onValue } from "./firebase";

// ============================================================
// STORAGE LAYER — Firebase Realtime Database for cross-device sync
// ============================================================
const storage = {
  save: (data) => set(ref(db, "tripPlanner/assignments"), data),
  listen: (callback) => {
    return onValue(ref(db, "tripPlanner/assignments"), (snap) => callback(snap.val() || {}));
  },
};

// ============================================================
// DATA
// ============================================================
const ALL_EVENTS = [
  { id: "cleos", emoji: "🍗", title: "Cleo's Southern Cuisine", time: "~1 hr", tag: "Soul Food", info: "Famous fried catfish and chicken wings in Lakeview. The honey butter muffins are a must. Casual counter-service spot — small but packed with flavor.", lat: 41.9331, lng: -87.6597, phone: "(773) 799-8509", address: "2826 N Lincoln Ave" },
  { id: "alice", emoji: "🧢", title: "Alice & Wonder", time: "~45 min", tag: "Shopping", info: "Pick out a hat and customize it with patches — a fun, trendy Chicago souvenir. Great for couples. Two locations: State St and Webster Ave.", lat: 41.8928, lng: -87.6279, phone: "(872) 329-0423", address: "611 N State St" },
  { id: "giordanos", emoji: "🍕", title: "Giordano's", time: "~1.5 hrs", tag: "Deep Dish", info: "Legendary Chicago deep dish pizza. Thick, cheesy, and worth the 45-minute bake time. Multiple locations downtown — the one near Millennium Park is solid.", lat: 41.8851, lng: -87.6238, phone: "(312) 616-1200", address: "130 E Randolph St" },
  { id: "casa", emoji: "🌮", title: "Casa Tequila", time: "~1.5 hrs", tag: "Mexican", info: "Vibrant Mexican restaurant on Division St. Known for their steaks and margaritas. The birria tacos and ribeye are popular picks. Lively atmosphere.", lat: 41.9031, lng: -87.6767, phone: "(773) 360-1896", address: "1949 W Division St" },
  { id: "soul", emoji: "🎵", title: "Soul Vibez", time: "~1.5 hrs", tag: "Soul Food", info: "Soul food with a modern twist in River North. The lamb chops and jerk chicken egg rolls are standouts. Great vibe, great cocktails, vegan options too.", lat: 41.8968, lng: -87.6353, phone: "(872) 342-2026", address: "226 W Chicago Ave" },
  { id: "kitchen", emoji: "🍳", title: "The Kitchen", time: "~1.5 hrs", tag: "Bistro", info: "American bistro right on the Chicago River. Amazing brunch with banana waffles and great cocktails. Beautiful patio views of the riverwalk.", lat: 41.8879, lng: -87.6313, phone: "(312) 836-1300", address: "316 N Clark St" },
  { id: "stk", emoji: "🥩", title: "STK Chicago", time: "~2 hrs", tag: "Steakhouse", info: "Upscale steakhouse with a lounge vibe on Kinzie St. DJ, cocktails, and perfectly cooked steaks. The lobster mac and Brussels sprouts are a must. Great for a special night out.", lat: 41.8890, lng: -87.6286, phone: "(312) 340-5636", address: "9 W Kinzie St" },
  { id: "wendella", emoji: "🚢", title: "Wendella Boat Tour", time: "~1.5 hrs", tag: "Tour", info: "The iconic Chicago architecture boat tour on the river. 90 minutes of stunning skyline views and fascinating history. Book the evening tour for city lights.", lat: 41.8892, lng: -87.6245, phone: "(312) 337-1446", address: "400 N Michigan Ave" },
  { id: "navy", emoji: "🎡", title: "Navy Pier", time: "~2 hrs", tag: "Attraction", info: "Chicago's most famous landmark. Ride the Centennial Wheel, walk along Lake Michigan, grab food, and catch the fireworks on summer weekends.", lat: 41.8919, lng: -87.6051, phone: "(312) 595-7437", address: "600 E Grand Ave" },
  { id: "skydeck", emoji: "🏙️", title: "Skydeck Chicago", time: "~1 hr", tag: "Views", info: "103 floors up Willis Tower. Step out onto The Ledge — a glass box 1,353 feet above the street. Stunning 360° views of the city. Go at sunset for the best experience.", lat: 41.8789, lng: -87.6359, phone: "(312) 875-9447", address: "233 S Wacker Dr" },
  { id: "wakenbake", emoji: "☕", title: "Wake N Bakery", time: "~30 min", tag: "Coffee", info: "Chill coffee shop with infused lattes, edibles, and baked goods. Cozy graffiti-art interior and super friendly staff. Perfect morning stop or afternoon pick-me-up.", lat: 41.8935, lng: -87.6266, phone: "(312) 405-3608", address: "38 E Ontario St" },
  { id: "bean", emoji: "☁️", title: "Cloud Gate (The Bean)", time: "~30 min", tag: "Sightseeing", info: "Chicago's most iconic photo op in Millennium Park. Walk underneath the giant mirrored sculpture for stunning skyline reflections. Open daily.", lat: 41.8827, lng: -87.6233, address: "201 E Randolph St" },
  { id: "riverwalk", emoji: "🌊", title: "Chicago Riverwalk", time: "~1 hr", tag: "Walk", info: "Beautiful waterfront path along the river with cafés, bars, and boat launches. Perfect for a romantic stroll. Completely different vibe at night with city lights.", lat: 41.8885, lng: -87.6232, address: "Along the Chicago River" },
  { id: "artinst", emoji: "🎨", title: "Art Institute of Chicago", time: "~2.5 hrs", tag: "Museum", info: "World-class art museum with Monet, Van Gogh, and the famous American Gothic. One of the best museums in the country. Right next to Millennium Park.", lat: 41.8796, lng: -87.6224, phone: "(312) 443-3600", address: "111 S Michigan Ave" },
  { id: "360chi", emoji: "🌆", title: "360 CHICAGO", time: "~1 hr", tag: "Views", info: "94th floor of the Hancock Building. TILT lets you lean out over Michigan Ave. Stunning lake and skyline views, plus a cocktail bar at the top.", lat: 41.8990, lng: -87.6232, phone: "(888) 875-8439", address: "875 N Michigan Ave" },
  { id: "illusions", emoji: "🪞", title: "Museum of Illusions", time: "~1 hr", tag: "Fun", info: "Interactive optical illusions, infinity mirrors, and the giant/tiny room. Great couple photos and TikTok content. Fun, trippy, and about an hour.", lat: 41.8830, lng: -87.6268, phone: "(720) 769-6505", address: "25 E Washington St" },
  { id: "drifter", emoji: "🎭", title: "The Drifter", time: "~1.5 hrs", tag: "Speakeasy", info: "Hidden speakeasy below The Green Door Tavern. Craft cocktails, dimly lit freak-show cabaret vibes, and surprise live performances. Get on the waitlist early.", lat: 41.8946, lng: -87.6374, phone: "(312) 631-3887", address: "676 N Orleans St" },
  { id: "iotheater", emoji: "😂", title: "The iO Theater", time: "~2 hrs", tag: "Comedy", info: "Legendary improv comedy theater. Free shows on Wednesdays. The Improvised Shakespeare show is a must — hilarious and wildly creative. Great bar and cheap drinks.", lat: 41.9085, lng: -87.6518, phone: "(312) 300-3350", address: "1501 N Kingsbury St" },
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
// TAP REVEAL — three taps to unwrap the prize
// ============================================================
function TapReveal({ onComplete }) {
  const [taps, setTaps] = useState(0);
  const [shaking, setShaking] = useState(false);

  const handleTap = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
    setTaps(prev => {
      const next = prev + 1;
      if (next >= 3) {
        setTimeout(() => onComplete?.(), 500);
      }
      return next;
    });
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
      <div
        onClick={handleTap}
        style={{
          width:180, height:180, borderRadius:24,
          background:"linear-gradient(145deg, rgba(125,184,138,.08), rgba(125,184,138,.03))",
          border:"1px solid rgba(125,184,138,.15)",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          cursor:"pointer", userSelect:"none", WebkitUserSelect:"none",
          transition:"all .3s",
          animation: shaking ? "giftShake .6s ease-in-out" : "giftFloat 3s ease-in-out infinite",
          boxShadow: taps >= 2 ? "0 0 40px rgba(212,175,55,.2)" : taps >= 1 ? "0 0 25px rgba(125,184,138,.15)" : "0 8px 30px rgba(0,0,0,.3)",
        }}
      >
        <span style={{ fontSize:64, filter:"drop-shadow(0 4px 15px rgba(125,184,138,.3))", transition:"transform .3s", transform: taps >= 2 ? "scale(1.15)" : taps >= 1 ? "scale(1.08)" : "scale(1)" }}>🎁</span>
      </div>

      {/* Tap progress hearts */}
      <div style={{ display:"flex", gap:14, alignItems:"center" }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:12, height:12, borderRadius:"50%",
            background: taps > i ? "#7DB88A" : "transparent",
            border: taps > i ? "2px solid #7DB88A" : "2px solid rgba(125,184,138,.2)",
            boxShadow: taps > i ? "0 0 10px rgba(125,184,138,.4)" : "none",
            transition:"all .3s cubic-bezier(.34,1.56,.64,1)",
            transform: taps > i ? "scale(1.2)" : "scale(1)",
          }} />
        ))}
      </div>

      <div style={{ fontSize:14, color:"rgba(168,213,176,.3)", textAlign:"center" }}>
        {taps === 0 ? "Tap the gift to reveal" : taps === 1 ? "Keep going..." : "One more tap..."}
      </div>
    </div>
  );
}

// ============================================================
// EVENT CARD
// ============================================================
function Card({ ev, dragStart, dragging, selected, onSelect }) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div style={{ borderRadius:12, overflow:"hidden", transition:"all .2s" }}>
      <div draggable
        onDragStart={e => { e.dataTransfer.setData("text/plain",ev.id); e.dataTransfer.effectAllowed="move"; dragStart(ev.id); }}
        onDragEnd={() => dragStart(null)}
        onClick={() => onSelect(ev.id)}
        style={{
          padding:"14px 16px", display:"flex", alignItems:"center", gap:12,
          cursor:"grab", userSelect:"none", WebkitUserSelect:"none",
          background: selected?"rgba(125,184,138,.15)":dragging?"rgba(125,184,138,.12)":"rgba(255,255,255,.03)",
          border: selected?"1.5px solid rgba(125,184,138,.5)":dragging?"1px solid rgba(125,184,138,.3)":"1px solid rgba(255,255,255,.06)",
          borderRadius: showInfo?"12px 12px 0 0":"12px",
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
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          {selected && <span style={{ fontSize:12, color:"rgba(125,184,138,.6)", fontWeight:600 }}>TAP A DAY</span>}
          <button
            onClick={e => { e.stopPropagation(); setShowInfo(p => !p); }}
            style={{
              width:28, height:28, borderRadius:"50%", border:"none", cursor:"pointer",
              background: showInfo?"rgba(125,184,138,.15)":"rgba(255,255,255,.05)",
              color: showInfo?"rgba(125,184,138,.7)":"rgba(168,213,176,.3)",
              fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all .2s", flexShrink:0,
            }}
          >i</button>
        </div>
      </div>
      {showInfo && (
        <div style={{
          padding:"12px 16px 14px", fontSize:13, lineHeight:1.7,
          color:"rgba(168,213,176,.5)", fontStyle:"italic",
          background:"rgba(125,184,138,.04)",
          borderLeft: selected?"1.5px solid rgba(125,184,138,.5)":"1px solid rgba(255,255,255,.06)",
          borderRight: selected?"1.5px solid rgba(125,184,138,.5)":"1px solid rgba(255,255,255,.06)",
          borderBottom: selected?"1.5px solid rgba(125,184,138,.5)":"1px solid rgba(255,255,255,.06)",
          borderRadius:"0 0 12px 12px",
          animation:"fadeIn .3s ease-out",
        }}>
          {ev.info}
        </div>
      )}
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
// VIEWER CARD — read-only with info toggle
// ============================================================
function ViewerCard({ ev }) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div style={{ borderRadius:12, overflow:"hidden" }}>
      <div style={{ padding:"14px 16px", background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)", borderRadius: showInfo?"12px 12px 0 0":"12px", display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:24 }}>{ev.emoji}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:600, color:"rgba(224,240,228,.95)" }}>{ev.title}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:5 }}>
            <span style={{ fontSize:13, color:"rgba(168,213,176,.55)" }}>{ev.time}</span>
            <span style={{ fontSize:11, padding:"2px 10px", borderRadius:10, background:"rgba(125,184,138,.1)", color:"rgba(125,184,138,.6)", fontWeight:600 }}>{ev.tag}</span>
          </div>
        </div>
        <button onClick={() => setShowInfo(p => !p)}
          style={{ width:28, height:28, borderRadius:"50%", border:"none", cursor:"pointer",
            background: showInfo?"rgba(125,184,138,.15)":"rgba(255,255,255,.05)",
            color: showInfo?"rgba(125,184,138,.7)":"rgba(168,213,176,.3)",
            fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all .2s", flexShrink:0,
          }}>i</button>
      </div>
      {showInfo && (
        <div style={{ padding:"12px 16px 14px", fontSize:13, lineHeight:1.7, color:"rgba(168,213,176,.5)", fontStyle:"italic",
          background:"rgba(125,184,138,.04)", border:"1px solid rgba(255,255,255,.06)", borderTop:"none", borderRadius:"0 0 12px 12px", animation:"fadeIn .3s ease-out",
        }}>{ev.info}</div>
      )}
    </div>
  );
}

// ============================================================
// MAP — Leaflet with OpenStreetMap (free, no API key)
// ============================================================
function TripMap({ events, assignments }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;
    try {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css"; link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      const loadMap = () => {
        if (!window.L) {
          const s = document.createElement("script");
          s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          s.onload = () => initMap();
          s.onerror = () => setMapError(true);
          document.head.appendChild(s);
        } else initMap();
      };
      const initMap = () => {
        try {
          const L = window.L;
          const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([41.889, -87.634], 13);
          L.control.zoom({ position: "bottomright" }).addTo(map);
          L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
          mapInstance.current = map;
          setMapReady(true);

          // Track current location
          if (navigator.geolocation) {
            let locMarker = null;
            const updateLoc = (pos) => {
              const { latitude: lat, longitude: lng } = pos.coords;
              if (locMarker) map.removeLayer(locMarker);
              locMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                  className: "",
                  html: `<div style="position:relative;width:16px;height:16px"><div style="position:absolute;inset:0;border-radius:50%;background:rgba(100,160,255,.3);animation:locPulse 2s ease-in-out infinite"></div><div style="position:absolute;top:4px;left:4px;width:8px;height:8px;border-radius:50%;background:#64A0FF;border:2px solid rgba(255,255,255,.8);box-shadow:0 0 8px rgba(100,160,255,.5)"></div></div>`,
                  iconSize: [16, 16], iconAnchor: [8, 8],
                }),
                zIndexOffset: 1000,
              }).addTo(map).bindPopup(
                `<div style="font-family:'Nunito',sans-serif;font-size:13px;color:#c8e6cf;font-weight:600">You are here</div>`,
                { className: "dark-popup", closeButton: false }
              );
            };
            navigator.geolocation.getCurrentPosition(updateLoc, () => {}, { enableHighAccuracy: true });
            navigator.geolocation.watchPosition(updateLoc, () => {}, { enableHighAccuracy: true, maximumAge: 10000 });
          }
        } catch (e) { setMapError(true); }
      };
      loadMap();
    } catch (e) { setMapError(true); }
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstance.current || !window.L) return;
    try {
      const L = window.L;
      const map = mapInstance.current;
      map.eachLayer(layer => { if (layer instanceof L.Marker) map.removeLayer(layer); });
      const dayColors = { friday: "#D4AF37", saturday: "#7DB88A", sunday: "#5DCAA5" };
      events.forEach(ev => {
        if (!ev.lat || !ev.lng) return;
        const day = assignments[ev.id];
        const color = day ? dayColors[day] : "rgba(125,184,138,.25)";
        const placed = !!day;
        const sz = placed ? 28 : 22;
        const icon = L.divIcon({
          className: "",
          html: `<div style="display:flex;align-items:center;justify-content:center;width:${sz}px;height:${sz}px;border-radius:50%;background:rgba(10,18,14,.85);border:1.5px solid ${color};font-size:${placed?13:11}px;opacity:${placed?1:.45};transition:all .3s">${ev.emoji}</div>`,
          iconSize: [sz, sz], iconAnchor: [sz/2, sz/2],
        });
        const apple = `https://maps.apple.com/?daddr=${ev.lat},${ev.lng}&dirflg=d`;
        const google = `https://www.google.com/maps/dir/?api=1&destination=${ev.lat},${ev.lng}`;
        const popup =
          `<div style="font-family:'Nunito',sans-serif;font-size:12px;line-height:1.6;min-width:180px;max-width:240px">` +
          `<div style="font-size:14px;font-weight:700;color:#c8e6cf;margin-bottom:4px">${ev.title}</div>` +
          `<div style="color:rgba(168,213,176,.45);margin-bottom:6px">${ev.tag} · ${ev.time}</div>` +
          (ev.address ? `<div style="color:rgba(168,213,176,.35);font-size:11px;margin-bottom:2px">${ev.address}</div>` : ``) +
          (ev.phone ? `<a href="tel:${ev.phone.replace(/[^0-9+]/g,"")}" style="color:#7DB88A;font-size:11px;text-decoration:none;display:block;margin-bottom:6px">${ev.phone}</a>` : ``) +
          `<div style="display:flex;gap:6px;margin-top:8px">` +
          `<a href="${apple}" target="_blank" style="flex:1;text-align:center;padding:7px 0;background:rgba(125,184,138,.06);border:1px solid rgba(125,184,138,.12);border-radius:8px;color:#A8D5B0;font-size:11px;text-decoration:none;font-weight:600">Apple Maps</a>` +
          `<a href="${google}" target="_blank" style="flex:1;text-align:center;padding:7px 0;background:rgba(125,184,138,.06);border:1px solid rgba(125,184,138,.12);border-radius:8px;color:#A8D5B0;font-size:11px;text-decoration:none;font-weight:600">Google Maps</a>` +
          `</div></div>`;
        L.marker([ev.lat, ev.lng], { icon }).addTo(map).bindPopup(popup, { className: "dark-popup", closeButton: false, maxWidth: 260 });
      });
    } catch (e) {}
  }, [mapReady, events, assignments]);

  if (mapError) return null;

  return (
    <div style={{ borderRadius:16, overflow:"hidden", border:"1px solid rgba(125,184,138,.08)" }}>
      <style>{`.dark-popup .leaflet-popup-content-wrapper{background:rgba(12,20,16,.95);color:#c8e6cf;border:1px solid rgba(125,184,138,.1);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.5);padding:2px}.dark-popup .leaflet-popup-tip{background:rgba(12,20,16,.95);border:1px solid rgba(125,184,138,.1)}.dark-popup .leaflet-popup-content{margin:12px 14px}`}</style>
      <div ref={mapRef} style={{ height:280, width:"100%", background:"#0d1a14" }} />
      <div style={{ display:"flex", gap:14, justifyContent:"center", padding:"8px 16px", background:"rgba(10,18,14,.6)", fontSize:10, color:"rgba(168,213,176,.3)", letterSpacing:.5 }}>
        <span><span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:"#D4AF37", marginRight:5, opacity:.9 }}/>Fri</span>
        <span><span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:"#7DB88A", marginRight:5, opacity:.9 }}/>Sat</span>
        <span><span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:"#5DCAA5", marginRight:5, opacity:.9 }}/>Sun</span>
        <span><span style={{ display:"inline-block", width:5, height:5, borderRadius:"50%", border:"1px solid rgba(168,213,176,.3)", marginRight:5 }}/>Unplaced</span>
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
@keyframes giftFloat{0%,100%{transform:scale(1) translateY(0)}50%{transform:scale(1.03) translateY(-6px)}}
@keyframes giftShake{0%,100%{transform:rotate(0) scale(1)}12%{transform:rotate(-10deg) scale(1.06)}24%{transform:rotate(10deg) scale(1.1)}36%{transform:rotate(-7deg) scale(1.06)}48%{transform:rotate(7deg) scale(1.03)}60%{transform:rotate(-3deg) scale(1.01)}}
@keyframes accessGranted{0%{opacity:0;transform:scale(.8)}50%{opacity:1;transform:scale(1.05);text-shadow:0 0 40px rgba(0,255,100,.6)}100%{opacity:1;transform:scale(1);text-shadow:0 0 20px rgba(0,255,100,.4)}}
@keyframes fadeOutUp{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-30px)}}
@keyframes locPulse{0%,100%{transform:scale(1);opacity:.3}50%{transform:scale(2.2);opacity:0}}
`;

const BG = "linear-gradient(160deg,#0a1210,#0d1a14,#0a1610,#081310,#060f0b)";

const SESSION_DURATION = 5 * 60 * 1000; // 5 minutes

function checkSession() {
  try {
    const ts = localStorage.getItem("op320-session");
    if (ts && Date.now() - parseInt(ts) < SESSION_DURATION) return true;
  } catch (e) {}
  return false;
}

function saveSession() {
  try { localStorage.setItem("op320-session", Date.now().toString()); } catch (e) {}
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function TripPlanner() {
  const [route, setRoute] = useState(window.location.hash);
  const [stage, setStage] = useState(checkSession() ? "planner" : "login");
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
    try { await storage.save(d); setSaved(new Date()); saveSession(); } catch(e) {}
  }, []);

  const login = () => {
    if (inp.trim().toLowerCase() === "bus") {
      setOk(true); setErr(false); saveSession();
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
          <TripMap events={ALL_EVENTS} assignments={asgn} />
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
                      <ViewerCard key={ev.id} ev={ev} />
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
                    <ViewerCard key={ev.id} ev={ev} />
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
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(28px,6vw,42px)", fontWeight:600, fontStyle:"italic", color:"#A8D5B0", animation:"softGlow 5s ease-in-out infinite", marginBottom:6 }}>Plan The Weekend</h1>
          <p style={{ fontSize:17, color:"rgba(168,213,176,.5)", marginBottom:20 }}>Tap each activity, then tap a day to place it</p>
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
          <TripMap events={ALL_EVENTS} assignments={asgn} />
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
            </>
          )}
          {locked && <div style={{ fontSize:15, fontWeight:500, color:"rgba(168,213,176,.5)", animation:"fadeIn .6s", padding:"10px 24px", border:"1px solid rgba(125,184,138,.1)", borderRadius:40 }}>🌿 locked in — no take-backs 🌿</div>}
          <button onClick={reset} style={{ padding:"8px 24px", background:"transparent", border:"1px solid rgba(168,213,176,.08)", borderRadius:40, color:"rgba(168,213,176,.3)", fontSize:14, cursor:"pointer", transition:"all .3s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(168,213,176,.2)";e.currentTarget.style.color="rgba(168,213,176,.5)"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(168,213,176,.08)";e.currentTarget.style.color="rgba(168,213,176,.3)"}}>reset all</button>
        </div>

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
                <div style={{ fontSize:16, color:"rgba(200,220,205,.6)", lineHeight:1.7, marginBottom:10 }}>Now, you're confirming this, you need to stand 10 toes<br/>Let's enjoy chapter 32.</div>
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

        {/* TAP REVEAL */}
        {showScratch && !prizeReveal && (
          <div style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(8,14,12,.95)", backdropFilter:"blur(10px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20, padding:20, animation:"fadeIn .6s" }}>
            <div style={{ opacity:scratchVis?1:0, transform:scratchVis?"translateY(0)":"translateY(20px)", transition:"all 1s cubic-bezier(.16,1,.3,1)", display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(22px,5vw,34px)", fontWeight:600, fontStyle:"italic", color:"#A8D5B0", textAlign:"center", animation:"softGlow 5s ease-in-out infinite" }}>One more thing...</div>
              <div style={{ fontSize:15, color:"rgba(168,213,176,.35)", textAlign:"center" }}>because you deserve it all</div>
              <TapReveal onComplete={scratchDone} />
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
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(15px,3vw,19px)", fontWeight:300, fontStyle:"italic", color:"rgba(168,213,176,.5)", lineHeight:1.8, textAlign:"center" }}></div>
              <div style={{ padding:"8px 24px", border:"1px solid rgba(125,184,138,.12)", borderRadius:40, fontFamily:"'Cormorant Garamond',serif", fontSize:14, fontWeight:500, fontStyle:"italic", letterSpacing:2, color:"rgba(168,213,176,.45)" }}>🌿 always on the line for you 🌿</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}