# Ekatra POS

Aplikasi Kasir & Dapur. Slogan: **Satu Alur, Usaha Teratur.**

| Warna | HEX | RGB | Penggunaan |
| --- | --- | --- | --- |
| Ekatra Indigo | `#5048E5` | `80, 72, 229` | Identitas utama, tombol utama, navigasi aktif, fokus |
| Growth Emerald | `#10B981` | `16, 185, 129` | Status positif, bahan segar, efisiensi HPP, pertumbuhan laba kotor |

Token sumber ada di `src/index.css`: `--brand-indigo` dan `--brand-emerald`. Komponen memakai token semantik seperti `--primary`, `--success`, dan `--ring`.

Teks di atas emerald memakai hijau gelap `#052E24`. Teks emerald pada latar terang memakai `--success-text` (`#047857`), dan pada latar gelap memakai `#6EE7B7`. Mode gelap memakai indigo terang `#A5B4FC` untuk menjaga keterbacaan tombol dan tautan. Warna dasar logo tetap tersedia melalui token brand.

Halaman publik dengan permukaan putih memakai `.brand-light-surface` agar warna aksi tetap sesuai latarnya saat preferensi mode gelap aktif. Pilihan warna toko pada storefront tetap mengikuti pengaturan masing-masing toko.
