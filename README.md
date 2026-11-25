# GetSimulated

Simulator elektronik berbasis web: satu file `index.html`, tanpa dependensi, bisa dibuka langsung di browser (desktop maupun ponsel).

## Fitur
- Komponen: baterai, sumber AC sinus, resistor, kapasitor, induktor, LED (4 warna), dioda (1N4148, 1N4007, 1N5819, BAT54), saklar, GND.
- **Tipe kapasitor**: Elco (elektrolit), Keramik, Tantalum, dan Film/Mylar, dipilih lewat selector di panel Inspektor. Kapasitansi diketik manual (bawaan 10 µF). **Elco dan Tantalum berkutub** (pin 1 = +): bila dipasang terbalik, tegangannya terjepit sekitar −1 V, arus mengalir, dan muncul peringatan. Keramik dan Film tidak berkutub.
- **Nama pin**: tekan sebuah pin untuk melihat namanya (+ / −, Anoda / Katoda, Kaki 1 / 2, dan seterusnya) sesuai komponen aslinya.
- **Pick parts**: menu pemilih komponen dengan pencarian dan kategori (Daya, Pasif, Semikonduktor, Kontrol), plus daftar komponen yang terakhir dipakai.
- **Tampilan Gambar / Skema**: mode Gambar menampilkan komponen berbentuk fisik (resistor dengan gelang warna sesuai nilai, LED yang menyala, dioda, baterai, kapasitor sesuai tipe, saklar); mode Skema menampilkan simbol diagram sirkuit.
- Nilai komponen lewat selector preset atau ketik bebas (akhiran SI: p, n, u, m, k, M, G).
- Editor: seret komponen, kabel (termasuk sambungan T), putar, hapus, undo (Ctrl/Cmd+Z), zoom dan geser tampilan.
- Pembacaan tegangan, arus, dan daya per komponen.
- **Osiloskop digital** seperti aslinya: layar 10 x 8 div, **Volt/div** (10 mV sampai 50 V) dan **Time/div** (100 µs sampai 500 ms), pemicu (mode Auto / Normal / Single, tepi naik atau turun, level), **Posisi Y**, tombol Run/Stop, dan **Autoset**. Sinyal berulang tampil diam karena disinkronkan ke pemicu. Hasil ukur: Vpp, Max, Min, dan frekuensi.
- Contoh rangkaian siap pakai, simpan/muat (localStorage), tema terang/gelap.

## Menjalankan
Buka `index.html` di browser, atau lewat GitHub Pages / InfinityFree (lihat di bawah).

## Hosting dengan GitHub Pages
1. Buka **Settings → Pages** di repo ini.
2. Pada **Build and deployment**, pilih **Deploy from a branch**.
3. Pilih branch `main`, folder `/ (root)`, lalu **Save**.
4. Tunggu 1-2 menit; alamatnya biasanya `https://<nama-akun>.github.io/GetSimulated/`.

## Deploy otomatis ke InfinityFree
Setiap push ke `main` menjalankan workflow `.github/workflows/deploy.yml` yang meng-upload `index.html` ke folder `htdocs` lewat FTP.

Pengaturan satu kali:
1. Di panel InfinityFree, buka **Accounts → Manage → FTP Details**, catat Hostname, Username, dan Password.
2. Di GitHub, buka **Settings → Secrets and variables → Actions → Repository secrets**, lalu tambahkan tiga secret: `FTP_SERVER` (hostname FTP, bukan domain situs), `FTP_USERNAME`, dan `FTP_PASSWORD`.
3. Push ke `main`, atau jalankan manual dari tab **Actions → Deploy ke InfinityFree → Run workflow**.

Hanya `index.html` yang diupload; `README.md`, `LOG.md`, dan folder `.github` tidak. Workflow menyimpan satu file pelacak (`.ftp-deploy-sync-state.json`) di `htdocs` untuk mengunggah hanya file yang berubah.

## Teknis
Modified Nodal Analysis, simulasi transien backward Euler, Newton-Raphson untuk dioda/LED. Detail riwayat dan keterbatasan ada di `LOG.md`.

## Aturan repo
Setiap review atau perubahan **wajib** dicatat di bagian paling atas `LOG.md`.
