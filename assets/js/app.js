// GetSimulated: aplikasi. Toolbar, Pick Parts, panel Inspektor, gambar kanvas, loop simulasi, dan boot.
// Dimuat paling akhir; memakai variabel global dari core.js, scope.js, dan editor.js.

// Render Tools (kabel dibuat dengan seret dari pin, jadi tidak ada alat Kabel)
const TOOLS = [
  ['sel', 'Pilih', 'V'],
  ['rot', 'Putar', 'R'],
  ['del', 'Hapus', 'Del']
];

$('#main-tools').innerHTML = TOOLS.map(([k, n, kbd]) => {
  if (k == 'rot') {
    return `<button class="tool-btn" onclick="rot()" title="Putar Komponen Terpilih (R)">${ico(k, 18)}<span>${n}</span><kbd>${kbd}</kbd></button>`;
  }
  if (k == 'del') {
    return `<button class="tool-btn" onclick="del()" title="Hapus Komponen / Kabel Terpilih (Del)">${ico(k, 18)}<span>${n}</span><kbd>${kbd}</kbd></button>`;
  }
  return `<button class="tool-btn" data-k="${k}" onclick="setTool('${k}')" title="${n} (${kbd})">${ico(k, 18)}<span>${n}</span><kbd>${kbd}</kbd></button>`;
}).join('');

$('#ex').innerHTML = '<option value="">Contoh rangkaian…</option>' + EX.map((e, i) => `<option value="${i}">${e[0]}</option>`).join('');
$('#ex').onchange = e => { if (e.target.value !== '') exm(+e.target.value); e.target.value = ''; };

$('#dt').onchange = e => S.dt = +e.target.value;

$('#run').onclick = () => { S.run = !S.run; ui(); };

$('#btn-help').onclick = () => { $('#modal-help').hidden = !$('#modal-help').hidden; };

$('#th').onclick = () => {
  const d = document.documentElement;
  const cur = d.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  d.dataset.theme = cur === 'dark' ? 'light' : 'dark';
};

// Kontrol osiloskop
$('#sc-vdiv').innerHTML = VD.map(v => `<option value="${v}">${fmt(v, 'V')}</option>`).join('');
$('#sc-tdiv').innerHTML = TD.map(v => `<option value="${v}">${fmt(v, 's')}</option>`).join('');
$('#sc-vdiv').onchange = e => { SC.vdiv = +e.target.value; scopeUi(); };
$('#sc-tdiv').onchange = e => { SC.tdiv = +e.target.value; scopeReset(); };
$('#sc-mode').onchange = e => { SC.mode = e.target.value; scopeUi(); };
$('#sc-edge').onchange = e => { SC.edge = +e.target.value; };
$('#sc-lv').oninput = e => { SC.lv = +e.target.value; scopeUi(); };
$('#sc-pos').oninput = e => { SC.pos = +e.target.value; scopeUi(); };
$('#sc-run').onclick = () => {
  if (SC.st == 'stop') { SC.st = 'arm'; SC.cnt = 0; }
  else { SC.st = 'stop'; SC.fr = null; }
  scopeUi();
};
$('#sc-auto').onclick = scopeAuto;

const CATS = ['Semua', 'Daya', 'Pasif', 'Semikonduktor', 'Kontrol'];

// Satukan varian LED dan Dioda menjadi 1 entri per komponen di daftar pemilihan
const PARTS = [
  ['V', 'Baterai', 'Daya', 'baterai battery aki dc catu daya sumber tegangan power'],
  ['A', 'Sumber AC', 'Daya', 'ac sinus generator listrik bolak balik power'],
  ['G', 'GND', 'Daya', 'ground tanah referensi nol'],
  ['R', 'Resistor', 'Pasif', 'hambatan ohm resistance'],
  ['C', 'Kapasitor', 'Pasif', 'kondensator capacitor farad elco elektrolit electrolytic keramik ceramic tantalum film mylar mkt'],
  ['L', 'Induktor', 'Pasif', 'kumparan inductor coil henry'],
  ['D', 'LED', 'Semikonduktor', 'lampu led light diode emisi cahaya merah kuning hijau biru'],
  ['J', 'Dioda', 'Semikonduktor', 'diode penyearah 1n4148 1n4007 schottky 1n5819 bat54'],
  ['S', 'Saklar', 'Kontrol', 'switch tombol on off saklar switch']
];

let Q = '', CT = 'Semua';

function pick(o) {
  $('#pk').hidden = !o;
  if (o) {
    $('#q').value = Q = '';
    CT = 'Semua';
    rp();
    setTimeout(() => $('#q').focus(), 50);
  }
}

function rp() {
  $('#cc').innerHTML = CATS.map(c => `<button class="${c == CT ? 'on' : ''}" onclick="CT='${c}';rp()">${c}</button>`).join('');
  const q = Q.toLowerCase().trim();
  const L = PARTS.map((p, i) => [p, i]).filter(([p]) => (CT == 'Semua' || p[2] == CT) && (!q || (p[1] + ' ' + p[2] + ' ' + p[3]).toLowerCase().includes(q)));
  $('#pl').innerHTML = L.length ? L.map(([p, i]) => `
    <button class="part-card" onclick="usePart(${i})">
      ${ico(p[0], 24)}
      <div class="part-card-info">
        <b>${p[1]}</b>
        <small>${p[2]}</small>
      </div>
    </button>`).join('') : '<p style="color:var(--mu); padding:10px;">Tidak ada komponen yang cocok.</p>';
}

function rcb() {
  $('#rc').innerHTML = S.rc.map(i => {
    const p = PARTS[i];
    return `<button class="part-recent-btn" onclick="usePart(${i})">${ico(p[0], 18)} <span>${p[1]}</span> <small>${p[2]}</small></button>`;
  }).join('');
}

function usePart(i) {
  const p = PARTS[i];
  S.tool = p[0];
  S.pv = null; // Default value based on component
  S.wd = null;
  S.rc = [i, ...S.rc.filter(x => x != i)].slice(0, 4);
  pick(0);
  rcb();
  ui();
}

$('#q').oninput = e => { Q = e.target.value; rp(); };
$('#pk').onclick = e => { if (e.target.id == 'pk') pick(0); };
$('#modal-help').onclick = e => { if (e.target.id == 'modal-help') $('#modal-help').hidden = true; };

$('#vw').onclick = () => { S.real = !S.real; ui(); };

const pinName = e => {
  if (e.c == null) return 'titik di kabel lain';
  const c = cb(e.c);
  return c ? `${T[c.t].n} (${pinInfo(c, e.t)[0]})` : '?';
};

function ui() {
  document.querySelectorAll('#main-tools [data-k]').forEach(b => b.classList.toggle('on', b.dataset.k == S.tool));
  $('#run-icon').textContent = S.run ? '⏸' : '▶';
  $('#run-label').textContent = S.run ? 'Jeda' : 'Jalan';
  $('#run').classList.toggle('pri', S.run);
  $('#clock-pill').classList.toggle('paused', !S.run);
  $('#vw-label').textContent = S.real ? 'Gambar' : 'Skema';

  const c = S.sel, w = S.sw, p = $('#pn');

  if (!c && w == null) {
    $('#dso-comp-badge').textContent = '-';
    p.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Panduan Cepat
          </span>
        </div>
        <div class="guide-box">
          Tekan <strong>Pick Parts</strong> untuk memilih komponen, lalu klik di kanvas untuk menaruhnya.
          <ul class="guide-list">
            <li><b>Tekan dan seret dari pin</b> (titik biru di ujung komponen) ke pin komponen lain untuk menyambung kabel.</li>
            <li>Klik kabel untuk memilihnya: <b>seret titik tengah garis untuk menekuk</b>, atau seret ujungnya ke pin lain. Tekan <strong>Hapus (Del)</strong> untuk menghapus.</li>
            <li>Rangkaian yang salah (korsleting, kapasitor terbalik, tanpa resistor) membuat komponen <b>panas lalu meledak</b>.</li>
          </ul>
        </div>
      </div>`;
    return;
  }

  // Selected Wire Inspector
  if (!c && w != null) {
    $('#dso-comp-badge').textContent = 'Kabel';
    const L = S.links[w];
    p.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">${ico('wire', 18)} Kabel Terpilih</span>
          <span style="font-size:11px; padding:2px 8px; border-radius:999px; background:var(--ac-subtle); color:var(--ac); font-weight:600;">Kabel</span>
        </div>
        <div class="guide-box">
          ${L ? `Dari: <b>${pinName(L.a)}</b><br>Ke: <b>${pinName(L.b)}</b>` : 'Segmen kabel dari simpanan lama.'}
          <small style="color:var(--mu); display:block; margin-top:8px;">
            Seret titik di tengah garis untuk menekuk kabel. Seret ujung kabel ke pin lain untuk memindahkannya.
          </small>
        </div>
        <div style="margin-top:12px;">
          <button style="width:100%; border-color:var(--er); color:var(--er); font-weight:600;" onclick="del()">
            Hapus Kabel (Del)
          </button>
        </div>
      </div>`;
    return;
  }

  // Selected Component Inspector
  const t = T[c.t];
  $('#dso-comp-badge').textContent = t.n;
  const labelPreset = c.t == 'D' ? 'Warna LED' : c.t == 'J' ? 'Tipe Dioda' : 'Nilai Preset';

  let h = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">${ico(c.t, 18)} ${t.n}</span>
        <span style="font-size:11px; padding:2px 8px; border-radius:999px; background:var(--ac-subtle); color:var(--ac); font-weight:600;">Terpilih</span>
      </div>`;

  if (c.dead) {
    h += `<div class="dead-box"><b>💥 Komponen rusak</b><br>${t.n} ${c.why}.<br>Perbaiki rangkaian, lalu tekan <b>Reset Simulasi</b>.</div>`;
  }
  h += '<div class="prop-group">';

  if (c.t == 'S') {
    h += `<button class="${c.on ? 'on' : ''}" style="width:100%; min-height:36px;" onclick="S.sel.on=!S.sel.on;ui()">
            Status: ${c.on ? 'Tertutup (ON / Terhubung)' : 'Terbuka (OFF / Putus)'}
          </button>`;
  } else if (c.t == 'C') {
    // Kapasitor: selector hanya untuk tipe; kapasitansi diketik manual (bawaan 10µF)
    const ck = capKey(c);
    h += `<div class="prop-row">
            <label>Tipe</label>
            <select id="ctp">
              ${Object.keys(CAPT).map(k => `<option value="${k}" ${k == ck ? 'selected' : ''}>${CAPT[k].n}</option>`).join('')}
            </select>
          </div>
          <div class="prop-row">
            <label>Kapasitansi</label>
            <input id="iv" value="${fmt(c.val, '')}" placeholder="Contoh: 10u, 470n, 100p">
            <span style="font-weight:600; min-width:20px;">${t.u}</span>
          </div>`;
  } else if (c.t != 'G') {
    const m = t.p.includes(c.val);
    h += `<div class="prop-row">
            <label>${labelPreset}</label>
            <select id="sv">
              ${t.p.map((v, i) => `<option value="${v}" ${v == c.val ? 'selected' : ''}>${t.nm ? t.nm[i] + ' ' : ''}${fmt(v, t.u)}</option>`).join('')}
              <option value="x" ${m ? '' : 'selected'}>Kustom</option>
            </select>
          </div>
          <div class="prop-row">
            <label>Input Nilai</label>
            <input id="iv" value="${fmt(c.val, '')}" placeholder="Contoh: 10k, 4.7u">
            <span style="font-weight:600; min-width:20px;">${t.u}</span>
          </div>`;
    if (c.t == 'A') {
      h += `<div class="prop-row">
              <label>Frekuensi</label>
              <select id="fv">
                ${t.fp.map(v => `<option value="${v}" ${v == c.f ? 'selected' : ''}>${fmt(v, 'Hz')}</option>`).join('')}
              </select>
            </div>`;
    }
  }

  // Indikator suhu kecil di dekat pengaturan nilai komponen (diperbarui tiap bingkai di loop())
  if (TH[c.t]) {
    h += `<div class="temp-row" title="Suhu komponen">
            <label>Suhu</label>
            <div class="temp-bar"><i id="tf"></i></div>
            <b id="tt">${Math.round(c.T ?? TAMB)}°C</b>
          </div>
          <div class="temp-note" id="tl"></div>`;
  }
  h += '</div>';

  if (c.t != 'G') {
    h += `
      <div class="dmm-grid">
        <div class="dmm-card"><small>Tegangan (V)</small><b id="rv">0V</b></div>
        <div class="dmm-card"><small>Arus (I)</small><b id="ri">0A</b></div>
        <div class="dmm-card"><small>Daya (P)</small><b id="rp">0W</b></div>
      </div>`;
  }

  h += `
    <div style="display:flex; gap:6px; margin-top:10px;">
      <button style="flex:1;" onclick="rot()" title="Putar 90° (R)">↻ Putar (R)</button>
      <button style="flex:1; border-color:var(--er); color:var(--er); font-weight:600;" onclick="del()" title="Hapus (Del)">Hapus (Del)</button>
    </div>
  </div>`;

  p.innerHTML = h;

  if ($('#sv')) {
    $('#sv').onchange = e => {
      if (e.target.value != 'x') { snap(); c.val = +e.target.value; ui(); }
      else $('#iv').focus();
    };
  }
  if ($('#iv')) {
    $('#iv').onchange = e => {
      const v = parse(e.target.value);
      if (v > 0) { snap(); c.val = v; }
      ui();
    };
  }
  if ($('#fv')) $('#fv').onchange = e => { c.f = +e.target.value; ui(); };
  if ($('#ctp')) $('#ctp').onchange = e => { snap(); c.ct = e.target.value; ui(); };
}

function fit() {
  cv.width = cv.clientWidth * DPR;
  cv.height = cv.clientHeight * DPR;
  sc.width = sc.clientWidth * DPR;
  sc.height = sc.clientHeight * DPR;
}
new ResizeObserver(fit).observe(cv);
new ResizeObserver(fit).observe(sc);

const LED = c => c.val >= 2.8 ? '77,163,255' : c.val >= 2.05 ? '67,224,107' : c.val >= 1.95 ? '255,200,30' : '255,59,59';
const BC = ['#111', '#7a4a21', '#d32f2f', '#f57c00', '#fbc02d', '#2e7d32', '#1976d2', '#7b1fa2', '#808080', '#fff'];

function real(c, L, m) {
  const ld = (a, b) => {
    cx.save(); cx.shadowBlur = 0; cx.strokeStyle = '#98a2b3'; cx.lineWidth = 2.5;
    cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(a, 0); cx.moveTo(b, 0); cx.lineTo(L, 0);
    cx.stroke(); cx.restore();
  };
  const rr = (x, y, w, h, r, f) => {
    cx.beginPath(); cx.roundRect(x, y, w, h, r); cx.fillStyle = f; cx.fill();
  };
  const t = c.t;

  if (t == 'R') {
    ld(20, 52); rr(20, -7, 32, 14, 6, '#e3c9a0'); cx.shadowBlur = 0;
    let e = Math.floor(Math.log10(c.val)), d = Math.round(c.val / 10 ** (e - 1));
    if (d >= 100) { d = 10; e++; }
    [BC[d / 10 | 0], BC[d % 10], e - 1 >= 0 ? BC[e - 1] : e == 0 ? '#c9a227' : '#b8b8b8', '#c9a227'].forEach((k, i) => {
      cx.fillStyle = k; cx.fillRect(25 + i * 7, -7, 3.5, 14);
    });
  } else if (t == 'D') {
    const a = Math.min(1, Math.max(0, c.i) / .015), r = LED(c);
    ld(m - 11, m + 11);
    if (a > .02) {
      cx.save(); cx.shadowBlur = 0; cx.fillStyle = `rgba(${r},${a * .55})`;
      cx.beginPath(); cx.arc(m, 0, 26, 0, 7); cx.fill(); cx.restore();
    }
    cx.beginPath(); cx.arc(m, 0, 11, 0, 7);
    cx.fillStyle = `rgba(${r},${.38 + .62 * a})`; cx.fill();
    cx.shadowBlur = 0; cx.strokeStyle = `rgb(${r})`; cx.lineWidth = 1.5; cx.stroke();
    cx.fillStyle = 'rgba(255,255,255,.55)';
    cx.beginPath(); cx.ellipse(m - 3, -4, 3, 2, -.6, 0, 7); cx.fill();
  } else if (t == 'J') {
    ld(m - 14, m + 14); rr(m - 14, -5, 28, 10, 2, '#2b2b2f'); cx.shadowBlur = 0;
    cx.fillStyle = '#d0d0d6'; cx.fillRect(m + 7, -5, 4, 10);
  } else if (t == 'V') {
    ld(m - 16, m + 20); rr(m - 16, -10, 32, 20, 4, '#2b2f3a'); cx.shadowBlur = 0;
    cx.fillStyle = '#ef4444'; cx.fillRect(m - 6, -10, 8, 20);
    rr(m + 16, -4, 4, 8, 1, '#c8ccd4');
  } else if (t == 'C') {
    // Tanda polaritas digambar tegak (diputar balik) agar tetap terbaca saat komponen diputar
    const lbl = (s, x, col, px) => {
      cx.save(); cx.translate(x, 0); cx.rotate(-c.r * Math.PI / 2);
      cx.font = `bold ${px}px system-ui`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillStyle = col; cx.fillText(s, 0, 0); cx.restore();
    };
    const ck = capKey(c);
    if (ck == 'elco') {
      // Elco: silinder biru, pita (−) di sisi pin 2, tanda (+) di sisi pin 1
      ld(m - 12, m + 12); rr(m - 12, -11, 24, 22, 4, '#1e3a8a'); cx.shadowBlur = 0;
      rr(m + 6, -11, 6, 22, [0, 4, 4, 0], '#cfd8e8');
      lbl('−', m + 9, '#1e3a8a', 11);
      lbl('+', m - 6, '#e2e8f0', 11);
    } else if (ck == 'cer') {
      // Keramik: cakram oranye
      ld(m - 6, m + 6); rr(m - 6, -11, 12, 22, 6, '#e0a84a'); cx.shadowBlur = 0;
      rr(m - 3, -7, 2, 14, 1, 'rgba(255,255,255,.4)');
    } else if (ck == 'tan') {
      // Tantalum: manik kuning, pita gelap dan tanda (+) di sisi pin 1
      ld(m - 9, m + 9); rr(m - 9, -9, 18, 18, 7, '#f0b429'); cx.shadowBlur = 0;
      rr(m - 9, -9, 6, 18, [7, 0, 0, 7], '#3b2a05');
      lbl('+', m - 6, '#ffffff', 10);
    } else {
      // Film / Mylar: kotak merah
      ld(m - 9, m + 9); rr(m - 9, -11, 18, 22, 3, '#d9452f'); cx.shadowBlur = 0;
      rr(m - 9, -11, 4, 22, [3, 0, 0, 3], 'rgba(255,255,255,.3)');
    }
  } else if (t == 'L') {
    ld(20, 52); rr(20, -8, 32, 16, 5, '#b87333'); cx.shadowBlur = 0;
    cx.strokeStyle = '#7a4a1c'; cx.lineWidth = 1.5; cx.beginPath();
    for (let x = 26; x < 50; x += 5) { cx.moveTo(x, -8); cx.lineTo(x, 8); }
    cx.stroke();
  } else if (t == 'A') {
    ld(m - 15, m + 15); cx.beginPath(); cx.arc(m, 0, 15, 0, 7);
    cx.fillStyle = '#e8ecf5'; cx.fill(); cx.shadowBlur = 0;
    cx.strokeStyle = '#5a6478'; cx.lineWidth = 2; cx.stroke();
    cx.strokeStyle = '#ef4444'; cx.beginPath(); cx.moveTo(m - 9, 0);
    for (let i = -9; i <= 9; i++) cx.lineTo(m + i, -6 * Math.sin(i / 9 * Math.PI));
    cx.stroke();
  } else if (t == 'S') {
    const k = c.on ? 9 : -9;
    ld(22, 50); rr(22, -6, 28, 14, 4, '#3a3f4b'); cx.shadowBlur = 0;
    cx.strokeStyle = '#e8ecf5'; cx.lineWidth = 4; cx.beginPath();
    cx.moveTo(m, 0); cx.lineTo(m + k, -12); cx.stroke();
    cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(m + k, -12, 3, 0, 7); cx.fill();
  }
  cx.beginPath();
}

function draw() {
  const st = getComputedStyle(document.documentElement);
  const fg = st.getPropertyValue('--fg').trim();
  const mu = st.getPropertyValue('--mu').trim();
  const dot = st.getPropertyValue('--dot').trim();
  const ac = st.getPropertyValue('--ac').trim();
  const wr = st.getPropertyValue('--wr').trim();
  const isDark = document.documentElement.dataset.theme == 'dark' || (matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.dataset.theme != 'light');

  cx.setTransform(1, 0, 0, 1, 0, 0);
  cx.clearRect(0, 0, cv.width, cv.height);

  cx.setTransform(DPR * V.z, 0, 0, DPR * V.z, DPR * V.x, DPR * V.y);
  cx.lineCap = cx.lineJoin = 'round';

  // Grid
  cx.fillStyle = dot;
  const W = cv.clientWidth, H = cv.clientHeight;
  const startX = Math.floor(-V.x / V.z / G), endX = Math.ceil((W - V.x) / V.z / G);
  const startY = Math.floor(-V.y / V.z / G), endY = Math.ceil((H - V.y) / V.z / G);

  for (let x = startX; x <= endX; x++) {
    for (let y = startY; y <= endY; y++) {
      const isMajor = (x % 5 === 0 && y % 5 === 0);
      const dotSize = isMajor ? 3 : 1.8;
      cx.fillRect(x * G - dotSize / 2, y * G - dotSize / 2, dotSize, dotSize);
    }
  }

  // Wires (seluruh rute satu kabel tersorot bersama)
  const sw = S.sw, dim = !!S.we;
  S.wires.forEach(w => {
    const isSel = sw != null && w[2] === sw;
    cx.beginPath();
    cx.moveTo(w[0][0] * G, w[0][1] * G);
    cx.lineTo(w[1][0] * G, w[1][1] * G);
    cx.globalAlpha = isSel && dim ? 0.3 : 1;
    if (isSel) {
      cx.strokeStyle = ac;
      cx.lineWidth = 3.6;
      cx.shadowColor = ac;
      cx.shadowBlur = 8;
    } else {
      cx.strokeStyle = wr;
      cx.lineWidth = 2.6;
      cx.shadowBlur = 0;
    }
    cx.stroke();
    cx.shadowBlur = 0;
    cx.globalAlpha = 1;
  });

  // Pegangan kabel terpilih: ujung 1 & 2 (pin), titik tekuk, titik tengah tiap garis lurus
  const SL = S.sw != null ? S.links[S.sw] : null;
  if (SL && SL.pts && !S.we) {
    const P = SL.pts, n = P.length;
    const dotAt = (x, y, r, fill, edge) => {
      cx.beginPath(); cx.arc(x * G, y * G, r, 0, 7);
      cx.fillStyle = fill; cx.fill();
      cx.strokeStyle = edge; cx.lineWidth = 2; cx.stroke();
    };
    for (let i = 0; i < n - 1; i++) dotAt((P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2, 3.5, '#ffffff', ac);
    for (let i = 1; i < n - 1; i++) dotAt(P[i][0], P[i][1], 5, ac, '#ffffff');
    dotAt(P[0][0], P[0][1], 7, '#ffffff', ac);
    dotAt(P[n - 1][0], P[n - 1][1], 7, '#ffffff', ac);
  }

  // Components
  cx.lineWidth = 2;
  const L = 3 * G, m = 1.5 * G;

  for (const c of S.comps) {
    const col = c === S.sel ? ac : TC[c.t];
    cx.strokeStyle = cx.fillStyle = col;
    cx.shadowColor = ac;
    cx.shadowBlur = c === S.sel ? 12 : 0;
    cx.save();
    cx.translate(c.x * G, c.y * G);
    cx.rotate(c.r * Math.PI / 2);

    // Cahaya oranye di belakang komponen yang mulai panas (makin terang makin dekat batas rusak)
    const th = TH[c.t];
    const hh = th && !c.dead ? Math.min(1, Math.max(0, ((c.T ?? TAMB) - 55) / (th.Tmax - 55))) : 0;
    if (hh > 0) {
      cx.save();
      cx.shadowBlur = 0;
      const gr = cx.createRadialGradient(m, 0, 4, m, 0, 34);
      gr.addColorStop(0, `rgba(255,90,20,${.55 * hh})`);
      gr.addColorStop(1, 'rgba(255,90,20,0)');
      cx.fillStyle = gr;
      cx.beginPath(); cx.arc(m, 0, 34, 0, 7); cx.fill();
      cx.restore();
    }
    cx.beginPath();

    if (S.real && c.t != 'G') real(c, L, m);
    else if (c.t == 'G') {
      cx.moveTo(0, 0); cx.lineTo(0, 10);
      cx.moveTo(-12, 10); cx.lineTo(12, 10);
      cx.moveTo(-8, 15); cx.lineTo(8, 15);
      cx.moveTo(-4, 20); cx.lineTo(4, 20);
    } else if (c.t == 'R') {
      cx.moveTo(0, 0); cx.lineTo(G, 0);
      cx.rect(G, -7, G, 14);
      cx.moveTo(2 * G, 0); cx.lineTo(L, 0);
    } else if (c.t == 'C') {
      if (ctype(c).pol) {
        // Berkutub: plat lurus (+) di pin 1, plat lengkung (−) di pin 2
        cx.moveTo(0, 0); cx.lineTo(m - 3, 0);
        cx.moveTo(m - 3, -12); cx.lineTo(m - 3, 12);
        cx.moveTo(m + 3, -12); cx.quadraticCurveTo(m + 9, 0, m + 3, 12);
        cx.moveTo(m + 6, 0); cx.lineTo(L, 0);
      } else {
        cx.moveTo(0, 0); cx.lineTo(m - 3, 0);
        cx.moveTo(m - 3, -12); cx.lineTo(m - 3, 12);
        cx.moveTo(m + 3, -12); cx.lineTo(m + 3, 12);
        cx.moveTo(m + 3, 0); cx.lineTo(L, 0);
      }
    } else if (c.t == 'L') {
      cx.moveTo(0, 0); cx.lineTo(14, 0);
      for (let i = 0; i < 4; i++) cx.arc(20 + i * 12, 0, 6, Math.PI, 0);
      cx.lineTo(L, 0);
    } else if (c.t == 'V') {
      cx.moveTo(0, 0); cx.lineTo(m - 4, 0);
      cx.moveTo(m - 4, -7); cx.lineTo(m - 4, 7);
      cx.moveTo(m + 4, -14); cx.lineTo(m + 4, 14);
      cx.moveTo(m + 4, 0); cx.lineTo(L, 0);
    } else if (c.t == 'A') {
      cx.moveTo(0, 0); cx.lineTo(m - 13, 0);
      cx.moveTo(m + 13, 0); cx.arc(m, 0, 13, 0, 7);
      cx.moveTo(m - 8, 0);
      for (let i = -8; i <= 8; i++) cx.lineTo(m + i, -6 * Math.sin(i / 8 * Math.PI));
      cx.moveTo(m + 13, 0); cx.lineTo(L, 0);
    } else if (c.t == 'D' || c.t == 'J') {
      const a = c.t == 'D' ? Math.min(1, Math.max(0, c.i) / .015) : 0;
      if (a > .02) {
        cx.fillStyle = `rgba(${LED(c)},${a * .8})`;
        cx.beginPath(); cx.arc(m, 0, 24, 0, 7); cx.fill();
        cx.fillStyle = col; cx.beginPath();
      }
      cx.moveTo(0, 0); cx.lineTo(G, 0);
      cx.moveTo(G, -10); cx.lineTo(G, 10);
      cx.lineTo(2 * G, 0); cx.closePath();
      cx.moveTo(2 * G, -10); cx.lineTo(2 * G, 10);
      cx.moveTo(2 * G, 0); cx.lineTo(L, 0);
    } else if (c.t == 'S') {
      cx.moveTo(0, 0); cx.lineTo(G, 0);
      cx.moveTo(2 * G, 0); cx.lineTo(L, 0);
      cx.moveTo(G, 0); cx.lineTo(c.on ? 2 * G : 2 * G - 4, c.on ? 0 : -14);
    }
    cx.stroke();
    cx.shadowBlur = 0;
    if (c.t == 'V' || c.t == 'A') {
      cx.font = 'bold 11px system-ui';
      cx.fillText('+', L - 10, -8);
      cx.fillText('−', 4, -8);
    }
    if (c.t == 'C' && !S.real && ctype(c).pol) {
      cx.font = 'bold 11px system-ui';
      cx.fillText('+', m - 14, -6);
    }

    // Komponen yang sudah meledak: gosong dengan tanda silang
    if (c.dead) {
      cx.save();
      cx.fillStyle = 'rgba(15,15,15,.8)';
      cx.beginPath(); cx.arc(m, 0, 15, 0, 7); cx.fill();
      cx.strokeStyle = '#f97316';
      cx.lineWidth = 2;
      cx.beginPath();
      cx.moveTo(m - 7, -7); cx.lineTo(m + 7, 7);
      cx.moveTo(m + 7, -7); cx.lineTo(m - 7, 7);
      cx.stroke();
      cx.restore();
    }
    cx.restore();

    if (c.t == 'G') continue;

    // Component Text Labels with semi-transparent Pill Badges
    const d = D[c.r];
    const mx = (c.x + d[0] * 1.5) * G;
    const my = (c.y + d[1] * 1.5) * G;
    const hz = d[1] == 0;
    const nI = T[c.t].nm ? T[c.t].p.indexOf(c.val) : -1;
    const pre = c.t == 'C' ? ctype(c).s + ' ' : nI >= 0 ? T[c.t].nm[nI] + ' ' : '';
    const l1 = c.dead ? 'RUSAK' : c.t == 'S' ? (c.on ? 'ON' : 'OFF') : pre + fmt(c.val, T[c.t].u) + (c.t == 'A' ? ' ' + fmt(c.f, 'Hz') : '');
    const l2 = c.dead ? 'meledak' : fmt(c.v, 'V') + '  ' + fmt(c.i, 'A');

    cx.font = '600 11.5px ui-monospace, "SF Mono", Consolas, monospace';
    const tx = hz ? mx : mx + 16;
    const ty = hz ? my - 20 : my - 4;

    const w1 = cx.measureText(l1).width;
    cx.font = '500 10.5px ui-monospace, "SF Mono", Consolas, monospace';
    const w2 = cx.measureText(l2).width;
    const boxW = Math.max(w1, w2) + 12;
    const boxH = 28;
    const boxX = hz ? tx - boxW / 2 : tx - 4;
    const boxY = ty - 12;

    // Draw clean background pill so labels never clash with wires
    cx.save();
    cx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.9)';
    cx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.85)';
    cx.lineWidth = 1;
    cx.beginPath();
    cx.roundRect(boxX, boxY, boxW, boxH, 6);
    cx.fill();
    cx.stroke();

    cx.textAlign = hz ? 'center' : 'left';
    cx.fillStyle = c.dead ? '#f97316' : fg;
    cx.font = '600 11.5px ui-monospace, "SF Mono", Consolas, monospace';
    cx.fillText(l1, tx, ty);

    cx.fillStyle = mu;
    cx.font = '500 10px ui-monospace, "SF Mono", Consolas, monospace';
    cx.fillText(l2, tx, ty + 12);
    cx.restore();
  }

  // Terminals (halo di semua pin saat menarik kabel)
  for (const c of S.comps) {
    for (const p of term(c)) {
      if (S.wd || S.we) {
        cx.fillStyle = 'rgba(37, 99, 235, 0.22)';
        cx.beginPath();
        cx.arc(p[0] * G, p[1] * G, 7, 0, 7);
        cx.fill();
      }
      cx.fillStyle = ac;
      cx.beginPath();
      cx.arc(p[0] * G, p[1] * G, 3.5, 0, 7);
      cx.fill();
    }
  }

  // Junction dots
  const cn = {};
  WP().forEach(p => cn[K(p)] = (cn[K(p)] || 0) + 1);
  S.comps.forEach(c => term(c).forEach(p => cn[K(p)] = (cn[K(p)] || 0) + 1));
  S.wires.forEach(w => [...S.comps.flatMap(term), ...WP()].forEach(p => {
    if (K(p) != K(w[0]) && K(p) != K(w[1]) && onSeg(p, w[0], w[1])) cn[K(p)] = (cn[K(p)] || 0) + 2;
  }));
  cx.fillStyle = wr;
  for (const k in cn) {
    if (cn[k] > 2) {
      const [x, y] = k.split(',');
      cx.beginPath();
      cx.arc(x * G, y * G, 5, 0, 7);
      cx.fill();
    }
  }

  // Cincin pin saat kursor di atas pin, dan pratinjau kabel saat menarik
  cx.strokeStyle = ac;
  cx.lineWidth = 2;
  if (S.hv && !S.wd) {
    cx.beginPath();
    cx.arc(S.hv[0] * G, S.hv[1] * G, 8, 0, 7);
    cx.stroke();
  }
  const wd = S.wd;
  if (wd) {
    cx.save();
    cx.strokeStyle = wd.tg ? '#10b981' : ac;
    cx.lineWidth = 2.6;
    cx.setLineDash([6, 5]);
    cx.beginPath();
    if (wd.path) wd.path.forEach((p, i) => i ? cx.lineTo(p[0] * G, p[1] * G) : cx.moveTo(p[0] * G, p[1] * G));
    else { cx.moveTo(wd.from[0] * G, wd.from[1] * G); cx.lineTo(wd.cur[0], wd.cur[1]); }
    cx.stroke();
    cx.restore();
    cx.beginPath();
    cx.arc(wd.from[0] * G, wd.from[1] * G, 8, 0, 7);
    cx.stroke();
    if (wd.tg) {
      cx.fillStyle = 'rgba(16, 185, 129, 0.35)';
      cx.strokeStyle = '#10b981';
      cx.beginPath();
      cx.arc(wd.tg.p[0] * G, wd.tg.p[1] * G, 10, 0, 7);
      cx.fill();
      cx.stroke();
    }
  }

  // Pratinjau saat ujung kabel digeser ke pin lain
  const we = S.we;
  if (we && S.links[we.lid]) {
    const L = S.links[we.lid], other = we.end == 0 ? L.pts[L.pts.length - 1] : L.pts[0];
    cx.save();
    cx.strokeStyle = we.tg ? '#10b981' : ac;
    cx.lineWidth = 3;
    cx.setLineDash([6, 5]);
    cx.beginPath();
    if (we.path) we.path.forEach((p, i) => i ? cx.lineTo(p[0] * G, p[1] * G) : cx.moveTo(p[0] * G, p[1] * G));
    else { cx.moveTo(other[0] * G, other[1] * G); cx.lineTo(we.cur[0], we.cur[1]); }
    cx.stroke();
    cx.restore();
    if (we.tg) {
      cx.fillStyle = 'rgba(16, 185, 129, 0.35)';
      cx.strokeStyle = '#10b981';
      cx.lineWidth = 2;
      cx.beginPath();
      cx.arc(we.tg.p[0] * G, we.tg.p[1] * G, 10, 0, 7);
      cx.fill();
      cx.stroke();
    }
  }

  // Efek ledakan: kilatan, percikan api, dan asap
  for (const p of S.fx) {
    const f = p.life / p.max;
    cx.save();
    cx.shadowBlur = 0;
    if (p.k == 'flash') {
      const r = 20 + (1 - f) * 60;
      const g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, `rgba(255,240,180,${f})`);
      g.addColorStop(.5, `rgba(255,140,30,${f * .6})`);
      g.addColorStop(1, 'rgba(255,80,0,0)');
      cx.fillStyle = g;
      cx.beginPath(); cx.arc(p.x, p.y, r, 0, 7); cx.fill();
    } else if (p.k == 'spark') {
      cx.globalAlpha = Math.min(1, f * 1.5);
      cx.fillStyle = f > .5 ? '#fde047' : '#fb923c';
      cx.beginPath(); cx.arc(p.x, p.y, 2.2, 0, 7); cx.fill();
    } else {
      cx.globalAlpha = f * .45;
      cx.fillStyle = '#6b7280';
      cx.beginPath(); cx.arc(p.x, p.y, p.r * (1 + (1 - f) * 1.6), 0, 7); cx.fill();
    }
    cx.restore();
  }

  // Nama pin: muncul saat pin ditekan (dan pin tujuan saat menyambung), tetap terlihat sebentar setelah dilepas
  const tags = [], pt = S.ptag;
  if (pt && S.comps.includes(pt.c) && performance.now() < pt.until) tags.push([pt.c, pt.t]);
  if (S.wd && S.wd.tg && S.wd.tg.c != null) { const tc = cb(S.wd.tg.c); if (tc) tags.push([tc, S.wd.tg.t]); }
  if (S.we && S.we.tg && S.we.tg.c != null) { const tc = cb(S.we.tg.c); if (tc) tags.push([tc, S.we.tg.t]); }
  for (const [tc, ti] of tags) {
    const [name, pol] = pinInfo(tc, ti), p = term(tc)[ti];
    cx.save();
    cx.translate(p[0] * G, p[1] * G);
    cx.scale(1 / V.z, 1 / V.z); // ukuran tetap saat zoom
    cx.font = '600 11px system-ui, -apple-system, sans-serif';
    const bw = cx.measureText(name).width + 16;
    cx.fillStyle = pol > 0 ? '#ef4444' : pol < 0 ? '#2563eb' : '#475569';
    cx.beginPath();
    cx.roundRect(-bw / 2, -34, bw, 20, 6);
    cx.moveTo(-5, -14); cx.lineTo(0, -8); cx.lineTo(5, -14);
    cx.fill();
    cx.fillStyle = '#ffffff';
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    cx.fillText(name, 0, -24);
    cx.restore();
  }

  drawScope();
}

function loop() {
  const now = performance.now(), dtf = Math.min(.1, (now - (S.lt || now)) / 1000);
  S.lt = now;

  if (S.run && net) {
    for (let i = 0; i < 50; i++) {
      step();
      heatAcc();
      if (S.sel) scopeFeed();
    }
    heatStep(dtf);
  }
  updFx(dtf);

  // Update clock
  $('#clock-text').textContent = fmt(S.t, 's');

  // Status & Warning badge
  const hot = S.comps.some(c => !c.dead && TH[c.t] && (c.T ?? TAMB) > .8 * TH[c.t].Tmax);
  const w = !net ? 'Tambahkan komponen GND agar simulasi berjalan' :
            S.comps.some(c => c.dead) ? 'Ada komponen rusak. Perbaiki rangkaian, lalu tekan Reset Simulasi' :
            S.comps.some(c => c.t == 'D' && c.i > .03) ? 'Peringatan: LED kelebihan arus (>30mA)' :
            S.comps.some(c => c.t == 'C' && ctype(c).pol && c.v < -.5) ? 'Peringatan: kapasitor berkutub terpasang terbalik' :
            hot ? 'Peringatan: ada komponen hampir rusak karena panas' : '';
  const sb = $('#st');
  sb.className = w ? 'w' : '';
  const idle = S.tool != 'sel' ? `Ketuk kanvas untuk menaruh ${T[S.tool].n} (Esc untuk batal)` : 'Kanvas Siap';
  sb.innerHTML = (S.note ? `<span>${S.note}</span>` : '') +
                 (w ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ${w}` :
                      (S.note ? '' : `<span style="color:var(--mu)">${idle}</span>`));

  const c = S.sel;
  if (c && $('#rv')) {
    $('#rv').textContent = fmt(c.v, 'V');
    $('#ri').textContent = fmt(c.i, 'A');
    $('#rp').textContent = fmt(Math.abs(c.v * c.i), 'W');
  }

  // Indikator suhu komponen terpilih
  if (c && TH[c.t] && $('#tt')) {
    const th = TH[c.t], t0 = c.T ?? TAMB;
    const f = Math.max(0, Math.min(1, (t0 - TAMB) / (th.Tmax - TAMB)));
    $('#tt').textContent = c.dead ? 'Rusak' : Math.round(t0) + '°C';
    $('#tf').style.width = (c.dead ? 100 : Math.max(3, f * 100)) + '%';
    $('#tf').style.background = c.dead ? '#475569' : `hsl(${Math.round(120 - 120 * f)}, 80%, 45%)`;
    $('#tl').textContent = c.t == 'C'
      ? `Tegangan ${fmt(Math.abs(c.v), 'V')} dari maks ${CAPV[capKey(c)]}V · rusak di ${th.Tmax}°C`
      : `Daya ${fmt(c.P || 0, 'W')} · nominal ${fmt(th.Pr, 'W')} · rusak di ${th.Tmax}°C`;
  }

  draw();
  requestAnimationFrame(loop);
}

// Initial boot
exm(0);
S.U = [];
S.R = [];
rcb();
fit();
loop();
