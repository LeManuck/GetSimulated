// GetSimulated: osiloskop digital (akuisisi, pemicu, Autoset, dan gambar layar).
// Memakai variabel global dari core.js ($, S, fmt, sc, sx, DPR).

// ---------- Osiloskop digital ----------
// Diperoleh seperti DSO sungguhan: sampel masuk ke buffer pra-pemicu; saat sinyal melewati level pemicu
// (tepi naik/turun) satu bingkai 600 titik ditangkap dengan titik pemicu di tengah layar. Bingkai hanya
// diperbarui saat ada pemicu, jadi sinyal berulang tampil diam. Mode Auto menggambar sendiri bila tidak ada pemicu.
const VD = [.01, .02, .05, .1, .2, .5, 1, 2, 5, 10, 20, 50];
const TD = [1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, .1, .2, .5];
const SC = {
  vdiv: 2, tdiv: .01, pos: 0, lv: 0, edge: 0, mode: 'auto', // pengaturan pengguna (pos dan lv dalam satuan div layar)
  N: 600, st: 'arm', // st: arm (menunggu pemicu), acq (menangkap), stop
  pre: [], fr: null, frame: null, meas: null, cnt: 0, hit: false, trigd: false, sh: 0, fsh: 0,
  Tp: 0, pt: 0, pv: 0, nx: 0
};

// Tegangan level pemicu: lv adalah posisi di layar (div), dikonversi memperhitungkan Posisi Y
const scopeLevel = () => (SC.lv - SC.pos) * SC.vdiv;

function scopeReset() {
  const H = SC.N >> 1;
  SC.Tp = SC.tdiv * 10 / SC.N;
  SC.pre = new Array(H).fill(NaN); // belum ada data sebelum simulasi dimulai
  SC.fr = null; SC.frame = null; SC.meas = null;
  SC.cnt = 0; SC.trigd = false; SC.sh = SC.fsh = 0;
  SC.st = 'arm';
  SC.pt = S.t;
  SC.pv = S.sel ? S.sel.v : 0;
  SC.nx = S.t + SC.Tp;
  scopeUi();
}

function scopeMeas(fr) {
  let mn = Infinity, mx = -Infinity;
  for (const v of fr) if (isFinite(v)) { if (v < mn) mn = v; if (v > mx) mx = v; }
  const mid = (mn + mx) / 2, ix = [];
  for (let i = 1; i < fr.length; i++) if (fr[i - 1] < mid && fr[i] >= mid) ix.push(i);
  const vpp = mx - mn;
  const f = vpp > 1e-6 && ix.length >= 2 ? (ix.length - 1) / ((ix[ix.length - 1] - ix[0]) * SC.Tp) : NaN;
  return { mn, mx, vpp, f };
}

function scopePush(s) {
  const N = SC.N, H = N >> 1;
  if (SC.st == 'acq') {
    SC.fr.push(s);
    if (SC.fr.length >= N) {
      SC.frame = SC.fr; SC.fr = null;
      SC.meas = scopeMeas(SC.frame);
      SC.trigd = SC.hit; SC.fsh = SC.sh;
      SC.pre = SC.frame.slice(-H); SC.cnt = 0;
      SC.st = SC.mode == 'single' ? 'stop' : 'arm';
      if (SC.st == 'stop') scopeUi();
    }
    return;
  }
  if (SC.st == 'arm') {
    const prev = SC.pre[SC.pre.length - 1], lv = scopeLevel();
    SC.cnt++;
    const hit = SC.edge == 0 ? (prev < lv && s >= lv) : (prev > lv && s <= lv);
    // Auto: bila tidak ada pemicu selama setengah layar, gambar bingkai sendiri (seperti DSO sungguhan)
    if (hit || (SC.mode == 'auto' && SC.cnt >= H)) {
      SC.hit = hit;
      // koreksi sub-sampel: titik persilangan sebenarnya diletakkan tepat di tengah layar
      SC.sh = hit ? 1 - (lv - prev) / (s - prev) : 0;
      SC.fr = SC.pre.slice();
      SC.fr.push(s);
      SC.st = 'acq';
      return;
    }
  }
  SC.pre.push(s);
  if (SC.pre.length > H) SC.pre.shift();
}

// Dipanggil tiap langkah simulasi: ambil sampel pada laju skala osiloskop (interpolasi linear antar langkah)
function scopeFeed() {
  const c = S.sel, t1 = S.t, v1 = c.v, t0 = SC.pt, v0 = SC.pv;
  let g = 0;
  while (SC.nx <= t1 + 1e-15 && g++ < 4000) {
    const f = t1 > t0 ? (SC.nx - t0) / (t1 - t0) : 1;
    scopePush(v0 + (v1 - v0) * Math.min(1, Math.max(0, f)));
    SC.nx += SC.Tp;
  }
  if (SC.nx <= t1) SC.nx = t1 + SC.Tp;
  SC.pt = t1; SC.pv = v1;
}

function scopeUi() {
  if (!$('#sc-vdiv')) return;
  $('#sc-vdiv').value = String(SC.vdiv);
  $('#sc-tdiv').value = String(SC.tdiv);
  $('#sc-mode').value = SC.mode;
  $('#sc-edge').value = String(SC.edge);
  $('#sc-lv').value = SC.lv;
  $('#sc-pos').value = SC.pos;
  $('#sc-lv-v').textContent = fmt(scopeLevel(), 'V');
  $('#sc-pos-v').textContent = (SC.pos > 0 ? '+' : '') + (+SC.pos.toFixed(1)) + ' div';
  $('#sc-run').textContent = SC.st == 'stop' ? '▶ Run' : '⏸ Stop';
}

// Autoset: pilih Volt/div, Posisi Y, level pemicu, dan Time/div dari sinyal terakhir
function scopeAuto() {
  const c = S.sel, M = SC.meas;
  if (!c) { note('Pilih komponen dulu untuk Autoset'); return; }
  let mn = c.v, mx = c.v, f = c.t == 'A' ? c.f : NaN;
  if (M) { mn = M.mn; mx = M.mx; if (isFinite(M.f)) f = M.f; }
  const pick = (o, x) => o.find(v => v >= x * .9999) ?? o[o.length - 1];
  const span = mx - mn, mid = (mx + mn) / 2;
  let vd = pick(VD, span / 6), pos = -mid / vd;
  if (span < 1e-6 || Math.abs(pos) > 3.5) {
    vd = pick(VD, Math.max(Math.abs(mx), Math.abs(mn), 1.2) / 3);
    pos = 0;
  }
  SC.vdiv = vd;
  SC.pos = Math.round(pos * 10) / 10;
  SC.lv = Math.max(-4, Math.min(4, Math.round((mid / vd + SC.pos) * 20) / 20));
  SC.edge = 0;
  SC.mode = 'auto';
  if (isFinite(f) && f > 0) SC.tdiv = pick(TD, 0.2 / f);
  scopeReset();
  note('Autoset');
}

// Menggambar layar osiloskop: graticule 10 x 8 div, jejak, penanda pemicu / ground, dan keterangan
function drawScope() {
  sx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const SW = sc.clientWidth, SH = sc.clientHeight, dW = SW / 10, dH = SH / 8, cy = SH / 2;
  sx.clearRect(0, 0, SW, SH);

  // Graticule (garis tiap div) + sumbu tengah dengan tanda 1/5 div
  sx.lineWidth = 1;
  sx.strokeStyle = '#1b2b45';
  sx.beginPath();
  for (let i = 1; i < 10; i++) { const x = Math.round(i * dW) + .5; sx.moveTo(x, 0); sx.lineTo(x, SH); }
  for (let j = 1; j < 8; j++) { const y = Math.round(j * dH) + .5; sx.moveTo(0, y); sx.lineTo(SW, y); }
  sx.stroke();
  sx.strokeStyle = '#2f4a73';
  sx.beginPath();
  sx.moveTo(SW / 2, 0); sx.lineTo(SW / 2, SH);
  sx.moveTo(0, cy); sx.lineTo(SW, cy);
  for (let i = 0; i <= 50; i++) { const x = i * dW / 5; sx.moveTo(x, cy - 3); sx.lineTo(x, cy + 3); }
  for (let j = 0; j <= 40; j++) { const y = j * dH / 5; sx.moveTo(SW / 2 - 3, y); sx.lineTo(SW / 2 + 3, y); }
  sx.stroke();

  const c = S.sel, F = SC.frame, M = SC.meas;
  const clampY = y => Math.max(7, Math.min(SH - 7, y));
  const ty = cy - SC.lv * dH, gy = cy - SC.pos * dH;

  // Garis dan penanda level pemicu (kanan), penanda ground/0V (kiri), penanda posisi pemicu (atas tengah)
  if (c) {
    sx.save();
    sx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    sx.setLineDash([3, 4]);
    sx.beginPath(); sx.moveTo(0, ty); sx.lineTo(SW, ty); sx.stroke();
    sx.restore();
    sx.fillStyle = '#fbbf24';
    sx.beginPath();
    sx.moveTo(SW, clampY(ty)); sx.lineTo(SW - 9, clampY(ty) - 5); sx.lineTo(SW - 9, clampY(ty) + 5);
    sx.closePath(); sx.fill();
    sx.beginPath();
    sx.moveTo(SW / 2, 8); sx.lineTo(SW / 2 - 5, 0); sx.lineTo(SW / 2 + 5, 0);
    sx.closePath(); sx.fill();
    sx.fillStyle = '#38bdf8';
    sx.beginPath();
    sx.moveTo(0, clampY(gy)); sx.lineTo(9, clampY(gy) - 5); sx.lineTo(9, clampY(gy) + 5);
    sx.closePath(); sx.fill();
  }

  // Jejak: titik pemicu (indeks tengah) ada di tengah layar; fsh = koreksi sub-sampel
  if (c && F) {
    const n = F.length;
    sx.save();
    sx.strokeStyle = '#38bdf8';
    sx.shadowColor = '#38bdf8';
    sx.shadowBlur = 5;
    sx.lineWidth = 1.8;
    sx.lineJoin = 'round';
    sx.beginPath();
    let pen = false;
    for (let i = 0; i < n; i++) {
      const v = F[i];
      if (!isFinite(v)) { pen = false; continue; }
      const x = (i + SC.fsh) / (n - 1) * SW;
      const y = Math.max(-40, Math.min(SH + 40, cy - (v / SC.vdiv + SC.pos) * dH));
      if (pen) sx.lineTo(x, y); else { sx.moveTo(x, y); pen = true; }
    }
    sx.stroke();
    sx.restore();
  } else {
    sx.save();
    sx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    sx.fillStyle = '#64748b';
    sx.textAlign = 'center';
    sx.fillText(!c ? 'Pilih komponen untuk melihat sinyal gelombang' : (SC.st == 'stop' ? 'Berhenti' : 'Menunggu pemicu…'), SW / 2, cy - 14);
    sx.restore();
  }

  // Keterangan: status, skala, dan hasil ukur dari bingkai terakhir
  const state = !c ? 'STANDBY' : !S.run ? 'PAUSE' : SC.st == 'stop' ? 'STOP' : !F ? (SC.mode == 'auto' ? 'AUTO' : 'WAIT') : SC.trigd ? "TRIG'D" : 'AUTO';
  $('#dso-state').textContent = 'CH1 · ' + state;
  $('#dso-stat').textContent = fmt(SC.vdiv, 'V') + '/div · ' + fmt(SC.tdiv, 's') + '/div';
  let foot = '--';
  if (c && M) {
    foot = `Vpp ${fmt(M.vpp, 'V')} · Max ${fmt(M.mx, 'V')} · Min ${fmt(M.mn, 'V')}` + (isFinite(M.f) ? ` · ${fmt(M.f, 'Hz')}` : '');
    if (M.mx / SC.vdiv + SC.pos > 4.05 || M.mn / SC.vdiv + SC.pos < -4.05) foot += ' · ⚠ di luar layar, coba Autoset';
  }
  if (c && SC.tdiv < 4 * S.dt) foot += ' · ⚠ time/div terlalu cepat untuk dt';
  $('#dso-foot').textContent = foot;
}
