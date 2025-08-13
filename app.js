// NOTE(eng): Gen2 pack with an added 'common' rarity and tuned probabilities.
// Image loader has robust fallbacks to avoid "file not found" issues.

const LS_VERSION = "v3";
const totalKey = `cardkkang:${LS_VERSION}:total`;

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `cardkkang:${LS_VERSION}:day:${y}-${m}-${day}`;
}

// --- Gen2 Pokémon (subset) ---------------------------------------------------
const P = [
  { id: 249, name: "Lugia", tier: "legend" },
  { id: 250, name: "Ho-Oh", tier: "legend" },
  { id: 243, name: "Raikou", tier: "legend" },
  { id: 244, name: "Entei", tier: "legend" },
  { id: 245, name: "Suicune", tier: "legend" },
  { id: 251, name: "Celebi", tier: "legend" },

  { id: 248, name: "Tyranitar", tier: "ace" },
  { id: 197, name: "Umbreon", tier: "ace" },
  { id: 196, name: "Espeon", tier: "ace" },
  { id: 212, name: "Scizor", tier: "ace" },
  { id: 208, name: "Steelix", tier: "ace" },
  { id: 229, name: "Houndoom", tier: "ace" },
  { id: 230, name: "Kingdra", tier: "ace" },
  { id: 233, name: "Porygon2", tier: "ace" },
  { id: 242, name: "Blissey", tier: "ace" },
  { id: 227, name: "Skarmory", tier: "ace" },

  { id: 155, name: "Cyndaquil", tier: "regular" },
  { id: 157, name: "Typhlosion", tier: "regular" },
  { id: 152, name: "Chikorita", tier: "regular" },
  { id: 154, name: "Meganium", tier: "regular" },
  { id: 158, name: "Totodile", tier: "regular" },
  { id: 160, name: "Feraligatr", tier: "regular" },
  { id: 172, name: "Pichu", tier: "regular" },
  { id: 179, name: "Mareep", tier: "regular" },
  { id: 181, name: "Ampharos", tier: "regular" },
];

// --- Sprite URL + robust fallback chain -------------------------------------
function spriteURLPrimary(id) {
  // High-quality official artwork
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}
function spriteURLFallback1(id) {
  // Default front sprite
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}
function spriteURLFallback2(id) {
  // Gen2 crystal sprite
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/crystal/${id}.png`;
}
function attachImgWithFallback(img, id, alt) {
  img.src = spriteURLPrimary(id);
  img.alt = alt;
  img.onerror = () => {
    img.onerror = () => {
      img.onerror = null;
      img.src = spriteURLFallback2(id);
    };
    img.src = spriteURLFallback1(id);
  };
}

const RARITIES = [
  { key: "common", name: "common",   pct: 87.738, cls: "rar-c", score: 0 },
  { key: "one",    name: "one star", pct: 10.0,          cls: "rar-1", score: 1 },
  { key: "two",    name: "two star", pct: 2.0,           cls: "rar-2", score: 3 },
  { key: "emul",   name: "immersive", pct: 0.222,         cls: "rar-e", score: 7 },
  { key: "gold",   name: "gold card", pct: 0.040,         cls: "rar-g", score: 12 },
];

// Pools per rarity (importance → rarity)
const POOLS = {
  gold: [
    { id: 249, w: 45 }, // Lugia
    { id: 250, w: 45 }, // Ho-Oh
    { id: 243, w: 3 }, { id: 244, w: 3 }, { id: 245, w: 3 }, { id: 251, w: 1 },
  ],
  emul: [
    { id: 243, w: 6 }, { id: 244, w: 6 }, { id: 245, w: 6 }, { id: 251, w: 6 },
    { id: 248, w: 12 }, { id: 197, w: 12 }, { id: 196, w: 12 }, { id: 212, w: 11 },
    { id: 208, w: 10 }, { id: 229, w: 10 }, { id: 230, w: 10 }, { id: 233, w: 9 }, { id: 242, w: 9 }, { id: 227, w: 9 },
  ],
  two: [
    { id: 157, w: 10 }, { id: 154, w: 10 }, { id: 160, w: 10 },
    { id: 181, w: 8 }, { id: 172, w: 8 },
    { id: 197, w: 3 }, { id: 196, w: 3 }, { id: 212, w: 3 },
  ],
  one: [
    { id: 155, w: 14 }, { id: 152, w: 14 }, { id: 158, w: 14 },
    { id: 179, w: 12 }, { id: 172, w: 10 },
  ],
  common: [
    { id: 155, w: 18 }, { id: 152, w: 18 }, { id: 158, w: 18 },
    { id: 179, w: 16 },
  ],
};

// Helper: categorical pick using explicit percentages
function pickRarity() {
  const r = Math.random() * 100;
  let acc = 0;
  for (const x of RARITIES) {
    acc += x.pct;
    if (r < acc) return x;
  }
  return RARITIES[0]; // fallback
}

// Weighted pick within a pool
function wPick(list) {
  const total = list.reduce((s, x) => s + x.w, 0);
  let p = Math.random() * total;
  for (const x of list) {
    if ((p -= x.w) < 0) return x;
  }
  return list[list.length - 1];
}
function pickFromPool(key) {
  const pool = POOLS[key];
  const { id } = wPick(pool);
  const meta = P.find(x => x.id === id) || { id, name: `#${id}`, tier: "regular" };
  return meta;
}

// State + counters
function readInt(k, d=0){ try { return parseInt(localStorage.getItem(k) || String(d), 10); } catch { return d; } }
function writeInt(k, v){ try { localStorage.setItem(k, String(v)); } catch {} }

function updateCounts(add=0) {
  const tk = todayKey();
  const today = readInt(tk, 0) + add;
  const total = readInt(totalKey, 0) + add;
  writeInt(tk, today); writeInt(totalKey, total);
  document.getElementById("todayCount").textContent = today.toLocaleString();
  document.getElementById("totalCount").textContent = total.toLocaleString();
  const prog = (total % 100);
  document.getElementById("progressBar").style.width = `${Math.min(100, prog)}%`;
  document.getElementById("toNext").textContent = ((100 - prog) % 100) || 100;
}

function luckScore(pack) {
  // Higher tiers contribute more
  return Math.min(100, pack.reduce((s, c) => s + c.rarity.score, 0) * 5);
}

function setLuckBar(v){ document.getElementById("luckBar").style.width = `${Math.max(0, Math.min(100, v))}%`; }

function pickPack(n=10){
  // Guarantee at least 'two star' or better in each pack
  const out = [];
  let hasTwoPlus = false;
  for(let i=0;i<n;i++){
    const rar = pickRarity();
    if (rar.key !== "common" && rar.key !== "one") hasTwoPlus = true;
    const meta = pickFromPool(rar.key);
    out.push({ meta, rarity: rar });
  }
  if (!hasTwoPlus && out.length){
    // upgrade last to 'two star'
    const rarTwo = RARITIES.find(r => r.key === "two");
    out[out.length-1].rarity = rarTwo;
    out[out.length-1].meta = pickFromPool("two");
  }
  return out;
}

// Render
function renderPack(pack){
  const grid = document.getElementById("packGrid");
  const hint = document.getElementById("emptyHint");
  grid.innerHTML = "";
  if(!pack.length){ hint.style.display=""; return; }
  hint.style.display="none";

  pack.forEach((c, idx) => {
    const wrap = document.createElement("div");
    wrap.className = `relative rounded-xl p-3 border bg-white dark:bg-zinc-900 animate-fadein ${c.rarity.cls}`;
    wrap.style.animationDelay = `${idx*50}ms`;

    const badge = document.createElement("div");
    badge.className = "absolute -top-2 -right-2 text-[10px] px-2 py-1 rounded-full border backdrop-blur bg-white/60 dark:bg-zinc-800/60";
    badge.textContent = c.rarity.name;

    const tile = document.createElement("div");
    tile.className = "aspect-[3/4] w-full rounded-lg overflow-hidden bg-gradient-to-br from-white/40 to-zinc-100/60 dark:from-zinc-800/60 dark:to-zinc-900/60 flex items-center justify-center";

    const img = document.createElement("img");
    img.loading = "lazy";
    img.className = "w-full h-full object-contain p-4";
    attachImgWithFallback(img, c.meta.id, c.meta.name);
    tile.appendChild(img);

    const label = document.createElement("div");
    label.className = "mt-2 text-xs text-zinc-600 dark:text-zinc-400";
    label.textContent = c.meta.name;

    wrap.appendChild(badge);
    wrap.appendChild(tile);
    wrap.appendChild(label);
    grid.appendChild(wrap);
  });
}

function spinReels(){
  const reels = [document.getElementById("reel1"), document.getElementById("reel2"), document.getElementById("reel3")];
  let step=0, max=16+Math.floor(Math.random()*10);
  const seq = ["C","★","★★","E","G"];
  const id = setInterval(()=>{
    step++;
    reels.forEach(el=>{
      el.textContent = seq[Math.floor(Math.random()*seq.length)];
      el.parentElement.classList.add("spin");
      setTimeout(()=>el.parentElement.classList.remove("spin"), 150);
    });
    if(step>=max) clearInterval(id);
  }, 90);
}

function resetToday(){ writeInt(todayKey(),0); updateCounts(0); }

function attachThemeToggle(){
  const btn = document.getElementById("themeToggle");
  const root = document.documentElement;
  const saved = localStorage.getItem("cardkkang:theme") || "light";
  if (saved === "dark") root.classList.add("dark");
  btn.addEventListener("click", ()=>{
    root.classList.toggle("dark");
    localStorage.setItem("cardkkang:theme", root.classList.contains("dark") ? "dark":"light");
  });
}

function main(){
  attachThemeToggle();
  updateCounts(0);
  setLuckBar(0);

  document.getElementById("spinBtn").addEventListener("click", spinReels);
  document.getElementById("openBtn").addEventListener("click", () => {
    const pack = pickPack(10);
    renderPack(pack);
    setLuckBar(luckScore(pack));
    updateCounts(10);
  });
  document.getElementById("resetBtn").addEventListener("click", resetToday);
}

document.addEventListener("DOMContentLoaded", main);
