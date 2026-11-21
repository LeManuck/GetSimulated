# LOG PERUBAHAN

> ⚠️ **WAJIB DIISI**: setiap kali me-review ATAU mengubah isi repo ini (kode, dokumen, konfigurasi),
> tambahkan entri baru di **bagian paling atas** log ini (tepat di bawah garis ini), terbaru di atas.
> Format: tanggal, siapa, apa yang dilakukan, file yang tersentuh, catatan/masalah.

---

## 2026-11-21: v0.3.0, perbaikan bug geser, undo, simpan/muat, dioda (Claude)
**Bug diperbaiki** (file: `index.html`)
- Saat komponen digeser dan terminalnya (mis. anoda dioda) menyentuh kabel, kabel itu dulu dipecah permanen menjadi kabel baru dan tersambung. Sekarang kabel TIDAK pernah diubah otomatis: sambungan T dihitung secara virtual saat membangun rangkaian (fungsi `onSeg`, menggantikan `splitAt`). Terminal hanya tersambung selama benar-benar berada di kabel itu; digeser menjauh, sambungan lepas dan tidak ada kabel baru tertinggal.

**Fitur baru**
- Undo (tombol Undo atau Ctrl/Cmd+Z, hingga 50 langkah): penempatan, hapus, kabel, geser, putar, ubah nilai.
- Simpan / Muat rangkaian lewat `localStorage` browser (satu slot).
- Dioda biasa (Vf 0,2 / 0,3 / 0,7 V), memakai model Shockley yang sama dengan LED, tanpa cahaya.

**Catatan**
- Belum diuji langsung di browser oleh Claude, hanya ditulis dan dipublikasikan.
- Transistor (komponen 3 terminal) belum dikerjakan: perlu perubahan struktur terminal dan solver. Direncanakan untuk versi berikutnya.
- Simpan/Muat bergantung pada `localStorage`; bisa gagal di mode privat atau jika browser memblokirnya (muncul pesan di bilah status).

---

## 2026-11-21: v0.2.0, geser komponen, kabel bercabang, sumber AC (Claude)
**Dilakukan** (file: `index.html`)
- Geser komponen: ketuk lalu seret komponen dengan alat Pilih. Ujung kabel yang menempel di terminalnya ikut berpindah.
- Kabel bercabang (sambungan T): ujung kabel atau terminal komponen yang jatuh di tengah kabel lain otomatis memecah kabel itu dan tersambung. Titik sambungan (3 jalur atau lebih) digambar sebagai titik hijau.
- Sumber AC sinus: amplitudo lewat selector/ketik bebas, frekuensi lewat selector (1 Hz sampai 1 kHz). Memakai cabang tegangan MNA yang sama dengan baterai.
- Osiloskop mini kini mengambil 10 sampel per frame agar gelombang AC terlihat mulus.

**Catatan**
- Menggeser komponen mereset waktu simulasi (rangkaian dibangun ulang).
- Kabel yang bersilangan tanpa ujung di titik silang tetap TIDAK tersambung (sengaja).
- (Diperbaiki di v0.3.0: pemecahan kabel permanen saat geser.)

---

## 2026-11-21: upload awal ke GitHub (Claude)
**Dilakukan**
- Membuat repo `GetSimulated` (public) dan mengunggah `index.html`, `README.md`, `LOG.md`.
- README disesuaikan dengan nama proyek (menimpa README bawaan auto-init).

**Catatan**
- Percobaan pertama membuat repo (nama `circuit-sim`) gagal dengan HTTP 403; percobaan kedua dengan nama `GetSimulated` berhasil.

---

## 2026-11-21: v0.1.0, prototipe awal (Claude)
**Dilakukan**
- Membuat `index.html`: simulator rangkaian satu file, tanpa dependensi.
- Solver: Modified Nodal Analysis (MNA), eliminasi Gauss, simulasi transien (backward Euler) dengan langkah waktu dipilih lewat selector.
- Komponen: Baterai (dengan resistansi dalam 0,01 Ω), Resistor, Kapasitor, Induktor, LED (model Shockley + Newton-Raphson), Saklar, GND.
- Nilai komponen bisa dipilih lewat selector preset atau diketik bebas (mendukung akhiran SI: p, n, u, m, k, M, G).
- Editor: letakkan komponen di grid, kabel dua ketukan, putar, hapus, mini osiloskop untuk tegangan komponen terpilih.
- Rangkaian contoh: baterai 9 V, resistor 330 Ω, LED merah.
- Membuat `README.md` dan `LOG.md` ini.
