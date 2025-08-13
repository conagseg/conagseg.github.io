// --- Simple, dependency-free logic -------------------------------------------
// NOTE(eng): All comments are in English for maintainability.

const LS_VERSION = "v1";
const totalKey = `cardkkang:${LS_VERSION}:total`;

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `cardkkang:${LS_VERSION}:day:${y}-${m}-${day}`;
}

function readInt(key, def = 0) {
  try {
    const v = localStorage.getItem(key);
    return v ? parseInt(v, 10) : def;
  } catch {
    return def;
  }
}
function writeInt(key, val) {
  try { localStorage.setItem(key, String(val)); } catch {}
}

const POKEMON = [
  "피카츄","이상해씨","파이리","꼬부기","이브이","푸린","고오스","갸라도스","뮤","뮤츠",
  "마자용","히스이 조로아","루카리오","야도란","잠만보","리자몽","나인테일","푸크린","암나이트","팬텀",
];

// NOTE(eng): Image map for each card (placeholder PNGs are included in images/)
const IMAGE_MAP = {
  "피카츄": "images/img_00.png",
  "이상해씨": "images/img_01.png",
  "파이리": "images/img_02.png",
  "꼬부기": "images/img_03.png",
  "이브이": "images/img_04.png",
  "푸린": "images/img_05.png",
  "고오스": "images/img_06.png",
  "갸라도스": "images/img_07.png",
  "뮤": "images/img_08.png",
  "뮤츠": "images/img_09.png",
  "마자용": "images/img_10.png",
  "히스이 조로아": "images/img_11.png",
  "루카리오": "images/img_12.png",
  "야도란": "images/img_13.png",
  "잠만보": "images/img_14.png",
  "리자몽": "images/img_15.png",
  "나인테일": "images/img_16.png",
  "푸크린": "images/img_17.png",
  "암나이트": "images/img_18.png",
  "팬텀": "images/img_19.png"
};

const RARITIES = [
  { key: "C",  name: "Common",     weight: 60, cls: "card-c"  },
  { key: "U",  name: "Uncommon",   weight: 25, cls: "card-u"  },
  { key: "R",  name: "Rare",       weight: 10, cls: "card-r"  },
  { key: "SR", name: "Super Rare", weight:  4, cls: "card-sr" },
  { key: "UR", name: "Ultra Rare", weight:  1, cls: "card-ur" },
];

function weightedPick() {
  const total = RARITIES.reduce((s, r) => s + r.weight, 0);
  const p = Math.random() * total;
  let acc = 0;
  for (const r of RARITIES) {
    acc += r.weight;
    if (p < acc) return r;
  }
  return RARITIES[0];
}

function pickRarityPack(n = 10) {
  // NOTE(eng): Guarantee at least one Rare or better
  const out = [];
  let hasRare = false;
  for (let i = 0; i < n; i++) {
    const rar = weightedPick();
    if (rar.key === "R" || rar.key === "SR" || rar.key === "UR") hasRare = true;
    const name = POKEMON[Math.floor(Math.random() * POKEMON.length)];
    out.push({ name, rarity: rar });
  }
  if (!hasRare && out.length) out[out.length - 1].rarity = RARITIES[2];
  return out;
}

function updateCounts(cardsAdded = 0) {
  const tk = todayKey();
  const today = readInt(tk, 0) + cardsAdded;
  const total = readInt(totalKey, 0) + cardsAdded;
  writeInt(tk, today);
  writeInt(totalKey, total);

  document.getElementById("todayCount").textContent = today.toLocaleString();
  document.getElementById("totalCount").textContent = total.toLocaleString();
  const prog = (total % 100);
  document.getElementById("progressBar").style.width = `${Math.min(100, prog)}%`;
  document.getElementById("toNext").textContent = ((100 - prog) % 100) || 100;
}

function computeLuckScore(pack) {
  // NOTE(eng): A fun score: UR=10, SR=6, R=3, U=1, C=0 (capped to 100 after *5)
  const score = pack.reduce((s, c) => s + (c.rarity.key === "UR" ? 10 : c.rarity.key === "SR" ? 6 : c.rarity.key === "R" ? 3 : c.rarity.key === "U" ? 1 : 0), 0);
  return Math.min(100, score * 5);
}

function setLuckBar(v) {
  document.getElementById("luckBar").style.width = `${Math.max(0, Math.min(100, v))}%`;
}

function renderPack(pack) {
  const grid = document.getElementById("packGrid");
  const hint = document.getElementById("emptyHint");
  grid.innerHTML = "";
  if (!pack || !pack.length) {
    hint.style.display = "";
    return;
  }
  hint.style.display = "none";

  pack.forEach((c, idx) => {
    const wrap = document.createElement("div");
    wrap.className = `relative rounded-xl p-3 border bg-white dark:bg-zinc-900 animate-fadein ${c.rarity.cls}`;
    wrap.style.animationDelay = `${idx * 50}ms`;

    const badge = document.createElement("div");
    badge.className = "absolute -top-2 -right-2 text-[10px] px-2 py-1 rounded-full border backdrop-blur bg-white/60 dark:bg-zinc-800/60";
    badge.textContent = c.rarity.key;

    const tile = document.createElement("div");
    tile.className = "aspect-[3/4] w-full rounded-lg overflow-hidden bg-gradient-to-br from-white/40 to-zinc-100/60 dark:from-zinc-800/60 dark:to-zinc-900/60 flex items-center justify-center";

    // Image (with fallback to text)
    const imgSrc = IMAGE_MAP[c.name];
    if (imgSrc) {
      const img = document.createElement("img");
      img.src = imgSrc;
      img.alt = c.name;
      img.loading = "lazy";
      img.className = "w-full h-full object-cover";
      tile.appendChild(img);
    } else {
      const span = document.createElement("span");
      span.className = "text-sm font-medium";
      span.textContent = c.name;
      tile.appendChild(span);
    }

    const label = document.createElement("div");
    label.className = "mt-2 text-xs text-zinc-500";
    label.textContent = c.rarity.name;

    wrap.appendChild(badge);
    wrap.appendChild(tile);
    wrap.appendChild(label);
    grid.appendChild(wrap);
  });
}

function spinReels() {
  // NOTE(eng): purely visual spinning animation by swapping letters
  const reels = [document.getElementById("reel1"), document.getElementById("reel2"), document.getElementById("reel3")];
  let step = 0;
  const max = 16 + Math.floor(Math.random() * 10);

  const id = setInterval(() => {
    step += 1;
    reels.forEach((el) => {
      const r = RARITIES[Math.floor(Math.random() * RARITIES.length)].key;
      el.textContent = r;
      el.parentElement.classList.add("spin");
      setTimeout(() => el.parentElement.classList.remove("spin"), 150);
    });
    if (step >= max) clearInterval(id);
  }, 90);
}

function resetToday() {
  writeInt(todayKey(), 0);
  updateCounts(0);
}

function attachThemeToggle() {
  const btn = document.getElementById("themeToggle");
  const root = document.documentElement;
  // initial
  const saved = localStorage.getItem("cardkkang:theme") || "light";
  if (saved === "dark") root.classList.add("dark");
  btn.addEventListener("click", () => {
    root.classList.toggle("dark");
    const mode = root.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem("cardkkang:theme", mode);
  });
}

function main() {
  attachThemeToggle();
  updateCounts(0);
  setLuckBar(0);

  document.getElementById("spinBtn").addEventListener("click", () => {
    spinReels();
  });
  document.getElementById("openBtn").addEventListener("click", () => {
    const pack = pickRarityPack(10);
    renderPack(pack);
    const luck = computeLuckScore(pack);
    setLuckBar(luck);
    updateCounts(10);
  });
  document.getElementById("resetBtn").addEventListener("click", () => resetToday());
}

document.addEventListener("DOMContentLoaded", main);