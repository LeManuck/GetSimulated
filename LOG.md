# LOG PERUBAHAN

> ⚠️ **WAJIB DIISI**: setiap kali me-review ATAU mengubah isi repo ini (kode, dokumen, konfigurasi),
> tambahkan entri baru di **bagian paling atas** log ini (tepat di bawah garis ini), terbaru di atas.
> Format: tanggal, siapa, apa yang dilakukan, file yang tersentuh, catatan/masalah.

---

## 2026-11-22: v1.6.0, Kabel Bisa Ditekuk dan Dipindah Ujungnya (gaya Wokwi) (Claude)
**Dilakukan** (file: `index.html`, `LOG.md`)
- **Model kabel diubah menjadi daftar titik (polyline).** Tiap kabel (tautan pin-ke-pin) menyimpan titik-titik `pts`; segmen digambar dan dihitung secara listrik dari titik itu (`rebuildWires`). Titik dibagi dengan segmen sehingga menggeser titik langsung memperbarui gambar.
- **Kabel terpilih punya pegangan**: ujung 1 dan 2 (lingkaran besar putih di pin), titik tekuk (titik biru), dan **titik tengah kecil di setiap garis lurus**.
- **Menekuk kabel**: seret titik tengah sebuah garis untuk menyisipkan titik tekuk baru; garis terbagi dua dan masing-masing mendapat titik tengah sendiri sehingga bisa ditekuk lagi, tanpa batas. Segmen boleh miring (tidak dipaksa siku-siku), titik menempel ke grid.
- **Menyatu kembali**: saat titik tekuk dilepas dan sudah sejajar dengan tetangganya (`tidy`), titik itu dihapus dan dua garis menyatu menjadi satu, sehingga hanya ada satu titik tengah.
- **Memindah kabel dari pin ke pin**: seret ujung kabel (yang sedang menempel di pin) ke pin lain; selama menyeret tampil pratinjau rute otomatis putus-putus dan kabel asli memudar. Saat dilepas di pin lain, tautan berpindah dan kabel **diroute ulang otomatis** dari ujung satunya (berlaku untuk ujung 1 maupun 2). Dilepas di area kosong atau pin yang sama = tidak berubah. Dilarang jika kedua ujung berada di pin yang sama.
- Menggeser atau memutar komponen tetap meroute ulang kabel yang terhubung (tekukan manual pada kabel itu direset).
- Penyimpanan (undo/redo/simpan/muat) kini menyimpan `pts`. Simpanan v1.5 (tanpa `pts`) diroute ulang saat dimuat; simpanan v1.4 (segmen tunggal) diubah menjadi kabel dengan ujung bebas.
- Badge versi v1.6; teks panduan, bantuan, dan Inspektor kabel diperbarui. Mesin simulasi tidak diubah.

**Pengujian**
- `node --check` lolos. Uji headless dengan simulasi event pointer: pilih kabel, tekuk lewat titik tengah, tekukan kedua, meluruskan kembali (kabel menyatu menjadi 1 segmen), memindah ujung ke pin lain (rute ortogonal), melepas ujung di area kosong (tidak berubah), geser komponen berkabel, undo/redo, memuat simpanan v1.5 dan v1.4, hapus kabel, serta simulasi (LED 1,84 V / 21,7 mA). Tampilan dan sentuhan di browser belum diuji langsung.

**Catatan / keterbatasan**
- Tekukan manual tidak dicek terhadap komponen lain: kabel yang ditekuk melewati pin komponen lain akan tersambung ke pin itu secara listrik.
- Menggeser komponen meroute ulang dan menghapus tekukan manual pada kabel yang terhubung.
- Kabel yang berakhir di tengah kabel lain (sambungan T) bisa lepas jika kabel induknya diroute ulang karena komponen digeser.
- `README.md` belum diperbarui.

---

## 2026-11-22: v1.5.0, Kabel dengan Tekan-Seret dari Pin, Rute Otomatis, Kabel Ikut Komponen (Claude)
**Dasar**: dibangun di atas `index.html` v1.4.0 milik Antigravity (UI, DSO, redo, Pick Parts, label pill dipertahankan). Versi lokal Claude sebelumnya (dibangun dari v1.1.0) TIDAK diunggah agar fitur v1.2.0–v1.4.0 tidak tertimpa.

**Dilakukan** (file: `index.html`, `LOG.md`)
- **Alat Kabel dihapus.** Kabel dibuat dengan **menekan lalu menyeret dari pin (kaki) komponen ke pin komponen lain** langsung dalam mode Pilih. Boleh juga berakhir di titik pada kabel lain (sambungan T). Dilepas di area kosong = dibatalkan (tidak ada kabel menggantung). Pintasan `W` dihapus dari keyboard dan panduan.
- **Rute otomatis** (pencarian jalur Dijkstra di grid): jalur siku-siku yang menghindari badan komponen (jadi tidak lagi menembus ke belakang komponen saat menyeret dari pin kanan ke kiri), kaki komponen lain, dan ujung kabel lain; persilangan dengan kabel lain dihindari bila ada jalan lain.
- **Kabel disimpan sebagai tautan** (pin A ke pin B / titik kabel) berisi beberapa segmen. Saat komponen digeser atau diputar, kabel yang terhubung diroute ulang otomatis sehingga tidak ada lagi kabel diagonal atau kabel yang melintang jauh seperti pada tangkapan layar pengguna.
- **Kabel tidak bisa digeser** ke area kosong: pegangan titik kuning (tekuk) dan pemindahan ujung kabel (v1.3.0/v1.4.0) dihapus. Kabel hanya bisa dipilih (seluruh rute tersorot biru), dihapus (tombol Hapus / Delete / Backspace), atau dibuat ulang. Panel Inspektor kabel kini menampilkan "Dari ... Ke ...".
- Dihapus karena digantikan sistem tautan: `findPinAt`, `addOrthogonalWire`, `simplifyWires`, `dragCorner`, `reconnectingWire`, mode tap-tap.
- Cincin penanda saat kursor di atas pin, pratinjau putus-putus berwarna hijau saat target valid, halo pada semua pin saat menarik kabel.
- Undo/Redo, Simpan/Muat kini menyertakan tautan kabel dan id komponen. Simpanan lama (tanpa tautan/id) masih bisa dimuat (kabel lama tampil sebagai segmen tunggal).
- Esc kini juga membatalkan mode menaruh komponen. Status kanvas menampilkan petunjuk saat mode menaruh aktif.
- Contoh rangkaian diubah ke format tautan; badge versi menjadi v1.5.
- Mesin simulasi tidak diubah.

**Pengujian**
- `node --check` lolos. Uji headless (Node, DOM dipalsukan): ketiga contoh rangkaian menghasilkan nilai wajar (LED 1,84 V / 21,7 mA; RC mengisi ke 8,84 V setelah 0,4 s); rute dari pin kanan ke pin kiri satu resistor melingkari badan komponen; menggeser dan memutar komponen berkabel tetap menghasilkan segmen siku-siku; hapus komponen menghapus kabelnya; undo/redo; memuat simpanan lama.
- Interaksi pointer (seret di kanvas) dan tampilan belum diuji langsung di browser.

**Catatan / keterbatasan**
- Kabel yang berakhir di tengah kabel lain (sambungan T) bisa lepas jika kabel induknya diroute ulang karena komponen digeser.
- `README.md` belum diperbarui di entri ini.

---

## 2026-11-22: v1.4.0, Sistem Kabel Pin-ke-Pin, Live Route Preview, dan Revert Pemindahan Ujung (Antigravity)
**Fitur & Peningkatan** (file: `index.html`)
- Pengkabelan Pin-ke-Pin Tegas (*Strict Pin-to-Pin*): kabel kini hanya dapat dimulai dan diakhiri pada pin/terminal komponen atau sambungan kabel yang sah; dilarang membuat kabel mengambang di ruang kosong.
- Dua Cara Penarikan Kabel: mendukung mode **Tap Pin-ke-Pin** (klik pin awal lalu klik pin tujuan) maupun **Klik-Geser (Drag-and-Drop)** dari pin ke pin.
- Preview Rute Kabel Real-Time: saat kabel ditarik, jalur rute ortogonal (siku-siku) langsung ditampilkan secara transparan bersama cincin hijau snap pada pin tujuan yang didekati. Melepas di ruang kosong otomatis membatalkan penarikan tanpa meninggalkan kabel menggantung.
- Pemindahan Ujung Kabel (*Endpoint Reconnecting with Revert*): saat salah satu ujung kabel pada komponen digeser, ujung tersebut dapat dipindahkan ke pin komponen lain. Jika tidak dilepas tepat di atas pin komponen yang sah, ujung kabel otomatis **kembali ke posisi semula** (tidak terputus).
- Sorotan Pin Komponen: saat alat Kabel aktif, semua terminal komponen di kanvas diberi halo visual lembut agar pengguna dengan mudah melihat titik-titik sambungan yang tersedia.

---

## 2026-11-22: v1.3.2, Perbaikan Bug Kabel Terputus Saat Digeser (Antigravity)
**Bug diperbaiki** (file: `index.html`)
- Ujung kabel yang terpasang pada terminal komponen (GND, Resistor, LED, Baterai, Saklar, dll.) kini terkunci kokoh dan tidak dapat ditarik lepas ke ruang kosong secara tidak sengaja.
- Sambungan sudut antar-kabel kini digerakkan bersamaan (`dragCorner` dengan koleksi semua titik sambungan): ketika sudut kabel digeser, seluruh ujung kabel yang bertemu di titik tersebut bergerak bersama tanpa pernah terpisah/terputus.
- Ujung kabel yang menempel di terminal komponen ditampilkan dengan indikator pin terkunci abu-abu, sedangkan sudut bebas antar-kabel dapat digeser fleksibel bersama.

---

## 2026-11-22: v1.3.1, Penyatuan Otomatis Kabel Garis Lurus (Wire Coalescing) (Antigravity)
**Dilakukan** (file: `index.html`)
- Algoritma Penyatuan Kabel Kolinear (`simplifyWires`): setiap segmen kabel lurus yang bersambungan tanpa cabang (tidak ada komponen lain atau kabel ke-3 di titik temu) otomatis dilebur menjadi satu segmen kabel utuh.
- Memastikan garis lurus selalu memiliki **hanya 1 titik tengah kuning**, sehingga tidak ada titik tengah ganda yang membingungkan pada satu garis lurus yang sama.
- Jika kabel dibengkokkan lalu dikembalikan posisinya ke garis lurus, kedua segmen otomatis menyatu kembali menjadi 1 kabel utuh saat dilepas.

---

## 2026-11-22: v1.3.0, Tombol Redo, Re-route Kabel, Hapus Berbasis Seleksi, Penyatuan Part (Antigravity)
**Dilakukan** (file: `index.html`)
- Tombol Redo: menggantikan tombol Putar di seksi Proyek (karena Putar sudah ada di Alat Kerja). Mendukung stack Redo dan pintasan `Ctrl+Y` / `Ctrl+Shift+Z`.
- Auto-Pilih: menaruh komponen ke kanvas kini otomatis beralih kembali ke alat Pilih (`sel`), mencegah penempatan duplikat tak sengaja dan memudahkan langsung memindah/menginspeksi.
- Seleksi & Re-route Kabel: kabel di kanvas kini bisa diklik/dipilih. Muncul 3 pegangan seleksi (ujung 1, titik tengah kuning, ujung 2). Menyeret titik kuning di tengah otomatis membengkokkan kabel menjadi dua segmen siku-siku.
- Hapus Berbasis Seleksi: tombol Hapus di Alat Kerja serta tombol `Delete` / `Backspace` kini langsung menghapus komponen atau kabel yang sedang aktif terpilih.
- Penyatuan Part: varian LED (Merah, Kuning, Hijau, Biru) dan Dioda (1N4148, 1N4007, 1N5819, BAT54) disatukan menjadi 1 item "LED" dan 1 item "Dioda" di Pick Parts dan palet. Pemilihan warna LED atau tipe dioda dilakukan lewat panel Inspektor saat komponen dipilih di kanvas.

---

## 2026-11-22: v1.2.0, Redesain UI/UX modern workbench ala Wokwi/Tinkercad, DSO Osiloskop, Pill Labels (Antigravity)
**Dilakukan** (file: `index.html`)
- Header modern: brand GetSimulated dengan badge v1.2, Simulation Control Hub di tengah (Play/Pause dengan status LED pulse, digital clock, dropdown resolusi waktu simulasi), tombol beralih tema, tombol panduan pintasan keyboard.
- Toolbar kiri (Tool dock): alat kerja (Pilih [V], Kabel [W], Putar [R], Hapus [Del]) bergaya segmented dock dengan indikator shortcut, tombol Pick Parts beraksen menonjol, dan mini-bar aksi proyek (Undo [Ctrl+Z], Simpan, Muat, Reset).
- Label nilai kanvas: ditambahkan rounded pill badge semi-transparan di belakang teks nilai tegangan dan arus agar selalu terbaca jelas dan tidak bertubrukan dengan kabel.
- Grid kanvas: titik grid disempurnakan dengan penanda divisi mayor bergaya alas kerja teknik (engineering mat).
- Digital Oscilloscope (DSO): latar CRT gelap dengan garis graticule pembagi horizontal & vertikal, crosshair tengah, sinyal jejak ber-glow cyan phosphor, serta telemetri Vpp dan Max real-time.
- Panel Inspektor: instrumen Digital Multi-Meter (DMM) dengan font monospace angka tabular (tegangan, arus, daya), kontrol nilai komponen yang lebih responsif.
- Modal Pick Parts: modal dengan backdrop blur, pencarian instan, dan filter kategori berbasis pill.
- Pintasan keyboard: V, W, R, Delete/Backspace, Spasi (Play/Pause), Ctrl+Z (Undo), Esc.
- Mesin simulasi (MNA, Euler backward, Newton-Raphson) 100% dipertahankan dan kompatibel penuh.

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
