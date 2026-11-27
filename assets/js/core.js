// GetSimulated: inti. Data komponen, state, utilitas, rute kabel, solver MNA, serta model panas dan kerusakan komponen.
// Dimuat pertama; file lain (scope.js, editor.js, app.js) memakai variabel global dari sini.

let G = 24;
const $ = s => document.querySelector(s);
const cv = $('#cv'), cx = cv.getContext('2d'), sc = $('#sc'), sx = sc.getContext('2d');
const DPR = Math.min(devicePixelRatio || 1, 2);
const V = { z: 1, x: 0, y: 0 };
const D = [[1, 0], [0, 1], [-1, 0], [0, -1]];

// Komponen berkaki tiga. Q = transistor NPN, U = PNP (BJT); M = MOSFET N-channel, N = P-channel (nilai = polaritas).
// Urutan pin: 0 = Basis / Gate, 1 = Kolektor / Drain, 2 = Emitor / Source.
const BJT = { Q: 1, U: -1 };
const FET = { M: 1, N: -1 };
const is3 = c => c.t in BJT || c.t in FET;

const T = {
  V: { n: 'Baterai', u: 'V', v: 9, p: [1.5, 3, 3.3, 5, 9, 12] },
  A: { n: 'Sumber AC', u: 'V', v: 5, p: [1, 3, 5, 9, 12], f: 50, fp: [1, 10, 50, 60, 100, 500, 1000] },
  R: { n: 'Resistor', u: 'Ω', v: 330, p: [10, 100, 220, 330, 470, 1e3, 2200, 4700, 1e4, 1e5, 1e6] },
  C: { n: 'Kapasitor', u: 'F', v: 1e-5 },
  L: { n: 'Induktor', u: 'H', v: .01, p: [1e-3, .01, .1, 1] },
  D: { n: 'LED', u: 'V', v: 1.8, p: [1.8, 2, 2.1, 3], nm: ['Merah', 'Kuning', 'Hijau', 'Biru'] },
  J: { n: 'Dioda', u: 'V', v: .72, p: [.72, .68, .3, .4], nm: ['1N4148', '1N4007', '1N5819', 'BAT54'] },
  S: { n: 'Saklar' },
  G: { n: 'GND' },
  Q: { n: 'Transistor NPN', u: '', v: 100, p: [50, 100, 200, 300] },
  U: { n: 'Transistor PNP', u: '', v: 100, p: [50, 100, 200, 300] },
  M: { n: 'MOSFET N', u: 'V', v: 2, p: [1, 2, 3, 4] },
  N: { n: 'MOSFET P', u: 'V', v: 2, p: [1, 2, 3, 4] }
};

// Tipe kapasitor (disimpan di komponen sebagai c.ct). pol = berkutub: pin 1 = (+), pin 2 = (−).
// Kapasitor berkutub (Elco, Tantalum) disimulasikan dengan dioda proteksi terbalik di dalamnya (lihat step()).
// s = nama pendek di label kanvas. Nilai kapasitansi diisi manual (bawaan 10µF).
const CAPT = {
  elco: { n: 'Elco (Elektrolit)', s: 'Elco', pol: true },
  cer: { n: 'Keramik', s: 'Keramik', pol: false },
  tan: { n: 'Tantalum', s: 'Tantalum', pol: true },
  film: { n: 'Film / Mylar', s: 'Film', pol: false }
};
const capKey = c => CAPT[c.ct] ? c.ct : 'elco';
const ctype = c => CAPT[capKey(c)];

// Nama pin per komponen (indeks 0 = pin 1, 1 = pin 2, 2 = pin 3) dan kutubnya: +1 positif, -1 negatif, 0 netral
const PIN = {
  V: [['− Negatif', -1], ['+ Positif', 1]],
  A: [['Terminal −', -1], ['Terminal +', 1]],
  R: [['Kaki 1', 0], ['Kaki 2', 0]],
  L: [['Kaki 1', 0], ['Kaki 2', 0]],
  S: [['Kontak 1', 0], ['Kontak 2', 0]],
  D: [['Anoda (+)', 1], ['Katoda (−)', -1]],
  J: [['Anoda (+)', 1], ['Katoda (−)', -1]],
  G: [['GND', 0], ['GND', 0]],
  Q: [['Basis (B)', 0], ['Kolektor (C)', 1], ['Emitor (E)', -1]],
  U: [['Basis (B)', 0], ['Kolektor (C)', -1], ['Emitor (E)', 1]],
  M: [['Gate (G)', 0], ['Drain (D)', 1], ['Source (S)', -1]],
  N: [['Gate (G)', 0], ['Drain (D)', -1], ['Source (S)', 1]]
};
const pinInfo = (c, t) => c.t == 'C'
  ? (ctype(c).pol ? [['+ Positif', 1], ['− Negatif', -1]] : [['Kaki 1', 0], ['Kaki 2', 0]])[t]
  : PIN[c.t][t];

const TC = {
  V: '#ef4444', A: '#ef4444', R: '#f59e0b', C: '#3b82f6', L: '#8b5cf6', D: '#10b981', J: '#f97316', S: '#64748b', G: '#64748b',
  Q: '#0ea5e9', U: '#06b6d4', M: '#a855f7', N: '#d946ef'
};

const IC = {
  sel: 'M5 3l12 8-5 1-3 5z',
  wire: 'M4 18h8V6h8',
  del: 'M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13',
  rot: 'M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.5 2.6L21 8M21 3v5h-5',
  V: 'M2 12h8M10 6v12M14 9v6M14 12h8',
  A: 'M2 12h4M18 12h4M6 12a6 6 0 1 0 12 0a6 6 0 1 0-12 0M8 12q2-4 4 0t4 0',
  R: 'M2 12h4l2-5 3 10 3-10 3 10 2-5h3',
  C: 'M2 12h8M10 5v14M14 5v14M14 12h8',
  L: 'M2 12h3c0-5 5-5 5 0c0-5 5-5 5 0c0-5 5-5 5 0h-1',
  D: 'M2 12h6M8 6v12l8-6zM16 6v12M16 12h6M18 4l3-2M20 8l3-2',
  J: 'M2 12h6M8 6v12l8-6zM16 6v12M16 12h6',
  S: 'M2 12h6M16 12h6M8 12l8-6',
  G: 'M12 4v8M5 12h14M8 16h8M10 20h4',
  Q: 'M2 12h7M9 6v12M9 10l8-5M9 14l8 5M12.1 17.8l3.4.2-1.7-3',
  U: 'M2 12h7M9 6v12M9 10l8-5M9 14l8 5M12.7 18.2L11 15.3l3.4.2',
  M: 'M2 12h5M7 6v12M10 6v3M10 10.5v3M10 15v3M10 7.5h10M10 16.5h10M10 12h5M12.5 10.8L10 12l2.5 1.2',
  N: 'M2 12h5M7 6v12M10 6v3M10 10.5v3M10 15v3M10 7.5h10M10 16.5h10M10 12h5M12.5 10.8L15 12l-2.5 1.2'
};

const ico = (k, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${TC[k] || 'currentColor'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${IC[k]}"/></svg>`;

// Contoh rangkaian: [nama, komponen, kabel]. Kabel = [indeksKomp, pin, indeksKomp, pin] (pin 0 = kaki a, 1 = kaki b)
// Komponen berkaki tiga: titik (x, y) adalah kaki tengah (Basis/Gate); kaki Kolektor/Drain satu kotak di atasnya dan
// Emitor/Source satu kotak di bawahnya (untuk putaran 0), badan di sebelah kanan.
const EX = [
  ['LED + resistor', [['V', 4, 9, 3], ['R', 4, 6, 0], ['D', 7, 6, 1], ['G', 4, 9, 0]], [[2, 1, 3, 0]]],
  ['Pengisian kapasitor (RC)', [['V', 4, 9, 3, 9], ['S', 4, 6, 0], ['R', 7, 6, 0, 1000], ['C', 10, 6, 1, 1e-4], ['G', 4, 9, 0]], [[3, 1, 4, 0]]],
  ['Penyearah setengah gelombang', [['A', 4, 9, 3, 5], ['J', 4, 6, 0], ['R', 7, 6, 1, 1000], ['C', 10, 6, 1, 1e-5], ['G', 4, 9, 0]], [[2, 0, 3, 0], [3, 1, 2, 1], [2, 1, 4, 0]]],
  // Saklar menyalakan LED lewat transistor NPN: arus basis kecil (sekitar 0,8 mA) mengendalikan arus LED (sekitar 21 mA)
  ['Transistor NPN sebagai saklar', [['V', 4, 12, 3, 9], ['G', 4, 12, 0], ['S', 4, 9, 0], ['R', 7, 9, 0, 1e4], ['Q', 10, 9, 0], ['D', 10, 5, 1], ['R', 10, 2, 1, 330]], [[0, 1, 6, 0], [4, 2, 1, 0]]],
  // Saklar memberi tegangan ke gate MOSFET N-channel; resistor 100 kΩ menarik gate ke GND saat saklar dibuka
  ['MOSFET N sebagai saklar', [['V', 1, 12, 3, 9], ['G', 1, 12, 0], ['S', 1, 9, 0], ['M', 7, 9, 0, 2], ['D', 7, 5, 1], ['R', 7, 2, 1, 330], ['R', 4, 9, 1, 1e5]], [[0, 1, 5, 0], [2, 1, 3, 0], [3, 2, 1, 0], [6, 1, 1, 0]]]
];

const S = {
  comps: [],
  wires: [],
  links: {},
  nid: 0,
  tool: 'sel',
  sel: null,
  sw: null,
  we: null,
  wc: null,
  wm: null,
  rot: 0,
  run: true,
  t: 0,
  dt: 1e-4,
  U: [],
  R: [],
  real: true,
  pv: null,
  rc: [3, 6, 0, 2],
  wd: null,
  hv: null,
  ptag: null,
  fx: []
};
const WP = () => S.wires.flatMap(w => [w[0], w[1]]);
let net = null;

function fmt(x, u) {
  if (x == null || isNaN(x)) return '';
  const a = Math.abs(x);
  if (a < 1e-15) return '0' + u;
  for (const [s, p] of [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']]) {
    if (a >= s * .9999) return +(x / s).toPrecision(3) + p + u;
  }
  return x.toExponential(1) + u;
}

function parse(s) {
  const m = String(s).trim().match(/^([\d.]+(?:e[-+]?\d+)?)\s*([pnuµmkKMG]?)/);
  if (!m) return NaN;
  return +m[1] * ({ p: 1e-12, n: 1e-9, u: 1e-6, 'µ': 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, G: 1e9 }[m[2]] || 1);
}

// Titik pin dalam koordinat grid. Komponen berkaki dua: pin 2 berjarak 3 kotak searah putaran.
// Komponen berkaki tiga (seperti kemasan TO-92 asli): tiga kaki sejajar berderet, pin 0 (Basis/Gate) di tengah titik (x, y),
// pin 1 (Kolektor/Drain) satu kotak ke satu sisi dan pin 2 (Emitor/Source) satu kotak ke sisi lain; badan ada di depannya.
const term = c => {
  const a = [c.x, c.y], d = D[c.r];
  if (is3(c)) return [a, [c.x + d[1], c.y - d[0]], [c.x - d[1], c.y + d[0]]];
  return [a, c.t == 'G' ? a : [c.x + d[0] * 3, c.y + d[1] * 3]];
};
const K = p => p[0] + ',' + p[1];

// Titik lokal komponen (piksel, sebelum diputar) menjadi koordinat piksel dunia
const lw = (c, x, y) => {
  const d = D[c.r];
  return [c.x * G + x * d[0] - y * d[1], c.y * G + x * d[1] + y * d[0]];
};

// Pusat badan komponen dalam piksel dunia (untuk efek ledakan)
const ctr = c => is3(c) ? lw(c, 58, 0) : [(c.x + D[c.r][0] * 1.5) * G, (c.y + D[c.r][1] * 1.5) * G];

function onSeg(p, a, b) {
  return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) == 0 &&
         p[0] >= Math.min(a[0], b[0]) && p[0] <= Math.max(a[0], b[0]) &&
         p[1] >= Math.min(a[1], b[1]) && p[1] <= Math.max(a[1], b[1]);
}

// ---------- Kabel: tautan pin-ke-pin + rute otomatis ----------
const cb = id => S.comps.find(c => c.id == id);
const lp = e => {
  if (e.c == null) return e.p;
  const c = cb(e.c);
  return c ? term(c)[e.t] : null;
};
const linksOf = id => Object.keys(S.links).filter(k => S.links[k].a.c == id || S.links[k].b.c == id).map(Number);

// Kotak (lokal, dalam satuan grid) yang ditutup kaki dan badan komponen berkaki tiga agar kabel tidak melewatinya
const B3 = [[1, -1], [1, 0], [1, 1], [2, -1], [2, 0], [2, 1], [3, -1], [3, 0], [3, 1], [4, -1], [4, 0], [4, 1]];

// Dijkstra di grid: ortogonal, menghindari badan komponen, kaki komponen lain, dan ujung kabel lain
function route(a, b, ex) {
  const ka = K(a), kb = K(b);
  if (ka == kb) return [a];
  const blk = new Set(), pen = new Set(), xs = [a[0], b[0]], ys = [a[1], b[1]], bk = (x, y) => blk.add(x + ',' + y);
  for (const c of S.comps) {
    const d = D[c.r];
    if (c.t == 'G') bk(c.x - d[1], c.y + d[0]);
    else if (is3(c)) for (const [u, v] of B3) bk(c.x + u * d[0] - v * d[1], c.y + u * d[1] + v * d[0]);
    else { bk(c.x + d[0], c.y + d[1]); bk(c.x + 2 * d[0], c.y + 2 * d[1]); }
    for (const p of term(c)) {
      xs.push(p[0]); ys.push(p[1]);
      if (K(p) != ka && K(p) != kb) blk.add(K(p));
    }
  }
  for (const w of S.wires) {
    if (w[2] === ex) continue;
    for (const p of [w[0], w[1]]) {
      xs.push(p[0]); ys.push(p[1]);
      if (K(p) != ka && K(p) != kb) blk.add(K(p));
    }
    const dx = Math.sign(w[1][0] - w[0][0]), dy = Math.sign(w[1][1] - w[0][1]);
    if ((!dx || !dy) && (dx || dy)) {
      for (let x = w[0][0] + dx, y = w[0][1] + dy; x != w[1][0] || y != w[1][1]; x += dx, y += dy) pen.add(x + ',' + y);
    }
  }
  const x0 = Math.min(...xs) - 4, x1 = Math.max(...xs) + 4, y0 = Math.min(...ys) - 4, y1 = Math.max(...ys) + 4;
  const dist = new Map(), prev = new Map(), h = [], sk = (x, y, d) => x + ',' + y + ',' + d;
  const push = (f, s) => {
    h.push([f, s]);
    let i = h.length - 1;
    while (i) {
      const p = (i - 1) >> 1;
      if (h[p][0] <= h[i][0]) break;
      [h[p], h[i]] = [h[i], h[p]];
      i = p;
    }
  };
  const pop = () => {
    const t = h[0], l = h.pop();
    if (h.length) {
      h[0] = l;
      let i = 0;
      for (;;) {
        let m = i;
        const a = 2 * i + 1, b = a + 1;
        if (a < h.length && h[a][0] < h[m][0]) m = a;
        if (b < h.length && h[b][0] < h[m][0]) m = b;
        if (m == i) break;
        [h[m], h[i]] = [h[i], h[m]];
        i = m;
      }
    }
    return t;
  };
  dist.set(sk(a[0], a[1], 4), 0);
  push(0, [a[0], a[1], 4]);
  let goal = null, it = 0;
  while (h.length && it++ < 40000) {
    const [f, [x, y, d]] = pop(), k = sk(x, y, d);
    if (f > dist.get(k)) continue;
    if (x == b[0] && y == b[1]) { goal = k; break; }
    for (let n = 0; n < 4; n++) {
      const nx = x + D[n][0], ny = y + D[n][1];
      if (nx < x0 || nx > x1 || ny < y0 || ny > y1) continue;
      const nk = nx + ',' + ny;
      if (blk.has(nk)) continue;
      const turn = d != 4 && n != d;
      if (turn && pen.has(x + ',' + y)) continue;
      const c = f + 1 + (turn ? 3 : 0) + (pen.has(nk) ? 10 : 0), s = sk(nx, ny, n);
      if (c < (dist.get(s) ?? 1e9)) { dist.set(s, c); prev.set(s, k); push(c, [nx, ny, n]); }
    }
  }
  if (!goal) return [a, [b[0], a[1]], b];
  const pts = [];
  for (let k = goal; k; k = prev.get(k)) {
    const [x, y] = k.split(',').map(Number);
    pts.push([x, y]);
  }
  pts.reverse();
  const o = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i - 1], q = pts[i], r = pts[i + 1];
    if ((q[0] - p[0]) * (r[1] - q[1]) != (q[1] - p[1]) * (r[0] - q[0])) o.push(q);
  }
  o.push(pts[pts.length - 1]);
  return o;
}

// Segmen kabel diturunkan dari daftar titik (pts) tiap tautan; titik dibagi dengan segmen sehingga digeser langsung
function rebuildWires() {
  S.wires = [];
  for (const id in S.links) {
    const L = S.links[id];
    if (!L.pts) continue;
    for (let i = 0; i + 1 < L.pts.length; i++) S.wires.push([L.pts[i], L.pts[i + 1], +id]);
  }
}

// Rute otomatis ulang (menghapus tekukan manual)
function reroute(ids) {
  for (const id of ids) {
    const L = S.links[id];
    if (!L) continue;
    const a = lp(L.a), b = lp(L.b);
    if (!a || !b) { delete S.links[id]; continue; }
    L.pts = route(a, b, +id).map(p => [p[0], p[1]]);
    rebuildWires();
  }
  rebuildWires();
}

// Rapikan titik tekuk: hapus titik kembar dan titik yang sudah lurus (menyatu lagi)
function tidy(L) {
  const P = L.pts;
  for (let i = P.length - 2; i >= 1; i--) {
    const p = P[i - 1], q = P[i], r = P[i + 1];
    const straight = (q[0] - p[0]) * (r[1] - q[1]) == (q[1] - p[1]) * (r[0] - q[0]);
    if (straight) P.splice(i, 1);
  }
}

// Pin komponen terdekat dari titik kanvas
const near = (px, py) => {
  let r = null;
  for (const c of S.comps) {
    term(c).forEach((p, i) => {
      if (!(c.t == 'G' && i == 1) && Math.hypot(px - p[0] * G, py - p[1] * G) < 10) r = { c, t: i, p };
    });
  }
  return r;
};

// Tujuan sambungan: pin komponen lain, atau titik di tengah kabel yang sudah ada
function target(px, py, c0, t0, ex) {
  let best = null, bd = 14;
  for (const c of S.comps) {
    term(c).forEach((p, t) => {
      if ((c === c0 && t == t0) || (c.t == 'G' && t == 1)) return;
      const d = Math.hypot(px - p[0] * G, py - p[1] * G);
      if (d < bd) { bd = d; best = { c: c.id, t, p }; }
    });
  }
  if (best) return best;
  const gx = Math.round(px / G), gy = Math.round(py / G), p = [gx, gy];
  if (Math.hypot(px - gx * G, py - gy * G) < 10) {
    for (const w of S.wires) {
      if (w[2] === ex) continue;
      if ((w[0][0] == w[1][0] || w[0][1] == w[1][1]) && onSeg(p, w[0], w[1])) return { p };
    }
  }
  return null;
}

// build() membangun ulang jaringan dan MENGULANG simulasi dari nol (tegangan, arus, suhu, komponen rusak diganti baru).
// build(true) hanya membangun ulang jaringan (dipakai saat komponen meledak) tanpa mengulang simulasi.
function build(keep) {
  const par = {}, f = k => par[k] === k ? k : (par[k] = f(par[k])), add = k => { if (!(k in par)) par[k] = k; };
  S.comps.forEach(c => term(c).forEach(p => add(K(p))));
  S.wires.forEach(w => { add(K(w[0])); add(K(w[1])); par[f(K(w[0]))] = f(K(w[1])); });
  for (const p of [...S.comps.flatMap(term), ...WP()]) {
    for (const w of S.wires) {
      if (onSeg(p, w[0], w[1])) par[f(K(p))] = f(K(w[0]));
    }
  }
  if (!keep) {
    S.comps.forEach(c => {
      c.v = 0; c.i = 0; c.vd = 0; c.T = TAMB; c.P = 0; c.pa = c.pn = 0; c.dead = false; c.why = ''; c.smk = 0;
      c.q1 = c.q2 = 0; c.vbe = c.ib = c.vgs = 0; // keadaan sambungan transistor
    });
    S.t = 0; scopeReset();
  }
  const gc = S.comps.find(c => c.t == 'G');
  if (!gc) { net = null; return; }
  const gr = f(K(term(gc)[0])), idx = {};
  let n = 0, m = 0;
  for (const k of Object.keys(par)) {
    const r = f(k);
    if (!(r in idx)) idx[r] = r === gr ? -1 : n++;
  }
  const nd = p => idx[f(K(p))];
  net = {
    n,
    // komponen rusak (meledak) diperlakukan sebagai rangkaian terbuka
    els: S.comps.filter(c => c.t != 'G' && !c.dead).map(c => {
      const tp = term(c), e = { c, a: nd(tp[0]), b: nd(tp[1]) };
      if (tp.length > 2) e.e = nd(tp[2]); // pin 3: Emitor / Source
      if (c.t == 'V' || c.t == 'A') e.k = m++;
      return e;
    })
  };
  net.els.forEach(e => { if (e.k != null) e.k += n; });
  net.N = n + m;
}

function gauss(A, N) {
  for (let i = 0; i < N; i++) {
    let p = i;
    for (let r = i + 1; r < N; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]];
    const d = A[i][i] || 1e-18;
    for (let r = i + 1; r < N; r++) {
      const f = A[r][i] / d;
      if (f) for (let c = i; c <= N; c++) A[r][c] -= f * A[i][c];
    }
  }
  const x = new Float64Array(N);
  for (let i = N - 1; i >= 0; i--) {
    let s = A[i][N];
    for (let c = i + 1; c < N; c++) s -= A[i][c] * x[c];
    x[i] = s / (A[i][i] || 1e-18);
  }
  return x;
}

const NV = 2 * .02585, isat = c => .01 / Math.exp(c.val / NV);
const ISR = .01 / Math.exp(1 / NV); // dioda terbalik kapasitor berkutub: sekitar 1 V pada 10 mA

// ---------- Model transistor ----------
// BJT: Ebers-Moll (Is = 1e-14 A, Vt = 25,85 mV, hFE = nilai komponen, beta balik = 2). Keadaan sambungan (sudah dikali
// polaritas): c.q1 = Vbe, c.q2 = Vbc. Eksponen dilinierkan di atas 40 agar tidak meluap.
// MOSFET: level 1 (hukum kuadrat) dengan modulasi panjang kanal 0,02 dan k = 0,2 A/V²; simetris (drain dan source
// bertukar bila tegangan terbalik). Keadaan: c.q1 = Vg - Vs, c.q2 = Vd - Vs (tegangan simpul asli).
const QT = .02585, QIS = 1e-14, QBR = 2, FK = .2, FLAM = .02;
const E40 = Math.exp(40);
const eexp = x => x < 40 ? Math.exp(x) : E40 * (1 + x - 40);
const deexp = x => x < 40 ? Math.exp(x) : E40;

function bjtEval(c) {
  const e1 = eexp(c.q1 / QT), e2 = eexp(c.q2 / QT);
  const IF = QIS * (e1 - 1), IR = QIS * (e2 - 1);
  return {
    ic: IF - IR * (1 + 1 / QBR),
    ib: IF / c.val + IR / QBR,
    gF: QIS / QT * deexp(c.q1 / QT),
    gR: QIS / QT * deexp(c.q2 / QT)
  };
}

function fetEval(c) {
  const s = FET[c.t], vgs0 = s * c.q1, vds0 = s * c.q2, sw = vds0 < 0;
  const vgs = sw ? s * (c.q1 - c.q2) : vgs0, vds = sw ? -vds0 : vds0, vov = vgs - c.val;
  let id = 0, gm = 0, gds = 0;
  if (vov > 0) {
    const m = 1 + FLAM * vds;
    if (vds < vov) {
      id = FK * (2 * vov * vds - vds * vds) * m;
      gm = 2 * FK * vds * m;
      gds = FK * ((2 * vov - 2 * vds) * m + (2 * vov * vds - vds * vds) * FLAM);
    } else {
      id = FK * vov * vov * m;
      gm = 2 * FK * vov * m;
      gds = FK * vov * vov * FLAM;
    }
  }
  return { s, sw, id: id + 1e-9 * vds, gm, gds: gds + 1e-9 }; // 1e-9: kebocoran kecil agar solver stabil
}

function step() {
  const { n, els, N } = net, dt = S.dt;
  let x;
  for (let it = 0; it < 120; it++) {
    const A = Array.from({ length: N }, () => new Float64Array(N + 1));
    const g = (a, b, y) => {
      if (a >= 0) A[a][a] += y;
      if (b >= 0) A[b][b] += y;
      if (a >= 0 && b >= 0) { A[a][b] -= y; A[b][a] -= y; }
    };
    const cs = (a, b, i) => { if (a >= 0) A[a][N] -= i; if (b >= 0) A[b][N] += i; };
    for (let i = 0; i < n; i++) A[i][i] += 1e-12;
    for (const e of els) {
      const c = e.c, a = e.a, b = e.b;
      if (c.t == 'R') g(a, b, 1 / c.val);
      else if (c.t == 'S') g(a, b, c.on ? 1e3 : 1e-9);
      else if (c.t == 'C') {
        const y = c.val / dt; g(a, b, y); cs(a, b, -y * c.v);
        if (ctype(c).pol) {
          // Berkutub: dioda proteksi paralel (anoda pin 2, katoda pin 1) menjepit tegangan terbalik sekitar −1 V
          const ex = Math.exp(c.vd / NV), gd = ISR * ex / NV + 1e-12;
          g(b, a, gd); cs(b, a, ISR * (ex - 1) - gd * c.vd);
        }
      }
      else if (c.t == 'L') { g(a, b, dt / c.val); cs(a, b, c.i); }
      else if (c.t == 'D' || c.t == 'J') {
        const Is = isat(c), ex = Math.exp(c.vd / NV), gd = Is * ex / NV + 1e-12;
        g(a, b, gd); cs(a, b, Is * (ex - 1) - gd * c.vd);
      } else if (c.t in BJT) {
        // Pin: a = Basis, b = Kolektor, e.e = Emitor. Arus terminal dilinierkan terhadap Vbe dan Vbc (companion model).
        const s = BJT[c.t], ev = bjtEval(c), ns = [a, b, e.e];
        const aB = s * ev.gF / c.val, bB = s * ev.gR / QBR, iB = s * ev.ib;
        const aC = s * ev.gF, bC = -s * ev.gR * (1 + 1 / QBR), iC = s * ev.ic;
        const rows = [[ns[0], aB, bB, iB], [ns[1], aC, bC, iC], [ns[2], -(aB + aC), -(bB + bC), -(iB + iC)]];
        for (const [nk, ak, bk, i0] of rows) {
          if (nk < 0) continue;
          if (ns[0] >= 0) A[nk][ns[0]] += s * (ak + bk);
          if (ns[2] >= 0) A[nk][ns[2]] -= s * ak;
          if (ns[1] >= 0) A[nk][ns[1]] -= s * bk;
          A[nk][N] -= i0 - ak * c.q1 - bk * c.q2;
        }
      } else if (c.t in FET) {
        // Pin: a = Gate, b = Drain, e.e = Source. Gate tidak menarik arus.
        const ev = fetEval(c), ns = [a, b, e.e], v1 = c.q1, v2 = c.q2, s = ev.s;
        let rowD, rowS, ieD, ieS;
        if (!ev.sw) {
          rowD = [ev.gm, ev.gds, -(ev.gm + ev.gds)];
          ieD = s * ev.id - ev.gm * v1 - ev.gds * v2;
          rowS = rowD.map(q => -q);
          ieS = -ieD;
        } else {
          rowS = [ev.gm, -(ev.gm + ev.gds), ev.gds];
          ieS = s * ev.id - ev.gm * (v1 - v2) + ev.gds * v2;
          rowD = rowS.map(q => -q);
          ieD = -ieS;
        }
        for (const [nk, co, ie] of [[ns[1], rowD, ieD], [ns[2], rowS, ieS]]) {
          if (nk < 0) continue;
          for (let j = 0; j < 3; j++) if (ns[j] >= 0) A[nk][ns[j]] += co[j];
          A[nk][N] -= ie;
        }
      } else {
        const k = e.k;
        if (b >= 0) { A[b][k] -= 1; A[k][b] += 1; }
        if (a >= 0) { A[a][k] += 1; A[k][a] -= 1; }
        A[k][k] -= .01;
        A[k][N] = c.t == 'A' ? c.val * Math.sin(6.283185 * c.f * (S.t + dt)) : c.val;
      }
    }
    x = gauss(A, N);
    let conv = true;
    for (const e of els) {
      if (e.c.t == 'D' || e.c.t == 'J') {
        const c = e.c, v = (e.a >= 0 ? x[e.a] : 0) - (e.b >= 0 ? x[e.b] : 0);
        if (Math.abs(v - c.vd) > 1e-6) conv = false;
        c.vd += Math.max(-.5, Math.min(.1, v - c.vd));
      } else if (e.c.t == 'C' && ctype(e.c).pol) {
        // Selama dioda terbalik jelas mati (< 0,3 V), cukup ikuti tegangannya tanpa iterasi tambahan
        const c = e.c, v = (e.b >= 0 ? x[e.b] : 0) - (e.a >= 0 ? x[e.a] : 0);
        if (v < .3 && c.vd < .3) c.vd = v;
        else {
          if (Math.abs(v - c.vd) > 1e-6) conv = false;
          c.vd += Math.max(-.5, Math.min(.1, v - c.vd));
        }
      } else if (e.c.t in BJT) {
        const c = e.c, s = BJT[c.t];
        const xb = e.a >= 0 ? x[e.a] : 0, xc = e.b >= 0 ? x[e.b] : 0, xe = e.e >= 0 ? x[e.e] : 0;
        const n1 = s * (xb - xe), n2 = s * (xb - xc);
        if (Math.abs(n1 - c.q1) > 1e-6 || Math.abs(n2 - c.q2) > 1e-6) conv = false;
        c.q1 += Math.max(-.5, Math.min(.1, n1 - c.q1));
        c.q2 += Math.max(-.5, Math.min(.1, n2 - c.q2));
      } else if (e.c.t in FET) {
        const c = e.c;
        const xg = e.a >= 0 ? x[e.a] : 0, xd = e.b >= 0 ? x[e.b] : 0, xs = e.e >= 0 ? x[e.e] : 0;
        const n1 = xg - xs, n2 = xd - xs;
        if (Math.abs(n1 - c.q1) > 1e-6 || Math.abs(n2 - c.q2) > 1e-6) conv = false;
        c.q1 += Math.max(-3, Math.min(3, n1 - c.q1));
        c.q2 += Math.max(-3, Math.min(3, n2 - c.q2));
      }
    }
    if (conv) break;
  }
  for (const e of els) {
    const c = e.c, v = (e.a >= 0 ? x[e.a] : 0) - (e.b >= 0 ? x[e.b] : 0);
    if (c.t == 'R') c.i = v / c.val;
    else if (c.t == 'S') c.i = v * (c.on ? 1e3 : 1e-9);
    else if (c.t == 'C') {
      c.i = c.val / dt * (v - c.v);
      if (ctype(c).pol) { const id = ISR * (Math.exp(c.vd / NV) - 1); if (id > 0) c.i -= id; } // arus dioda terbalik: pin 2 ke pin 1
      c.v = v;
      continue;
    }
    else if (c.t == 'L') c.i = c.i + dt / c.val * v;
    else if (c.t == 'D' || c.t == 'J') c.i = isat(c) * (Math.exp(c.vd / NV) - 1);
    else if (c.t in BJT) {
      // c.v = Vce, c.i = Ic (masuk ke kolektor), c.vbe dan c.ib untuk tampilan dan panas
      const ev = bjtEval(c), s = BJT[c.t];
      const xb = e.a >= 0 ? x[e.a] : 0, xc = e.b >= 0 ? x[e.b] : 0, xe = e.e >= 0 ? x[e.e] : 0;
      c.i = s * ev.ic; c.ib = s * ev.ib; c.v = xc - xe; c.vbe = xb - xe;
      continue;
    }
    else if (c.t in FET) {
      // c.v = Vds, c.i = Id (masuk ke drain), c.vgs = Vgs
      const ev = fetEval(c);
      const xg = e.a >= 0 ? x[e.a] : 0, xd = e.b >= 0 ? x[e.b] : 0, xs = e.e >= 0 ? x[e.e] : 0;
      c.i = ev.sw ? -ev.s * ev.id : ev.s * ev.id; c.v = xd - xs; c.vgs = xg - xs;
      continue;
    }
    else { c.i = x[e.k]; c.v = -v; continue; }
    c.v = v;
  }
  S.t += dt;
}

// ---------- Panas dan kerusakan komponen ----------
// Tiap komponen punya suhu (c.T). Daya yang diserap memanaskannya, dan suhu ikut turun saat daya mengecil.
// Pr = daya nominal (W): pada daya ini suhu naik 60 °C di atas suhu ruang. Tmax = suhu rusak (komponen meledak).
// Komponen yang meledak (c.dead) dianggap terbuka (putus) sampai rangkaian diedit atau Reset Simulasi ditekan.
const TAMB = 25;
const THAU = 1.5; // konstanta waktu pemanasan, detik nyata
const TH = {
  R: { Pr: .25, Tmax: 170 },
  L: { Pr: .5, Tmax: 160 },
  D: { Pr: .06, Tmax: 120 },
  J: { Pr: 1, Tmax: 150 },
  C: { Pr: .25, Tmax: 105 },
  V: { Pr: 2, Tmax: 100 },
  A: { Pr: 2, Tmax: 100 },
  Q: { Pr: .3, Tmax: 150 },
  U: { Pr: .3, Tmax: 150 },
  M: { Pr: .5, Tmax: 150 },
  N: { Pr: .5, Tmax: 150 }
};
const CAPV = { elco: 16, cer: 50, tan: 10, film: 63 }; // tegangan kerja maksimum per tipe kapasitor (V)
const VGMAX = 20; // tegangan gate-source maksimum MOSFET (V)

// Daya pemanasan efektif (W).
// Baterai / Sumber AC: rugi hambatan dalam 1 Ω (I²), BUKAN tegangan terminal x arus. Saat dikorsleting tegangan terminal
// ~0 V sehingga v x i = 0 walau arusnya ratusan ampere; hambatan dalam inilah yang memanas. Dipakai hanya untuk panas
// (perhitungan listriknya tetap memakai hambatan dalam 10 mΩ di solver).
// Induktor: rugi tembaga (hambatan kawat 0,5 Ω).
// LED dan dioda dipasang terbalik tidak dibakar: arus balik nyaris nol, jadi hanya tidak menyala (seperti aslinya pada
// tegangan rendah). Model tembus balik (breakdown) belum ada.
// Kapasitor: polaritas terbalik dan tegangan melebihi batas memanaskan dengan cepat.
// Transistor bipolar: Vce x Ic + Vbe x Ib. MOSFET: Vds x Id, dan tegangan gate melebihi 20 V menembus isolator gate.
function pwr(c) {
  const v = c.v, i = c.i, p = Math.abs(v * i);
  if (c.t == 'V' || c.t == 'A') return i * i;
  if (c.t == 'L') return i * i * .5;
  if (c.t in BJT) return p + Math.abs(c.vbe * c.ib);
  if (c.t in FET) {
    let q = p;
    if (Math.abs(c.vgs) > VGMAX) q += TH[c.t].Pr * 4 * (c.vgs / VGMAX) ** 2;
    return q;
  }
  if (c.t == 'C') {
    let q = p;
    if (ctype(c).pol && v < -.7) q += 20 * Math.abs(i);
    const vm = CAPV[capKey(c)];
    if (Math.abs(v) > vm) q += TH.C.Pr * 4 * (v / vm) ** 2;
    return q;
  }
  return p;
}

// Dipanggil tiap langkah simulasi: kumpulkan daya rata-rata per komponen
function heatAcc() {
  for (const e of net.els) {
    const c = e.c;
    if (!TH[c.t]) continue;
    c.pa = (c.pa || 0) + pwr(c);
    c.pn = (c.pn || 0) + 1;
  }
}

function whyOf(c, P) {
  const v = Math.abs(c.v), i = Math.abs(c.i);
  if (c.t == 'C') {
    const vm = CAPV[capKey(c)];
    if (v > vm) return 'tegangan ' + fmt(v, 'V') + ' melebihi batas ' + vm + 'V';
    if (ctype(c).pol && c.v < -.7) return 'dipasang terbalik (polaritas salah)';
    return 'terlalu panas';
  }
  if (c.t in FET && Math.abs(c.vgs) > VGMAX) return 'tegangan gate ' + fmt(Math.abs(c.vgs), 'V') + ' melebihi batas ' + VGMAX + 'V';
  if (c.t == 'V' || c.t == 'A') return 'arus ' + fmt(i, 'A') + ' terlalu besar (korsleting?)';
  if (c.t == 'D' || c.t == 'J' || c.t == 'L') return 'arus ' + fmt(i, 'A') + ' terlalu besar';
  return 'daya ' + fmt(P, 'W') + ' melebihi rating ' + fmt(TH[c.t].Pr, 'W');
}

// Dipanggil sekali per bingkai (dt = detik nyata): perbarui suhu, ledakkan komponen yang melewati batas
function heatStep(dt) {
  if (!net) return;
  const k = 1 - Math.exp(-dt / THAU);
  for (const e of net.els) {
    const c = e.c, th = TH[c.t];
    if (!th || c.dead || !c.pn) continue;
    let P = c.pa / c.pn;
    c.pa = c.pn = 0;
    if (!isFinite(P)) P = 1e6;
    c.P = P;
    if (c.T == null) c.T = TAMB;
    c.T += (TAMB + P * 60 / th.Pr - c.T) * k;
    if (c.T >= th.Tmax) boom(c, whyOf(c, P));
  }
}

function boom(c, why) {
  c.dead = true;
  c.why = why;
  c.v = c.i = c.vd = 0;
  c.T = TH[c.t].Tmax;
  c.smk = 6;
  const [x, y] = ctr(c);
  S.fx.push({ k: 'flash', x, y, life: .4, max: .4 });
  for (let i = 0; i < 36; i++) {
    const a = Math.random() * 6.283, s = 80 + Math.random() * 220, l = .5 + Math.random() * .6;
    S.fx.push({ k: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: l, max: l });
  }
  for (let i = 0; i < 14; i++) {
    const l = 1.6 + Math.random() * 1.4;
    S.fx.push({ k: 'smoke', x: x + (Math.random() - .5) * 14, y: y + (Math.random() - .5) * 10, vx: (Math.random() - .5) * 20, vy: -20 - Math.random() * 30, life: l, max: l, r: 6 + Math.random() * 6 });
  }
  build(true);
  note('💥 ' + T[c.t].n + ' meledak: ' + why);
  if (S.sel === c) ui();
}

// Animasi efek ledakan: percikan, kilatan, dan asap (asap tipis terus keluar dari komponen rusak beberapa detik)
function updFx(dt) {
  const f = S.fx;
  for (let i = f.length - 1; i >= 0; i--) {
    const p = f[i];
    p.life -= dt;
    if (p.life <= 0) { f.splice(i, 1); continue; }
    if (p.k != 'flash') { p.x += p.vx * dt; p.y += p.vy * dt; }
    if (p.k == 'spark') p.vy += 400 * dt;
  }
  if (f.length > 400) return;
  for (const c of S.comps) {
    if (!c.dead || !(c.smk > 0)) continue;
    c.smk -= dt;
    if (Math.random() < dt * 6) {
      const q = ctr(c), l = 1.4 + Math.random();
      f.push({ k: 'smoke', x: q[0] + (Math.random() - .5) * 10, y: q[1], vx: (Math.random() - .5) * 10, vy: -18 - Math.random() * 14, life: l, max: l, r: 4 + Math.random() * 4 });
    }
  }
}
