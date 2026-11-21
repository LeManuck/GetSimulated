# LOG PERUBAHAN

> ⚠️ **WAJIB DIISI**: setiap kali me-review ATAU mengubah isi repo ini (kode, dokumen, konfigurasi),
> tambahkan entri baru di **bagian paling atas** log ini (tepat di bawah garis ini), terbaru di atas.
> Format: tanggal, siapa, apa yang dilakukan, file yang tersentuh, catatan/masalah.

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
- Hanya sintaks JavaScript yang diperiksa (`node --check`); tampilan dan simulasi belum diuji langsung di browser oleh Claude. Mohon laporkan bug.
- Belum ada: transistor, pinch-zoom dua jari, ekspor gambar/berkas, banyak slot simpanan, instalasi sebagai aplikasi (PWA).
- Tombol Backspace kini ikut menghapus komponen terpilih (selain Delete).

---

## 2026-11-21: v0.3.1, dioda dipilih lewat kode komponen (Claude)
**Dilakukan** (file: `index.html`)
- Selector dioda kini berisi kode komponen: 1N4148 (Vf 0,72 V), 1N4007 (0,68 V), 1N5819 Schottky (0,3 V), BAT54 Schottky (0,4 V). Nilai Vf adalah perkiraan pada arus sekitar 10 mA, bukan data lembar data lengkap.
- Label di kanvas kini menampilkan kode dioda (atau warna LED) di samping nilainya.
- Nilai Kustom tetap bisa diketik; labelnya hilang jika nilai tidak cocok dengan salah satu kode.

**Catatan**
- Model dioda masih sederhana (Shockley, satu titik kalibrasi). Belum ada tegangan tembus (Zener/breakdown) maupun batas arus maksimum per tipe.

---

## 2026-11-21: v0.3.0, perbaikan bug geser, undo, simpan/muat, dioda (Claude)
**Bug diperbaiki** (file: `index.html`)
- Saat komponen digeser dan terminalnya (mis. anoda dioda) menyentuh kabel, kabel itu dulu dipecah permanen menjadi kabel baru dan tersambung. Sekarang kabel TIDAK pernah diubah otomatis: sambungan T dihitung secara virtual saat membangun rangkaian (fungsi `onSeg`, menggantikan `splitAt`). Terminal hanya tersambung selama benar-benar berada di kabel itu; digeser menjauh, sambungan lepas dan tidak ada kabel baru tertinggal.

**Fitur baru**
- Undo (tombol Undo atau Ctrl/Cmd+Z, hingga 50 langkah): penempatan, hapus, kabel, geser, putar, ubah nilai.
- Simpan / Muat rangkaian lewat `localStorage` browser (satu slot).
- Dioda biasa, memakai model Shockley yang sama dengan LED, tanpa cahaya.

**Catatan**
- Transistor (komponen 3 terminal) belum dikerjakan: perlu perubahan struktur terminal dan solver.
- Simpan/Muat bergantung pada `localStorage`; bisa gagal di mode privat atau jika browser memblokirnya.

---

## 2026-11-21: v0.2.0, geser komponen, kabel bercabang, sumber AC (Claude)
**Dilakukan** (file: `index.html`)
- Geser komponen: ketuk lalu seret komponen dengan alat Pilih. Ujung kabel yang menempel di terminalnya ikut berpindah.
- Kabel bercabang (sambungan T) dan titik sambungan hijau.
- Sumber AC sinus: amplitudo lewat selector/ketik bebas, frekuensi 1 Hz sampai 1 kHz.
- Osiloskop mini kini mengambil 10 sampel per frame.

**Catatan**
- Menggeser komponen mereset waktu simulasi (rangkaian dibangun ulang).
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
