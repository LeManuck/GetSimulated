// GetSimulated: editor. Interaksi kanvas (zoom, geser, pilih, kabel), undo/redo, simpan/muat, dan pintasan keyboard.
// Memakai variabel global dari core.js dan scope.js.

const dseg = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l)) : 0;
  return Math.hypot(px - x1 - t * dx, py - y1 - t * dy);
};

const hit = (px, py) => S.comps.find(c => {
  const [a, b] = term(c);
  return dseg(px, py, a[0] * G, a[1] * G, b[0] * G, b[1] * G) < (c.t == 'G' ? 16 : 12);
});

const wp = e => {
  const r = cv.getBoundingClientRect();
  return [(e.clientX - r.left - V.x) / V.z, (e.clientY - r.top - V.y) / V.z];
};

function zoom(k, X, Y) {
  const r = cv.getBoundingClientRect();
  const px = X == null ? r.width / 2 : X - r.left;
  const py = Y == null ? r.height / 2 : Y - r.top;
  const nz = Math.max(.4, Math.min(3, V.z * k));
  const f = nz / V.z;
  V.x = px - (px - V.x) * f;
  V.y = py - (py - V.y) * f;
  V.z = nz;
}

cv.addEventListener('wheel', e => {
  e.preventDefault();
  zoom(e.deltaY < 0 ? 1.1 : .9, e.clientX, e.clientY);
}, { passive: false });

function setTool(t) {
  if (t === 'del') {
    del();
    return;
  }
  S.tool = t;
  S.pv = null;
  S.wd = null;
  ui();
}

// Pegangan kabel terpilih: ujung 1/2 (pin), titik tekuk, dan titik tengah tiap garis lurus
const R_END = 11, R_MID = 9;
function wireHandle(px, py) {
  const L = S.links[S.sw];
  if (!L || !L.pts) return null;
  const P = L.pts, n = P.length;
  const d = (x, y) => Math.hypot(px - x * G, py - y * G);
  if (d(P[0][0], P[0][1]) < R_END) return { kind: 'end', end: 0 };
  if (d(P[n - 1][0], P[n - 1][1]) < R_END) return { kind: 'end', end: 1 };
  for (let i = 1; i < n - 1; i++) if (d(P[i][0], P[i][1]) < R_END) return { kind: 'corner', idx: i };
  for (let i = 0; i < n - 1; i++) {
    if (d((P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2) < R_MID) return { kind: 'mid', seg: i };
  }
  return null;
}

cv.addEventListener('pointerdown', e => {
  const [px, py] = wp(e);
  const gx = Math.round(px / G);
  const gy = Math.round(py / G);
  S.ptag = null;

  // Mode menaruh komponen (setelah Pick Parts)
  if (S.tool != 'sel') {
    snap();
    const c = { id: ++S.nid, t: S.tool, x: gx, y: gy, r: S.rot, val: S.pv ?? T[S.tool].v, f: T[S.tool].f, on: true, ct: S.tool == 'C' ? 'elco' : undefined };
    S.comps.push(c);
    S.sel = c;
    S.sw = null;
    build();
    setTool('sel');
    return;
  }

  // 0. Kabel terpilih: pegangan ujung / tekukan / titik tengah diutamakan
  if (S.sw != null) {
    const h = wireHandle(px, py);
    if (h) {
      if (h.kind == 'end') S.we = { lid: S.sw, end: h.end, cur: [px, py], tg: null, path: null, key: '' };
      else if (h.kind == 'corner') S.wc = { lid: S.sw, idx: h.idx };
      else S.wm = { lid: S.sw, seg: h.seg, x0: px, y0: py };
      return;
    }
  }

  // 1. Tekan di pin komponen -> tampilkan nama pin dan mulai tarik kabel baru
  const th = near(px, py);
  if (th) {
    S.sel = null;
    S.sw = null;
    S.ptag = { c: th.c, t: th.t, until: Infinity };
    S.wd = { c: th.c, t: th.t, from: th.p, cur: [px, py], tg: null, path: null, key: '' };
    ui();
    return;
  }

  // 2. Tekan di komponen -> pilih dan siap digeser
  const c = hit(px, py);
  if (c) {
    const chg = c !== S.sel;
    S.sel = c;
    if (chg) scopeReset();
    S.sw = null;
    S.drag = { c, o: [gx - c.x, gy - c.y] };
    ui();
    return;
  }

  // 3. Tekan di kabel -> pilih; area kosong -> geser tampilan
  const w = S.wires.find(w => dseg(px, py, w[0][0] * G, w[0][1] * G, w[1][0] * G, w[1][1] * G) < 10);
  S.sel = null;
  S.sw = w ? w[2] : null;
  if (!w) S.pan = { x: e.clientX, y: e.clientY, vx: V.x, vy: V.y };
  ui();
});

addEventListener('pointermove', e => {
  if (S.pan) {
    V.x = S.pan.vx + e.clientX - S.pan.x;
    V.y = S.pan.vy + e.clientY - S.pan.y;
    return;
  }
  const w = S.wd;
  if (w) {
    const [px, py] = wp(e);
    w.cur = [px, py];
    const tg = target(px, py, w.c, w.t), k = tg ? JSON.stringify(tg.p) : '';
    if (k != w.key) {
      w.key = k;
      w.tg = tg;
      w.path = tg ? route(w.from, tg.p) : null;
    }
    return;
  }
  // Menggeser ujung kabel: pratinjau rute otomatis ke pin tujuan
  const we = S.we;
  if (we) {
    const [px, py] = wp(e);
    we.cur = [px, py];
    const L = S.links[we.lid];
    if (!L) return;
    const other = we.end == 0 ? L.pts[L.pts.length - 1] : L.pts[0];
    const tg = target(px, py, null, -1, we.lid), k = tg ? JSON.stringify(tg.p) : '';
    if (k != we.key) {
      we.key = k;
      we.tg = tg;
      we.path = tg ? route(other, tg.p, we.lid) : null;
    }
    return;
  }
  // Menyeret titik tengah: sisipkan titik tekuk baru lalu lanjut menggesernya
  const wm = S.wm;
  if (wm) {
    const [px, py] = wp(e);
    if (Math.hypot(px - wm.x0, py - wm.y0) < 6) return;
    const L = S.links[wm.lid];
    if (!L) return;
    snap();
    L.pts.splice(wm.seg + 1, 0, [Math.round(px / G), Math.round(py / G)]);
    rebuildWires();
    S.wc = { lid: wm.lid, idx: wm.seg + 1, s: 1 };
    S.wm = null;
    return;
  }
  // Menggeser titik tekuk
  const wc = S.wc;
  if (wc) {
    const [px, py] = wp(e);
    const L = S.links[wc.lid];
    if (!L) return;
    const p = L.pts[wc.idx], gx = Math.round(px / G), gy = Math.round(py / G);
    if (p[0] != gx || p[1] != gy) {
      if (!wc.s) { wc.s = 1; snap(); }
      p[0] = gx;
      p[1] = gy;
    }
    return;
  }
  const d = S.drag;
  if (d) {
    const [px, py] = wp(e);
    const nx = Math.round(px / G) - d.o[0], ny = Math.round(py / G) - d.o[1];
    if (nx == d.c.x && ny == d.c.y) return;
    if (!d.s) { d.s = 1; snap(); }
    d.c.x = nx; d.c.y = ny;
    reroute(linksOf(d.c.id));
    build();
    return;
  }
  if (e.target === cv) {
    const [px, py] = wp(e), h = near(px, py);
    S.hv = h ? h.p : null;
    cv.style.cursor = h ? 'crosshair' : '';
  }
});

addEventListener('pointerup', () => {
  // Nama pin tetap terlihat sebentar setelah pin dilepas
  if (S.ptag && S.ptag.until === Infinity) S.ptag.until = performance.now() + 2500;
  const w = S.wd, we = S.we, wc = S.wc;
  S.wd = S.we = S.wc = S.wm = null;
  S.drag = S.pan = null;

  // Kabel baru dari pin ke pin
  if (w && w.tg) {
    const a = { c: w.c.id, t: w.t };
    const b = w.tg.c != null ? { c: w.tg.c, t: w.tg.t } : { p: w.tg.p };
    const pa = lp(a), pb = lp(b);
    if (K(pa) == K(pb)) { note('Sudah terhubung'); return; }
    snap();
    const id = ++S.nid;
    S.links[id] = { a, b };
    reroute([id]);
    S.sw = id;
    S.sel = null;
    build();
    ui();
    note('Kabel tersambung');
  } else if (w) {
    note('Lepas di pin komponen tujuan untuk menyambung');
  }

  // Ujung kabel dipindah ke pin lain: kabel diroute ulang otomatis
  if (we) {
    const L = S.links[we.lid];
    if (!L) return;
    if (we.tg) {
      const spec = we.tg.c != null ? { c: we.tg.c, t: we.tg.t } : { p: we.tg.p };
      const key = we.end == 0 ? 'a' : 'b', old = L[key];
      const same = old.c != null ? (old.c == spec.c && old.t == spec.t) : (spec.c == null && old.p[0] == spec.p[0] && old.p[1] == spec.p[1]);
      if (same) { note('Ujung kabel tetap di pin semula'); return; }
      const trial = { a: L.a, b: L.b };
      trial[key] = spec;
      if (K(lp(trial.a)) == K(lp(trial.b))) { note('Kedua ujung kabel tidak boleh di pin yang sama'); return; }
      snap();
      L[key] = spec;
      reroute([we.lid]);
      build();
      ui();
      note('Kabel dipindah ke pin baru');
    } else {
      note('Lepas di pin tujuan untuk memindah kabel');
    }
  }

  // Titik tekuk selesai digeser: titik yang kembali lurus menyatu lagi
  if (wc) {
    const L = S.links[wc.lid];
    if (L && wc.s) {
      tidy(L);
      rebuildWires();
      build();
      ui();
    }
  }
});

const state = () => JSON.stringify({ c: S.comps, l: S.links, n: S.nid });

const snap = () => {
  S.U.push(state());
  if (S.U.length > 50) S.U.shift();
  S.R = []; // Clear redo stack on new action
};

const note = t => {
  S.note = t;
  setTimeout(() => { S.note = ''; }, 2500);
};

function restore(j) {
  const o = JSON.parse(j);
  S.comps = o.c;
  S.links = o.l || {};
  S.nid = Math.max(S.nid, o.n || 0);
  S.comps.forEach(c => { if (c.id == null) c.id = ++S.nid; });
  // Simpanan lama: segmen kabel tunggal diubah menjadi tautan dengan ujung bebas
  (o.w || []).forEach(w => {
    if (w[2] == null || !S.links[w[2]]) {
      const id = ++S.nid;
      S.links[id] = { a: { p: [w[0][0], w[0][1]] }, b: { p: [w[1][0], w[1][1]] }, pts: [[w[0][0], w[0][1]], [w[1][0], w[1][1]]] };
    }
  });
  S.wires = [];
  rebuildWires();
  for (const id in S.links) {
    const L = S.links[id];
    if (!L.pts) {
      const a = lp(L.a), b = lp(L.b);
      if (!a || !b) { delete S.links[id]; continue; }
      L.pts = route(a, b, +id).map(p => [p[0], p[1]]);
      rebuildWires();
    }
  }
  S.sel = null;
  S.sw = null;
  S.drag = S.wd = S.we = S.wc = S.wm = null;
  build();
  ui();
}

function undo() {
  if (S.U.length) {
    S.R.push(state());
    if (S.R.length > 50) S.R.shift();
    restore(S.U.pop());
    note('Undo');
  } else {
    note('Tidak ada yang bisa di-undo');
  }
}

function redo() {
  if (S.R.length) {
    S.U.push(state());
    if (S.U.length > 50) S.U.shift();
    restore(S.R.pop());
    note('Redo');
  } else {
    note('Tidak ada yang bisa di-redo');
  }
}

function save() {
  try {
    localStorage.setItem('getsim', state());
    note('Rangkaian tersimpan di browser');
  } catch (e) {
    note('Gagal menyimpan');
  }
}

function load() {
  try {
    const j = localStorage.getItem('getsim');
    if (j) { snap(); restore(j); note('Rangkaian berhasil dimuat'); }
    else note('Belum ada simpanan');
  } catch (e) {
    note('Gagal memuat');
  }
}

function rot() {
  S.rot = (S.rot + 1) % 4;
  if (S.sel) { snap(); S.sel.r = S.rot; reroute(linksOf(S.sel.id)); build(); }
  ui();
}

function del() {
  if (S.sel) {
    snap();
    linksOf(S.sel.id).forEach(k => delete S.links[k]);
    S.comps.splice(S.comps.indexOf(S.sel), 1);
    S.sel = null;
    rebuildWires();
    build();
    ui();
    note('Komponen dihapus');
  } else if (S.sw != null) {
    snap();
    delete S.links[S.sw];
    S.sw = null;
    rebuildWires();
    build();
    ui();
    note('Kabel dihapus');
  } else {
    note('Pilih komponen atau kabel terlebih dahulu untuk dihapus');
  }
}

function exm(i) {
  snap();
  S.comps = []; S.wires = []; S.links = {};
  EX[i][1].forEach(([t, x, y, r, v, f]) => S.comps.push({ id: ++S.nid, t, x, y, r, val: v ?? T[t].v, f: f ?? T[t].f, on: true, v: 0, i: 0, vd: 0, ct: t == 'C' ? 'elco' : undefined }));
  EX[i][2].forEach(([a, ta, b, tb]) => {
    const id = ++S.nid;
    S.links[id] = { a: { c: S.comps[a].id, t: ta }, b: { c: S.comps[b].id, t: tb } };
    reroute([id]);
  });
  S.sel = null;
  S.sw = null;
  V.z = 1; V.x = V.y = 0;
  build();
  ui();
}

addEventListener('keydown', e => {
  if (e.key == 'Escape') {
    pick(0);
    $('#modal-help').hidden = true;
    S.wd = S.we = S.wc = S.wm = null;
    if (S.tool != 'sel') setTool('sel');
  }
  if (!$('#pk').hidden || !$('#modal-help').hidden || e.target.tagName == 'INPUT' || e.target.tagName == 'SELECT') return;
  if (e.key == 'v' || e.key == 'V') setTool('sel');
  if (e.key == 'r' || e.key == 'R') rot();
  if (e.key == ' ' || e.code == 'Space') { e.preventDefault(); S.run = !S.run; ui(); }
  if ((e.ctrlKey || e.metaKey) && (e.key == 'y' || e.key == 'Y' || (e.shiftKey && (e.key == 'z' || e.key == 'Z')))) {
    e.preventDefault();
    redo();
  } else if ((e.ctrlKey || e.metaKey) && (e.key == 'z' || e.key == 'Z')) {
    e.preventDefault();
    undo();
  }
  if (e.key == 'Delete' || e.key == 'Backspace') del();
});
