# LOG PERUBAHAN

> ⚠️ **WAJIB DIISI**: setiap kali me-review ATAU mengubah isi repo ini (kode, dokumen, konfigurasi),
> tambahkan entri baru di **bagian paling atas** log ini (tepat di bawah garis ini), terbaru di atas.
> Format: tanggal, siapa, apa yang dilakukan, file yang tersentuh, catatan/masalah.

---

## 2026-11-22: v1.1.0, Pick parts, tampilan Gambar, panduan GitHub Pages (Claude)
**Dilakukan** (file: `index.html`, `README.md`)
- Menu **Pick parts**: lembar pemilih komponen dengan kotak pencarian (cocok dengan nama, kata kunci Indonesia/Inggris, dan kode seperti 1N4148) dan kategori Daya / Pasif / Semikonduktor / Kontrol. LED dan dioda muncul per varian (warna / kode) sehingga langsung terpasang dengan nilai yang benar.
- Palet kiri dirapikan: Alat, tombol Pick parts, daftar 4 komponen terakhir dipakai, Aksi. Daftar komponen panjang tidak lagi tampil di palet.
- Mode **Tampilan: Gambar / Skema** (tombol di header, bawaan Gambar). Mode Gambar menggambar komponen berbentuk fisik di kanvas: resistor dengan gelang warna dihitung dari nilainya, LED kubah yang menyala sesuai arus, dioda dengan pita katoda, baterai, kapasitor, induktor, sumber AC, saklar tuas. GND tetap simbol skematik.
- README: menambahkan fitur baru dan langkah mengaktifkan GitHub Pages.
- Mesin simulasi tidak diubah.

**Catatan**
- GitHub Pages TIDAK bisa diaktifkan oleh Claude (konektor tidak punya alat untuk pengaturan repo). Perlu diaktifkan manual di Settings → Pages (langkah ada di README).
- Hanya sintaks JavaScript yang diperiksa (`node --check`); belum diuji langsung di browser. Gambar komponen memakai `roundRect` kanvas yang butuh browser cukup baru (Chrome 99+, Safari 16+, Firefox 112+).
- "Gambar" masih digambar lewat kanvas, bukan elemen SVG terpisah, dan belum ada mode breadboard.

---

## 2026-11-22: v1.0.0, tampilan produk (Claude)
**Dilakukan** (file: `index.html`, `README.md`)
- Antarmuka ditulis ulang: header bermerek, palet komponen dengan ikon dan pengelompokan (Alat, Komponen, Aksi), panel properti di kanan, kanvas dengan chip status. Di ponsel, palet menjadi baris geser horizontal dan panel pindah ke bawah kanvas.
- Panel properti: pilih/ketik nilai, tombol Putar dan Hapus, pembacaan tegangan, arus, dan daya langsung. Osiloskop dipindah ke panel.
- Zoom (tombol +/−, roda mouse) dan geser tampilan (seret area kosong dengan alat Pilih). Kanvas tajam di layar retina.
- Tema terang/gelap dengan tombol di header (juga mengikuti pengaturan perangkat).
- Menu Contoh rangkaian: LED + resistor, pengisian kapasitor (RC), penyearah setengah gelombang.
- Warna simbol per jenis komponen, sorotan pada komponen terpilih, pesan peringatan berupa chip kuning.
- Mesin simulasi (MNA, transien, dioda) TIDAK diubah.
- `README.md` ditulis ulang dengan daftar fitur.

**Catatan**
- Belum ada: transistor, pinch-zoom dua jari, ekspor gambar/berkas, banyak slot simpanan, instalasi sebagai aplikasi (PWA).
- Tombol Backspace kini ikut menghapus komponen terpilih (selain Delete).

---

## 2026-11-21: v0.3.1, dioda dipilih lewat kode komponen (Claude)
**Dilakukan** (file: `index.html`)
- Selector dioda kini berisi kode komponen: 1N4148 (Vf 0,72 V), 1N4007 (0,68 V), 1N5819 Schottky (0,3 V), BAT54 Schottky (0,4 V). Nilai Vf adalah perkiraan pada arus sekitar 10 mA, bukan data lembar data lengkap.
- Label di kanvas menampilkan kode dioda (atau warna LED) di samping nilainya.

**Catatan**
- Model dioda masih sederhana (Shockley, satu titik kalibrasi). Belum ada tegangan tembus (Zener) maupun batas arus maksimum per tipe.

---

## 2026-11-21: v0.3.0, perbaikan bug geser, undo, simpan/muat, dioda (Claude)
**Bug diperbaiki** (file: `index.html`)
- Saat komponen digeser dan terminalnya menyentuh kabel, kabel itu dulu dipecah permanen menjadi kabel baru dan tersambung. Sekarang kabel TIDAK pernah diubah otomatis: sambungan T dihitung secara virtual saat membangun rangkaian (fungsi `onSeg`, menggantikan `splitAt`).

**Fitur baru**
- Undo (tombol Undo atau Ctrl/Cmd+Z, hingga 50 langkah).
- Simpan / Muat rangkaian lewat `localStorage` browser (satu slot).
- Dioda biasa, model Shockley sama dengan LED, tanpa cahaya.

---

## 2026-11-21: v0.2.0, geser komponen, kabel bercabang, sumber AC (Claude)
**Dilakukan** (file: `index.html`)
- Geser komponen, kabel bercabang (sambungan T) dengan titik sambungan hijau, sumber AC sinus (1 Hz sampai 1 kHz), osiloskop mini 10 sampel per frame.

**Catatan**
- Kabel yang bersilangan tanpa ujung di titik silang tetap TIDAK tersambung (sengaja).

---

## 2026-11-21: upload awal ke GitHub (Claude)
**Dilakukan**
- Membuat repo `GetSimulated` (public) dan mengunggah `index.html`, `README.md`, `LOG.md`.

**Catatan**
- Percobaan pertama membuat repo (nama `circuit-sim`) gagal dengan HTTP 403; percobaan kedua dengan nama `GetSimulated` berhasil.

---

## 2026-11-21: v0.1.0, prototipe awal (Claude)
**Dilakukan**
- Membuat `index.html`: simulator rangkaian satu file, tanpa dependensi.
- Solver: Modified Nodal Analysis (MNA), eliminasi Gauss, simulasi transien (backward Euler).
- Komponen: Baterai, Resistor, Kapasitor, Induktor, LED (Shockley + Newton-Raphson), Saklar, GND.
- Nilai komponen lewat selector preset atau ketik bebas (akhiran SI).
- Editor grid, kabel, putar, hapus, osiloskop mini. Rangkaian contoh: baterai 9 V, resistor 330 Ω, LED merah.
