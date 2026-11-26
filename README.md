# GetSimulated

Simulator elektronik berbasis web: HTML + CSS + JavaScript statis (tanpa dependensi, tanpa PHP), bisa dibuka di browser desktop maupun ponsel. Kode dipisah ke beberapa file di folder `assets/` agar bisa di-cache browser dan lebih ringan bagi server.

## Struktur file
```
index.html            kerangka halaman (markup saja)
assets/css/style.css  seluruh gaya tampilan
assets/js/core.js     data komponen, state, util, rute kabel, solver MNA, model panas dan kerusakan
assets/js/scope.js    osiloskop digital (akuisisi, pemicu, gambar layar)
assets/js/editor.js   interaksi kanvas, undo/redo, simpan/muat, keyboard
assets/js/app.js      toolbar, Pick Parts, Inspektor, gambar kanvas, efek ledakan, loop, boot
```
Urutan pemuatan di `index.html` wajib: `core.js`, `scope.js`, `editor.js`, `app.js` (file-file ini berbagi variabel global). Semua simulasi tetap berjalan di browser pengunjung; server hanya menyajikan file statis.

## Fitur
- Komponen: baterai, sumber AC sinus, resistor, kapasitor, induktor, LED (4 warna), dioda (1N4148, 1N4007, 1N5819, BAT54), saklar, GND.
- **Panas dan ledakan**: tiap komponen punya suhu yang naik saat menyerap daya (indikator suhu kecil ada di panel Inspektor, tepat di bawah pengaturan nilai komponen yang dipilih). Rangkaian yang salah membuat komponen panas, lalu **meledak** (kilatan, percikan, asap) dan menjadi putus sampai rangkaian diperbaiki dan **Reset Simulasi** ditekan. Contoh kesalahan: korsleting baterai (kutub + langsung ke −), LED tanpa resistor, resistor berdaya kecil di tegangan besar, Elco/Tantalum terbalik, kapasitor melewati tegangan kerjanya, LED terbalik di tegangan besar.
- **Tipe kapasitor**: Elco (elektrolit), Keramik, Tantalum, dan Film/Mylar, dipilih lewat selector di panel Inspektor. Kapasitansi diketik manual (bawaan 10 µF). **Elco dan Tantalum berkutub** (pin 1 = +): bila dipasang terbalik, tegangannya terjepit sekitar −1 V, arus mengalir, dan muncul peringatan. Keramik dan Film tidak berkutub.
- **Nama pin**: tekan sebuah pin untuk melihat namanya (+ / −, Anoda / Katoda, Kaki 1 / 2, dan seterusnya) sesuai komponen aslinya.
- **Pick parts**: menu pemilih komponen dengan pencarian dan kategori (Daya, Pasif, Semikonduktor, Kontrol), plus daftar komponen yang terakhir dipakai.
- **Tampilan Gambar / Skema**: mode Gambar menampilkan komponen berbentuk fisik (resistor dengan gelang warna sesuai nilai, LED yang menyala, dioda, baterai, kapasitor sesuai tipe, saklar); mode Skema menampilkan simbol diagram sirkuit.
- Nilai komponen lewat selector preset atau ketik bebas (akhiran SI: p, n, u, m, k, M, G).
- Editor: seret komponen, kabel (termasuk sambungan T), putar, hapus, undo (Ctrl/Cmd+Z), zoom dan geser tampilan.
- Pembacaan tegangan, arus, dan daya per komponen.
- **Osiloskop digital** seperti aslinya: layar 10 x 8 div, **Volt/div** (10 mV sampai 50 V) dan **Time/div** (100 µs sampai 500 ms), pemicu (mode Auto / Normal / Single, tepi naik atau turun, level), **Posisi Y**, tombol Run/Stop, dan **Autoset**. Sinyal berulang tampil diam karena disinkronkan ke pemicu. Hasil ukur: Vpp, Max, Min, dan frekuensi.
- Contoh rangkaian siap pakai, simpan/muat (localStorage), tema terang/gelap.

## Batas komponen (model panas)
Pada daya nominal, suhu naik 60 °C di atas suhu ruang (25 °C); pemanasan punya konstanta waktu sekitar 1,5 detik. Komponen meledak saat suhunya mencapai batas.

| Komponen | Daya nominal | Meledak di | Tambahan |
|---|---|---|---|
| Resistor | 0,25 W | 170 °C | |
| Induktor | 0,5 W (rugi kawat 0,5 Ω × I²) | 160 °C | |
| LED | 0,06 W | 120 °C | tegangan balik > 5 V memanaskan cepat |
| Dioda | 1 W | 150 °C | |
| Kapasitor | 0,25 W | 105 °C | polaritas terbalik (Elco/Tantalum) dan tegangan melebihi batas (Elco 16 V, Keramik 50 V, Tantalum 10 V, Film 63 V) memanaskan cepat |
| Baterai / Sumber AC | 2 W (rugi hambatan dalam 1 Ω × I²) | 100 °C | arus besar atau korsleting: sekitar 1,6 A saja sudah cukup lama-lama meledak |

Nilai ini perkiraan untuk tujuan belajar, bukan data lembar data komponen tertentu.

## Menjalankan
Buka `index.html` di browser (folder `assets/` harus ikut berada di sebelahnya), atau lewat GitHub Pages / InfinityFree (lihat di bawah).

## Hosting dengan GitHub Pages
1. Buka **Settings → Pages** di repo ini.
2. Pada **Build and deployment**, pilih **Deploy from a branch**.
3. Pilih branch `main`, folder `/ (root)`, lalu **Save**.
4. Tunggu 1-2 menit; alamatnya biasanya `https://<nama-akun>.github.io/GetSimulated/`.

## Deploy otomatis ke InfinityFree
Setiap push ke `main` menjalankan workflow `.github/workflows/deploy.yml` yang meng-upload isi repo (`index.html` dan folder `assets/`) ke folder `htdocs` lewat FTP.

Pengaturan satu kali:
1. Di panel InfinityFree, buka **Accounts → Manage → FTP Details**, catat Hostname, Username, dan Password.
2. Di GitHub, buka **Settings → Secrets and variables → Actions → Repository secrets**, lalu tambahkan tiga secret: `FTP_SERVER` (hostname FTP, bukan domain situs), `FTP_USERNAME`, dan `FTP_PASSWORD`.
3. Push ke `main`, atau jalankan manual dari tab **Actions → Deploy ke InfinityFree → Run workflow**.

`README.md`, `LOG.md`, dan folder `.github` tidak diupload. Workflow menyimpan satu file pelacak (`.ftp-deploy-sync-state.json`) di `htdocs` untuk mengunggah hanya file yang berubah.

Catatan cache: link CSS dan JS di `index.html` memakai `?v=...`. Ubah nilai itu setiap kali file di `assets/` berubah agar browser pengunjung mengambil versi baru.

## Teknis
Modified Nodal Analysis, simulasi transien backward Euler, Newton-Raphson untuk dioda/LED. Detail riwayat dan keterbatasan ada di `LOG.md`.

## Aturan repo
Setiap review atau perubahan **wajib** dicatat di bagian paling atas `LOG.md`.
