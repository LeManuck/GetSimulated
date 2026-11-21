# GetSimulated

Simulator elektronik berbasis web: satu file `index.html`, tanpa dependensi, bisa dibuka langsung di browser (desktop maupun ponsel).

## Fitur
- Komponen: baterai, sumber AC sinus, resistor, kapasitor, induktor, LED (4 warna), dioda (1N4148, 1N4007, 1N5819, BAT54), saklar, GND.
- **Pick parts**: menu pemilih komponen dengan pencarian dan kategori (Daya, Pasif, Semikonduktor, Kontrol), plus daftar komponen yang terakhir dipakai.
- **Tampilan Gambar / Skema**: mode Gambar menampilkan komponen berbentuk fisik (resistor dengan gelang warna sesuai nilai, LED yang menyala, dioda, baterai, kapasitor, saklar); mode Skema menampilkan simbol diagram sirkuit.
- Nilai komponen lewat selector preset atau ketik bebas (akhiran SI: p, n, u, m, k, M, G).
- Editor: seret komponen, kabel (termasuk sambungan T), putar, hapus, undo (Ctrl/Cmd+Z), zoom dan geser tampilan.
- Pembacaan tegangan, arus, dan daya per komponen, ditambah osiloskop mini.
- Contoh rangkaian siap pakai, simpan/muat (localStorage), tema terang/gelap.

## Menjalankan
Buka `index.html` di browser, atau lewat GitHub Pages (lihat di bawah).

## Hosting dengan GitHub Pages
1. Buka **Settings → Pages** di repo ini.
2. Pada **Build and deployment**, pilih **Deploy from a branch**.
3. Pilih branch `main`, folder `/ (root)`, lalu **Save**.
4. Tunggu 1-2 menit; alamatnya biasanya `https://<nama-akun>.github.io/GetSimulated/`.

## Teknis
Modified Nodal Analysis, simulasi transien backward Euler, Newton-Raphson untuk dioda/LED. Detail riwayat dan keterbatasan ada di `LOG.md`.

## Aturan repo
Setiap review atau perubahan **wajib** dicatat di bagian paling atas `LOG.md`.
