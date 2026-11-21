# GetSimulated

Simulator elektronik berbasis web: satu file `index.html`, tanpa dependensi, bisa dibuka langsung di browser (desktop maupun ponsel).

## Fitur
- Komponen: baterai, sumber AC sinus, resistor, kapasitor, induktor, LED, dioda (1N4148, 1N4007, 1N5819, BAT54), saklar, GND.
- Nilai komponen lewat selector preset atau ketik bebas (akhiran SI: p, n, u, m, k, M, G).
- Editor: seret komponen, kabel (termasuk sambungan T), putar, hapus, undo (Ctrl/Cmd+Z), zoom dan geser tampilan.
- Pembacaan tegangan, arus, dan daya per komponen, ditambah osiloskop mini.
- Contoh rangkaian siap pakai, simpan/muat (localStorage), tema terang/gelap otomatis atau manual.

## Teknis
Modified Nodal Analysis, simulasi transien backward Euler, Newton-Raphson untuk dioda/LED. Detail riwayat dan keterbatasan ada di `LOG.md`.

## Aturan repo
Setiap review atau perubahan **wajib** dicatat di bagian paling atas `LOG.md`.
