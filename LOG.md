# LOG PERUBAHAN

> ⚠️ **WAJIB DIISI**: setiap kali me-review ATAU mengubah isi repo ini (kode, dokumen, konfigurasi),
> tambahkan entri baru di **bagian paling atas** log ini (tepat di bawah garis ini), terbaru di atas.
> Format: tanggal, siapa, apa yang dilakukan, file yang tersentuh, catatan/masalah.

---

## 2026-11-27: v1.10.2, Koreksi: LED/Dioda Terbalik Tidak Lagi Meledak (Claude)
**Masalah** (pertanyaan pemilik repo): apakah LED yang dipasang terbalik memang meledak? Di v1.10.0 LED terbalik pada tegangan lebih dari 5 V diberi pemanasan tambahan 0,5 W (suhu naik sekitar 500 °C), sehingga selalu meledak, bahkan ketika ada resistor seri.

**Penilaian**: itu berlebihan. Pada tegangan rendah LED terbalik umumnya hanya tidak menyala karena arus baliknya nyaris nol. Tegangan balik maksimum LED memang sekitar 5 V; di atas itu bisa terjadi tembus balik (breakdown) yang merusak LED bila arusnya tidak dibatasi, tetapi biasanya LED mati diam-diam, bukan meledak. Dengan resistor seri, arus tembusnya terbatas dan LED sering selamat. Model simulator tidak punya tembus balik, jadi tidak ada dasar memanaskan LED yang arusnya nol.

**Dilakukan** (file: `assets/js/core.js`, `index.html`, `README.md`, `LOG.md`; `app.js`, `style.css`, `editor.js`, `scope.js` tidak diubah)
- `pwr()`: baris penalti LED terbalik (`v < -5` menambah 0,5 W) dihapus. LED dan dioda kini dipanaskan hanya oleh v × i, sehingga terbalik = arus nyaris nol = suhu tetap rendah = hanya tidak menyala.
- `whyOf()`: pesan "tegangan balik terlalu besar" dihapus (sudah tidak mungkin terjadi).
- `README.md`: fitur dan tabel batas diperbarui (LED meledak karena arus maju berlebih, bukan karena terbalik; catatan bahwa model tembus balik belum ada). `?v=` di `index.html` dinaikkan ke `20261127-2`.
- Yang TETAP meledak: kapasitor elektrolit/tantalum terbalik (pada kenyataannya memang bisa menggembung dan meledak), kapasitor melewati tegangan kerja, korsleting baterai, LED tanpa resistor (arus maju berlebih), dan resistor/induktor/dioda kelebihan daya.

**Pengujian**
- BELUM diuji. Dibuat lewat konektor GitHub tanpa browser dan tanpa Node. Perubahan hanya menghapus dua kondisi; mohon coba: balik LED di contoh LED+resistor (LED harus mati/tidak menyala dan tidak meledak), dan pastikan korsleting baterai serta Elco terbalik masih meledak.

**Catatan / keterbatasan**
- Belum ada model tembus balik: LED terbalik pada tegangan tinggi (misalnya 24 V tanpa resistor) tidak dirusak sama sekali. Menambahnya berarti mengubah model dioda di solver (konduksi balik di sekitar −5 V) dan baru layak dikerjakan bila diminta.
- Belum ada peringatan di status kanvas untuk LED terbalik; bisa ditambahkan di `app.js` bila diinginkan.

---

## 2026-11-27: v1.10.1, Perbaikan: Baterai Tidak Meledak Saat Kutub + Disambung Langsung ke − (Claude)
**Masalah** (dilaporkan pemilik repo): baterai yang kutub + dan −nya disambung langsung dengan kabel tidak meledak.

**Penyebab**: panas komponen dihitung dari `|tegangan terminal × arus|`. Pada korsleting, kabel membuat kedua kutub satu simpul, sehingga tegangan terminal = 0 V walau solver menghitung arus sekitar 900 A (9 V / 10 mΩ hambatan dalam di solver). Hasilnya daya = 0 × 900 = 0 W, jadi suhu tidak pernah naik.

**Dilakukan** (file: `assets/js/core.js`, `index.html`, `README.md`, `LOG.md`; `app.js`, `style.css`, `editor.js`, `scope.js` tidak diubah)
- `pwr()` untuk Baterai dan Sumber AC kini memakai **rugi hambatan dalam 1 Ω × I²** (hanya untuk perhitungan panas; hitungan listrik di solver tetap memakai 10 mΩ). Korsleting 900 A menjadi sekitar 810 kW, jadi baterai meledak pada bingkai pertama.
- Daya nominal Baterai dan Sumber AC diturunkan dari 5 W ke **2 W** (batas meledak 100 °C tetap). Akibatnya, secara kasar, arus terus-menerus sekitar 1,6 A atau lebih akan memanaskan baterai sampai meledak dalam beberapa detik; beban ringan (puluhan mA) tidak berpengaruh. Contoh rangkaian bawaan tidak terpengaruh (arus 21,7 mA atau lebih kecil, panas sekitar 0,5 mW).
- Komentar kode dan `README.md` (tabel batas komponen) diperbarui. Nilai `?v=` di `index.html` dinaikkan ke `20261127` agar browser mengambil `core.js` yang baru.
- Indikator suhu baterai di Inspektor menampilkan "Daya" = nilai efektif ini (I² × 1 Ω), bukan daya keluaran v × i, sehingga angka di kartu DMM "Daya (P)" dan di indikator suhu bisa berbeda untuk baterai.

**Pengujian**
- BELUM diuji. Dibuat lewat konektor GitHub tanpa browser dan tanpa Node. Perhitungan manual: korsleting 900 A menghasilkan P efektif 8,1 × 10⁵ W, jadi suhu target jauh di atas batas dan batas 100 °C terlewati dalam satu bingkai (dt bingkai maks 0,1 s, konstanta waktu 1,5 s). Mohon coba: sambungkan kutub + dan − baterai langsung dengan kabel (baterai harus meledak), lalu Reset Simulasi, dan cek contoh bawaan masih tidak meledak.

**Catatan / keterbatasan**
- Rangkaian yang mengorsleting sumber lewat komponen lain (misalnya baterai langsung ke LED atau ke resistor sangat kecil) kini juga memanaskan baterai lewat I² × 1 Ω, jadi baterai ikut meledak selain komponen lainnya.
- Sumber AC yang dikorsleting meledak dengan cara yang sama.

---

## 2026-11-26: v1.10.0, Model Panas per Komponen, Ledakan Saat Rangkaian Salah, Indikator Suhu (Claude)
**Dilakukan** (file: `assets/js/core.js`, `assets/js/app.js`, `assets/css/style.css`, `index.html`, `README.md`, `LOG.md`; langsung ke `main`; `editor.js` dan `scope.js` tidak diubah)
- **Model panas.** Tiap komponen (Resistor, Induktor, LED, Dioda, Kapasitor, Baterai, Sumber AC) punya suhu `c.T`. Daya efektif dirata-rata dari 50 langkah simulasi per bingkai, lalu suhu mendekati `25 °C + P × 60 / Pnominal` dengan konstanta waktu 1,5 detik nyata. Pada daya nominal suhu naik 60 °C. Saklar dan GND tidak dimodelkan.
- **Ledakan.** Saat suhu mencapai batas (`Tmax`), komponen meledak: kilatan, 36 percikan api, asap yang terus keluar sekitar 6 detik, tanda silang gosong di komponen, label menjadi "RUSAK / meledak", dan pesan penyebab di status kanvas. Komponen rusak menjadi **rangkaian terbuka** (dikeluarkan dari solver); jaringan dibangun ulang dengan `build(true)` tanpa mengulang simulasi, jadi tegangan kapasitor dan waktu simulasi tetap berjalan.
- **Kesalahan rangkaian yang memicu ledakan** (diperkirakan, belum diuji di browser): baterai dikorsleting (arus ratusan ampere), LED langsung ke baterai tanpa resistor, resistor 0,25 W di arus besar (misalnya 22 Ω di 9 V), induktor langsung di baterai (tanpa hambatan), Elco/Tantalum terpasang terbalik dengan arus cukup besar (pemanasan 20 W per ampere), kapasitor melewati tegangan kerja (Elco 16 V, Keramik 50 V, Tantalum 10 V, Film 63 V), LED terbalik di atas 5 V. (Catatan: korsleting baterai langsung ternyata belum terdeteksi pada versi ini, diperbaiki di v1.10.1; LED terbalik dikoreksi di v1.10.2.)
- **Indikator suhu kecil** di panel Inspektor, di dalam blok pengaturan nilai komponen (di bawah selector/input nilai): batang gradasi hijau ke merah, angka °C, dan satu baris keterangan (daya dan nominal, atau tegangan dan batas untuk kapasitor, plus suhu rusak). Untuk komponen rusak tampil "Rusak" dengan batang abu-abu penuh, ditambah kotak peringatan "Komponen rusak" berisi penyebab.
- **Cahaya oranye** di belakang komponen yang mulai panas (mulai 55 °C, makin terang mendekati batas), dan peringatan di status kanvas bila ada komponen di atas 80% suhu rusak, atau bila ada komponen rusak ("Perbaiki rangkaian, lalu tekan Reset Simulasi").
- **Semantik build():** `build()` tanpa argumen kini juga memulihkan semua komponen rusak dan mendinginkan suhu (mengulang simulasi dari nol), sehingga mengedit rangkaian, undo/redo, memuat, Reset Simulasi, dan memilih contoh rangkaian otomatis "mengganti komponen baru". Satu konsekuensinya: menggeser komponen rusak ikut memulihkannya. `build(true)` dipakai hanya oleh ledakan.
- Tips di jendela Bantuan dan Panduan Cepat menyebut panas dan ledakan. Badge versi v1.10, `?v=` di `index.html` dinaikkan ke `20261126`. `README.md`: fitur baru dan tabel batas komponen.
- Contoh rangkaian bawaan dihitung manual agar tidak meledak: LED+resistor (LED sekitar 65 °C, resistor sekitar 62 °C, baterai sekitar 27 °C), RC (daya kecil), penyearah (daya kecil, Elco di polaritas benar, tegangan puncak 5 V < 16 V).

**Pengujian**
- BELUM diuji. Dibuat lewat konektor GitHub tanpa browser dan tanpa Node, jadi `node --check` dan uji di browser belum dijalankan; kode hanya ditinjau manual. Parameter (nominal, batas, konstanta waktu) adalah perkiraan dan belum dikalibrasi lewat simulasi.
- Mohon coba setelah deploy: (1) contoh LED+resistor: pastikan tidak ada ledakan dan indikator suhu bergerak; (2) hubungkan baterai langsung ke GND (korsleting): baterai harus meledak; (3) ganti resistor 330 Ω menjadi 10 Ω di contoh 1: resistor lalu LED harus meledak; (4) balik Elco di contoh RC; (5) tekan Reset Simulasi dan pastikan semua pulih; (6) cek console browser untuk error.

**Catatan / keterbatasan**
- Fisika disederhanakan: tidak ada hambatan dalam baterai nyata (hanya 10 mΩ), tidak ada sekering, tidak ada efek suhu pada nilai komponen, dan induktor ideal tanpa hambatan akan meledak jika langsung ke sumber DC.
- Suhu hanya berubah selama simulasi berjalan (tidak mendingin saat dijeda).
- Bila ledakan terlalu mudah atau terlalu sulit terpicu, parameter ada di tabel `TH` dan `CAPV` di `core.js` (`Pr`, `Tmax`) serta `THAU`.
- Efek ledakan dibatasi sekitar 400 partikel; komponen rusak tetap tampil gosong sampai rangkaian diedit atau direset.

---

## 2026-11-25: Pisahkan index.html menjadi CSS dan beberapa file JS di folder assets/ (Claude)
**Dilakukan** (file: `index.html`, `assets/css/style.css` baru, `assets/js/core.js` baru, `assets/js/scope.js` baru, `assets/js/editor.js` baru, `assets/js/app.js` baru, `README.md`, `LOG.md`; dikirim langsung ke `main` atas permintaan pemilik repo)
- `index.html` dari satu file ±85 KB menjadi kerangka HTML (±9 KB) yang memuat `assets/css/style.css` dan empat skrip klasik berurutan: `core.js` (data komponen, state, util, rute kabel, solver MNA), `scope.js` (osiloskop: akuisisi, pemicu, Autoset, `drawScope`), `editor.js` (pointer/zoom, undo/redo, simpan/muat, keyboard), `app.js` (toolbar, Pick Parts, Inspektor, gambar kanvas, loop, boot).
- Isi kode **dipindah apa adanya** tanpa mengubah logika. Satu-satunya perpindahan: `drawScope()` dari bagian gambar ke `scope.js`, dan blok solver (`fmt` sampai `step`) digabung ke `core.js` tepat setelah data/state. Skrip klasik berbagi lingkup global, jadi `onclick="..."` di HTML dan referensi antar-file tetap berfungsi.
- Alasan: browser bisa meng-cache CSS/JS terpisah dan server hanya menyajikan file statis kecil. Simulasi tetap berjalan di browser pengunjung (bukan di server); PHP tidak dipakai karena tidak mengurangi beban dan justru menambah proses server.
- Link CSS/JS memakai `?v=20261125` untuk pembatalan cache; nilai ini harus diganti saat file di `assets/` berubah.
- `README.md`: bagian struktur file, cara menjalankan, deploy, dan catatan cache diperbarui. Workflow `deploy.yml` TIDAK diubah: ia sudah meng-upload seluruh isi repo kecuali `.git*`, `.github/`, `README.md`, `LOG.md`, jadi folder `assets/` ikut terkirim.
- Urutan kerja: pekerjaan pertama dibuat di branch `split-files` (tidak dipakai lagi), lalu isi yang identik (SHA blob file sama) dikirim ke `main`. Setiap commit ke `main` memicu satu run deploy; run diantrekan oleh `concurrency`, dan run terakhir yang berisi keadaan lengkap.

**Pengujian**
- BELUM diuji. Dibuat lewat konektor GitHub tanpa browser dan tanpa Node, jadi `node --check` per file dan uji di browser belum dijalankan. Pemisahan hanya ditinjau manual (urutan pemuatan dan kode yang berjalan saat dimuat dicek dengan membaca).
- Mohon coba setelah deploy: buka situs, pastikan tidak ada error di console, lalu cek contoh rangkaian, tarik kabel dari pin, ganti tipe kapasitor, osiloskop (Autoset), simpan/muat, dan tema gelap.

**Catatan / keterbatasan**
- Karena langsung ke `main`, deploy ke InfinityFree berjalan otomatis. Bila ada error, cara tercepat memulihkan adalah mengembalikan `index.html` ke commit sebelumnya (`a7e6160`), yang masih berisi seluruh kode dalam satu file.
- Urutan `<script>` di `index.html` wajib `core`, `scope`, `editor`, `app`. `app.js` memuat kode boot (`exm(0)`, `loop()`) sehingga harus terakhir.
- Bila situs lama tertinggal di cache pengunjung, naikkan nilai `?v=` pada link di `index.html`.
- Branch `split-files` masih ada di GitHub dan boleh dihapus.

---

## 2026-11-25: Deploy otomatis ke InfinityFree lewat GitHub Actions (Claude)
**Dilakukan** (file: `.github/workflows/deploy.yml` baru, `README.md`, `LOG.md`; `index.html` tidak diubah)
- Workflow **"Deploy ke InfinityFree"**: setiap push ke `main` (atau tombol Run workflow di tab Actions) meng-upload isi repo ke `/htdocs/` lewat FTP memakai `SamKirkland/FTP-Deploy-Action@v4.3.5` (protokol ftp, port 21). Dikecualikan dari upload: `.git*`, `.github/`, `README.md`, `LOG.md`, jadi yang tampil di situs hanya `index.html`.
- Butuh tiga **Repository secret** yang diisi pemilik repo sendiri (konektor tidak bisa mengisi secret): `FTP_SERVER` (hostname FTP dari panel InfinityFree > Manage > FTP Details, bukan domain situs), `FTP_USERNAME`, `FTP_PASSWORD`.
- Bila upload pertama gagal (FTP InfinityFree kadang menolak sesaat), workflow menunggu 20 detik lalu mencoba sekali lagi. Run yang bersamaan diantrekan (`concurrency`), tidak dibatalkan.
- Action menyimpan satu file pelacak `.ftp-deploy-sync-state.json` di `htdocs` agar run berikutnya hanya mengunggah file yang berubah.
- `README.md`: ditambah bagian "Deploy otomatis ke InfinityFree" berisi langkah pengaturan satu kali.

**Pengujian**
- BELUM diuji. Workflow dibuat lewat konektor GitHub tanpa bisa menjalankannya. Commit pembuatan workflow ini sendiri memicu satu run; hasilnya (berhasil/gagal, tergantung secret sudah benar atau belum) dilihat di tab **Actions**.

**Catatan / keterbatasan**
- Bila FTP InfinityFree menolak koneksi dari server GitHub, atau `server-dir`/hostname perlu disesuaikan, workflow perlu diubah setelah melihat pesan error di log Actions.
- Password FTP tersimpan sebagai secret GitHub dan tidak boleh ditulis di repo atau log.
- Hanya file yang ada di repo yang diupload; file yang ditambah langsung di server lewat panel tidak dilacak.

---

## 2026-11-24: v1.9.0, Polaritas Kapasitor Berpengaruh, Nama Pin Saat Ditekan, Panduan Disederhanakan (Claude)
**Dilakukan** (file: `index.html`, `README.md`, `LOG.md`)
- **Polaritas Elco dan Tantalum kini memengaruhi simulasi.** Kapasitor berkutub dimodelkan sebagai kapasitor ideal dengan **dioda proteksi terbalik** di dalamnya (anoda pin 2, katoda pin 1, sekitar 1 V pada 10 mA). Dipasang benar (pin 1 = +) berperilaku seperti kapasitor biasa; dipasang terbalik, tegangannya terjepit sekitar −1 V dan arus mengalir lewat dioda itu. Arus yang ditampilkan sudah memasukkan arus dioda. Status kanvas menampilkan **"Peringatan: kapasitor berkutub terpasang terbalik"** bila tegangannya di bawah −0,5 V. Keramik dan Film tidak berkutub (tanpa dioda).
- Selama dioda terbalik jelas mati (< 0,3 V), solver tidak menambah iterasi, sehingga kapasitor yang terpasang benar tidak memperlambat simulasi.
- Teks keterangan polaritas di Inspektor kapasitor dihapus.
- **Nama pin muncul saat pin ditekan.** Tekan sebuah pin untuk melihat balon nama dan kutubnya di pin itu; tetap terlihat 2,5 detik setelah dilepas. Saat menyambung kabel, pin tujuan yang disorot juga menampilkan namanya. Nama sesuai komponen aslinya: Baterai (− Negatif / + Positif), Sumber AC (Terminal − / +), LED dan Dioda (Anoda (+) / Katoda (−)), Elco dan Tantalum (+ Positif / − Negatif), Resistor, Induktor, dan Kapasitor tanpa kutub (Kaki 1 / Kaki 2), Saklar (Kontak 1 / 2), GND. Balon merah untuk kutub positif, biru untuk negatif, abu-abu untuk netral; ukurannya tetap saat zoom. Inspektor kabel ikut memakai nama pin ini ("Dari ... Ke ...").
- **Panduan disederhanakan.** Panduan Cepat dipangkas jadi intro pendek dan dua butir (menyambung kabel; memilih, menekuk, dan menghapus kabel); butir menaruh komponen otomatis dan butir geser/putar dihapus, dan kalimat "Rutenya diatur otomatis" dibuang. Jendela Bantuan (?) dirapikan: tabel pintasan dengan keterangan singkat, serta lima tips pendek (kabel, menekuk kabel, nama pin, menghapus, osiloskop). Teks di Inspektor kabel dipersingkat.
- Badge versi v1.9; README diperbarui.

**Pengujian**
- Model polaritas diuji terpisah di Node dengan salinan stamping solver: Elco terpasang benar mengisi sampai 5,000 V tanpa iterasi tambahan; Elco terbalik terjepit di −0,953 V dengan arus −4,05 mA (rangkaian 5 V lewat 1 kΩ); kapasitor tanpa kutub mencapai −5,000 V (tidak dijepit).
- BELUM diuji: kode kanvas/DOM (balon nama pin, teks panduan, peringatan di status) dan tampilan di browser; `node --check` seluruh `index.html` juga belum dijalankan karena konektor GitHub tidak punya browser. Mohon coba: tekan pin tiap jenis komponen, sambungkan kabel dan lihat nama pin tujuan, balik arah Elco di contoh RC lalu lihat peringatan dan tegangan terjepit.

**Catatan / keterbatasan**
- Model terbalik hanya penjepit dioda: tidak ada tegangan kerja maksimum, ESR, arus bocor normal, kerusakan/meledak, atau perbedaan khusus Tantalum.
- Nama pin muncul saat pin ditekan (bukan saat kursor hanya melayang), jadi tidak tampil di layar sentuh tanpa menyentuh pin.

---

## 2026-11-24: v1.8.0, Osiloskop Stabil dengan Pemicu, Volt/div, dan Time/div (Claude)
**Masalah**: jejak osiloskop bergeser terus dari kanan ke kiri (buffer bergulir) sehingga gelombang non-datar sulit dibaca.

**Dilakukan** (file: `index.html`, `README.md`, `LOG.md`)
- **Tampilan diam seperti DSO sungguhan.** Sampel diambil pada laju sesuai Time/div (600 titik per layar, interpolasi linear antar langkah simulasi) ke buffer pra-pemicu. Saat sinyal melewati level pemicu pada tepi yang dipilih, satu bingkai 600 titik ditangkap dengan titik pemicu di **tengah layar**; bingkai hanya diganti saat ada pemicu baru, jadi sinyal berulang tampil diam. Koreksi sub-sampel meletakkan titik persilangan tepat di tengah (tidak ada getaran satu sampel).
- **Volt/div**: 10 mV sampai 50 V (12 langkah). **Time/div**: 100 µs sampai 500 ms (12 langkah). Layar kini graticule 10 x 8 div dengan tanda 1/5 div di sumbu tengah (kanvas dipertinggi dari 100 px ke 200 px).
- **Pemicu**: mode **Auto** (bila tidak ada pemicu selama setengah layar, bingkai digambar sendiri; sinyal DC tampil datar), **Normal** (hanya menampilkan bingkai bila terpicu, bingkai terakhir ditahan), **Single** (menangkap satu bingkai lalu berhenti). Tepi naik / turun, **Level** (slider dalam div layar, tegangan ditampilkan di sampingnya), dan penanda level (segitiga kuning di kanan + garis putus-putus), penanda posisi pemicu (atas tengah), penanda 0 V (segitiga biru di kiri).
- **Posisi Y** (geser jejak vertikal, ±4 div), tombol **Run/Stop**, dan **Autoset** (memilih Volt/div, Posisi Y, level di tengah sinyal, dan Time/div dari frekuensi sumber AC atau frekuensi hasil ukur).
- Status di header layar: AUTO, TRIG'D, WAIT, STOP, PAUSE, STANDBY. Baris hasil ukur di bawah layar: Vpp, Max, Min, dan frekuensi (dari bingkai terakhir), serta peringatan bila sinyal di luar layar atau Time/div terlalu cepat untuk dt yang dipilih.
- Buffer osiloskop direset saat komponen lain dipilih, rangkaian berubah/direset, atau Time/div diganti. Sebelum simulasi dimulai (t < 0) jejak sengaja kosong.
- `S.hist` dihapus; bantuan (tombol ?), README, dan badge versi (v1.8) diperbarui. Mesin simulasi tidak diubah.

**Pengujian**
- Logika akuisisi (pemicu, bingkai, mode Auto/Normal/Single, hasil ukur) diuji terpisah di Node dengan sinyal sintetis: sinus 50 Hz terpicu stabil (frekuensi terukur 50 Hz, bingkai identik pada level 2 V), sinyal DC 9 V tampil datar di Auto, mode Single berhenti setelah satu bingkai, sinyal tanpa persilangan di Auto digambar sendiri. Koreksi sub-sampel ditambahkan setelah uji itu dan tidak diuji ulang.
- BELUM diuji: kode kanvas/DOM (gambar graticule, kontrol, slider) dan tampilan di browser. Perubahan dibuat lewat konektor GitHub tanpa lingkungan browser, jadi `node --check` seluruh `index.html` juga belum dijalankan. Mohon dicoba: pilih sumber AC lalu Autoset, ubah Volt/div dan Time/div, coba Normal dan Single, geser Level dan Posisi Y, dan pilih kapasitor di contoh RC dengan Time/div 50 ms.

**Catatan / keterbatasan**
- Contoh penyearah (setengah gelombang): level bawaan 0 V tidak pernah terlewati sinyal 0–4 V, jadi Auto menggambar bingkai sendiri (tidak terkunci). Tekan **Autoset** agar level pindah ke tengah sinyal.
- Pemicu hanya mendeteksi persilangan pada laju sampel osiloskop; resolusi waktu dibatasi dt simulasi (garis diinterpolasi linear di antara langkah).
- Time/div besar lambat di waktu nyata (jendela 5 s pada 500 ms/div dengan laju simulasi sekitar 0,3x). Tidak ada mode roll, kopling AC/DC, posisi horizontal, atau kursor ukur.

---

## 2026-11-23: v1.7.0, Tipe Kapasitor (Elco, Keramik, Tantalum, Film) dengan Nilai Manual (Claude)
**Dilakukan** (file: `index.html`, `README.md`, `LOG.md`)
- Kapasitor kini punya **tipe**: Elco (elektrolit), Keramik, Tantalum, Film/Mylar. Dipilih lewat selector **Tipe** di Inspektor. Tipe disimpan di komponen (`ct`) sehingga ikut undo/redo, simpan/muat, dan contoh rangkaian (contoh RC dan penyearah memakai Elco). Komponen atau simpanan lama tanpa tipe dianggap Elco.
- **Kapasitansi diisi manual** (selector nilai preset dihapus khusus kapasitor, `p` pada `T.C` dibuang). Nilai bawaan tetap **10 µF**. Akhiran SI sama seperti sebelumnya (p, n, u, m, ...).
- Tampilan Gambar: Elco = silinder biru dengan pita (−) dan tanda (+); Keramik = cakram oranye; Tantalum = manik kuning dengan pita gelap dan tanda (+); Film/Mylar = kotak merah. Tanda (+)/(−) digambar tegak walau komponen diputar.
- Tampilan Skema: Elco dan Tantalum memakai simbol berkutub (plat lurus = + di pin 1, plat lengkung = − di pin 2, plus tanda +); Keramik dan Film tetap dua plat lurus.
- Label di kanvas menampilkan tipe, contoh "Elco 10µF".
- Pick Parts: kapasitor tetap satu entri; kata kunci pencarian ditambah (elco, elektrolit, keramik, tantalum, film, mylar, mkt).
- Badge versi v1.7; fitur di `README.md` diperbarui. Mesin simulasi tidak diubah.

**Pengujian**
- BELUM dijalankan. Perubahan dibuat lewat konektor GitHub tanpa lingkungan eksekusi, jadi `node --check` dan uji di browser belum dilakukan; kode hanya ditinjau manual. Mohon buka `index.html` dan coba: taruh kapasitor, ganti tipe, ketik nilai, putar, ganti tampilan Gambar/Skema, undo/redo, simpan/muat.

**Catatan / keterbatasan**
- Tipe hanya mengubah tampilan. Kapasitor tetap ideal: tidak ada ESR, arus bocor, tegangan kerja maksimum, atau peringatan pemasangan terbalik pada Elco/Tantalum. (Diperbarui di v1.9.0: polaritas kini memengaruhi simulasi.)
- Konvensi polaritas kapasitor: pin 1 = (+) (sesuai contoh RC dan penyearah). Ini berbeda dari Baterai yang (+)-nya di pin 2.

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
