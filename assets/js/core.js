// GetSimulated: inti. Data komponen, state, utilitas, rute kabel, dan solver MNA.
// Dimuat pertama; file lain (scope.js, editor.js, app.js) memakai variabel global dari sini.

let G = 24;
const $ = s => document.querySelector(s);
const cv = $('#cv'), cx = cv.getContext('2d'), sc = $('#sc'), sx = sc.getContext('2d');
const DPR = Math.min(devicePixelRatio || 1, 2);
const V = { z: 1, x: 0, y: 0 };
const D = [[1, 0], [0, 1], [-1, 0], [0, -1]];

const T = {
  V: { n: 'Baterai', u: 'V', v: 9, p: [1.5, 3, 3.3, 5, 9, 12] },
  A: { n: 'Sumber AC', u: 'V', v: 5, p: [1, 3, 5, 9, 12], f: 50, fp: [1, 10, 50, 60, 100, 500, 1000] },
  R: { n: 'Resistor', u: 'Ω', v: 330, p: [10, 100, 220, 330, 470, 1e3, 2200, 4700, 1e4, 1e5, 1e6] },
  C: { n: 'Kapasitor', u: 'F', v: 1e-5 },
  L: { n: 'Induktor', u: 'H', v: .01, p: [1e-3, .01, .1, 1] },
  D: { n: 'LED', u: 'V', v: 1.8, p: [1.8, 2, 2.1, 3], nm: ['Merah', 'Kuning', 'Hijau', 'Biru'] },
  J: { n: 'Dioda', u: 'V', v: .72, p: [.72, .68, .3, .4], nm: ['1N4148', '1N4007', '1N5819', 'BAT54'] },
  S: { n: 'Saklar' },
  G: { n: 'GND' }
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

// Nama pin per komponen (indeks 0 = pin 1, 1 = pin 2) dan kutubnya: +1 positif, -1 negatif, 0 netral
const PIN = {
  V: [['− Negatif', -1], ['+ Positif', 1]],
  A: [['Terminal −', -1], ['Terminal +', 1]],
  R: [['Kaki 1', 0], ['Kaki 2', 0]],
  L: [['Kaki 1', 0], ['Kaki 2', 0]],
  S: [['Kontak 1', 0], ['Kontak 2', 0]],
  D: [['Anoda (+)', 1], ['Katoda (−)', -1]],
  J: [['Anoda (+)', 1], ['Katoda (−)', -1]],
  G: [['GND', 0], ['GND', 0]]
};
const pinInfo = (c, t) => c.t == 'C'
  ? (ctype(c).pol ? [['+ Positif', 1], ['− Negatif', -1]] : [['Kaki 1', 0], ['Kaki 2', 0]])[t]
  : PIN[c.t][t];

const TC = {
  V: '#ef4444', A: '#ef4444', R: '#f59e0b', C: '#3b82f6', L: '#8b5cf6', D: '#10b981', J: '#f97316', S: '#64748b', G: '#64748b'
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
  G: 'M12 4v8M5 12h14M8 16h8M10 20h4'
};

const ico = (k, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${TC[k] || 'currentColor'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${IC[k]}"/></svg>`;

// Contoh rangkaian: [nama, komponen, kabel]. Kabel = [indeksKomp, pin, indeksKomp, pin] (pin 0 = kaki a, 1 = kaki b)
const EX = [
  ['LED + resistor', [['V', 4, 9, 3], ['R', 4, 6, 0], ['D', 7, 6, 1], ['G', 4, 9, 0]], [[2, 1, 3, 0]]],
  ['Pengisian kapasitor (RC)', [['V', 4, 9, 3, 9], ['S', 4, 6, 0], ['R', 7, 6, 0, 1000], ['C', 10, 6, 1, 1e-4], ['G', 4, 9, 0]], [[3, 1, 4, 0]]],
  ['Penyearah setengah gelombang', [['A', 4, 9, 3, 5], ['J', 4, 6, 0], ['R', 7, 6, 1, 1000], ['C', 10, 6, 1, 1e-5], ['G', 4, 9, 0]], [[2, 0, 3, 0], [3, 1, 2, 1], [2, 1, 4, 0]]]
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
  ptag: null
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

const term = c => {
  const a = [c.x, c.y], d = D[c.r];
  return [a, c.t == 'G' ? a : [c.x + d[0] * 3, c.y + d[1] * 3]];
};
const K = p => p[0] + ',' + p[1];

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

// Dijkstra di grid: ortogonal, menghindari badan komponen, kaki komponen lain, dan ujung kabel lain
function route(a, b, ex) {
  const ka = K(a), kb = K(b);
  if (ka == kb) return [a];
  const blk = new Set(), pen = new Set(), xs = [a[0], b[0]], ys = [a[1], b[1]], bk = (x, y) => blk.add(x + ',' + y);
  for (const c of S.comps) {
    const d = D[c.r];
    if (c.t == 'G') bk(c.x - d[1], c.y + d[0]);
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

function build() {
  const par = {}, f = k => par[k] === k ? k : (par[k] = f(par[k])), add = k => { if (!(k in par)) par[k] = k; };
  S.comps.forEach(c => term(c).forEach(p => add(K(p))));
  S.wires.forEach(w => { add(K(w[0])); add(K(w[1])); par[f(K(w[0]))] = f(K(w[1])); });
  for (const p of [...S.comps.flatMap(term), ...WP()]) {
    for (const w of S.wires) {
      if (onSeg(p, w[0], w[1])) par[f(K(p))] = f(K(w[0]));
    }
  }
  S.comps.forEach(c => { c.v = 0; c.i = 0; c.vd = 0; });
  S.t = 0; scopeReset();
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
    els: S.comps.filter(c => c.t != 'G').map(c => {
      const [a, b] = term(c), e = { c, a: nd(a), b: nd(b) };
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
    else { c.i = x[e.k]; c.v = -v; continue; }
    c.v = v;
  }
  S.t += dt;
}
