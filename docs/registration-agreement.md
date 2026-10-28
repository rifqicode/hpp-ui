# Persetujuan registrasi Ekatra POS

Isi dan versi dokumen disimpan pada tabel PostgreSQL `legal_documents`. Frontend mengambil versi aktif melalui endpoint publik `GET /api/auth/service-agreement`; `src/features/auth/components/service-agreement.tsx` hanya merender respons API sebagai teks. Kode backend tidak lagi menjadi sumber naskah atau versi aktif, dan tidak ada fallback ke dokumen lokal.

## Referensi penulisan

Diakses 27 Oktober 2026. Naskah ditulis ulang untuk fitur Ekatra POS; ketentuan komersial, identitas badan usaha, kontak, dan klaim keamanan perusahaan referensi tidak disalin.

- [Syarat dan Ketentuan Majoo](https://majoo.id/syarat-dan-ketentuan): struktur persetujuan, kewenangan pengguna, penggunaan layanan, dan penghentian.
- [Privasi dan Kebijakan Majoo](https://majoo.id/privasi-dan-kebijakan): tujuan pemrosesan, penyimpanan, dan pengungkapan data.
- [Persyaratan Layanan Mekari](https://mekari.com/persyaratan-layanan/): akun, akses tim, data usaha, paket dan biaya.
- [Pemberitahuan Privasi Mekari](https://mekari.com/id/privacy/): pengelompokan data, tujuan pemrosesan, dan hak pengguna.
- [UU Nomor 27 Tahun 2022, JDIH Komdigi](https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/crc32/): acuan hak subjek data serta kewajiban pemrosesan data pribadi di Indonesia.

## Perilaku persetujuan

1. Checkbox dinonaktifkan saat formulir pertama dibuka.
2. Pengguna membuka dokumen dan menggulir area dokumen sampai akhir. Membuka, menggulir sebagian, atau menutup dialog tidak membuka checkbox.
3. Setelah mencapai akhir, tombol “Selesai membaca dan setuju” aktif. Klik tombol tersebut menutup dialog dan otomatis mencentang persetujuan. Scroll saja atau menutup melalui Escape/tombol tutup tidak memberikan persetujuan.
4. Tombol lanjut aktif ketika nama, email valid, kata sandi valid, konfirmasi yang cocok, pencapaian akhir dokumen, dan persetujuan terpenuhi.
5. Handler formulir memeriksa ulang persyaratan saat submit. Persetujuan diperiksa kembali sebelum permintaan registrasi dikirim.
6. Kembali dari langkah profil toko mempertahankan persetujuan dalam sesi komponen. Memuat ulang halaman mengharuskan pembacaan dan persetujuan kembali.

Area dokumen dapat difokuskan dan digulir dengan keyboard; Escape menutup dialog tanpa memberikan persetujuan. Footer tetap terpisah dari area gulir.

Pemeriksaan scroll merupakan pengunci antarmuka; pemeriksaan tersebut tidak membuktikan seseorang memahami isi. Persetujuan dikirim bersama permintaan registrasi dan divalidasi ulang di backend.

## Penyimpanan persetujuan

`POST /api/auth/register` sekarang mewajibkan objek berikut bersama data akun dan toko:

```json
{
  "consent": {
    "accepted": true,
    "document_version": "2026-10-27"
  }
}
```

Frontend mengirim versi dari dokumen yang berhasil diambil dan dibaca. Saat registrasi, backend membaca dan mengunci bersama (`FOR SHARE`) baris dokumen aktif di dalam transaksi registrasi, lalu membandingkan versinya. Persetujuan yang hilang, ditolak, atau memakai versi lain menghasilkan HTTP 400 sebelum akun dibuat. Waktu persetujuan tidak diterima dari klien; server mencatat waktu UTC saat registrasi diproses.

Endpoint dokumen mengembalikan `version`, `title`, `app_name`, `sections` (judul dan paragraf), serta `closing_text`, dengan header `Cache-Control: no-store`. Dokumen dimuat saat halaman registrasi dibuka. Ketika pemuatan gagal atau respons kosong/tidak lengkap, persetujuan dan tombol lanjut tetap terkunci; pengguna dapat mencoba lagi. Tidak ada fallback ke dokumen lokal. Jika versi aktif berubah saat pengguna masih mengisi form, backend menolak versi sebelumnya dan meminta pengguna memuat ulang lalu menyetujui dokumen terbaru.

Perubahan dokumen berikutnya dilakukan dengan menambahkan baris baru di database dan menerbitkannya sebagai versi aktif. Tidak perlu mengubah atau merilis ulang frontend maupun backend. `hpp-backend/internal/domain/agreement_document.go` hanya mendefinisikan struktur dan validasi isi JSON.

Migration `000050` membuat catatan persetujuan. Migration `000052_store_legal_documents` hanya membuat schema tabel, indeks, constraint, dan trigger, termasuk kolom `document_id` pada `user_agreement_consents`. Snapshot lengkap versi `2026-10-27` diisi oleh `seeders/000004_seed_legal_documents.sql`, yang terdaftar dalam `make seed`. Seeder dapat dijalankan ulang tanpa menimpa isi, timestamp, atau versi aktif yang lebih baru.

Catatan persetujuan mencakup `id`, `user_id`, `document_id`, `document_version`, dan `accepted_at`. Foreign key gabungan memastikan ID dan versi merujuk ke snapshot yang sama; indeks unik mencegah catatan ganda untuk user/versi yang sama. Penyimpanannya memakai transaksi yang sama dengan akun, toko, dan kode verifikasi. Kegagalan penyimpanan membatalkan seluruh transaksi.

Setiap baris `legal_documents` memiliki `id`, `document_type`, `version`, `content` (JSONB lengkap: versi, judul, nama aplikasi, urutan bagian/paragraf, dan teks penutup), `is_active`, serta `created_at`. Trigger database menolak perubahan isi, versi, identitas, dan waktu pembuatan serta menolak penghapusan snapshot. Hanya status aktif yang dapat diganti. Indeks parsial mengizinkan satu versi aktif untuk dokumen gabungan ini.

Seeder menghubungkan persetujuan lama untuk versi `2026-10-27` ke snapshot awal tanpa mengubah waktu persetujuannya. Jika ditemukan versi historis lain yang belum memiliki snapshot, transaksi seeder dibatalkan agar operator menyediakan naskah persisnya sebelum melanjutkan. Migration tidak melakukan insert atau backfill data.

Constraint `ck_consent_document_required` memakai `NOT VALID` agar catatan lama dapat melewati perubahan schema sebelum backfill. Constraint tetap menolak insert/update baru tanpa ID dokumen. Seeder kemudian mengisi ID yang masih kosong dan memeriksa bahwa seluruh persetujuan lama sudah terhubung.

Jika database tidak menyediakan dokumen aktif yang valid, endpoint dokumen dan registrasi mengembalikan HTTP 503. Tidak ada penggantian otomatis dengan teks dari kode.

Urutannya: jalankan `make migrate-up`, lalu `make seed`, kemudian aktifkan backend terbaru. Tanpa seeder/dokumen aktif, endpoint dokumen dan registrasi mengembalikan HTTP 503. Pada CI yang menjalankan seed secara kondisional, aktifkan opsi `run_seed`, gunakan penanda `[seed]`, atau jalankan seeder secara terpisah. Catatan ini dibuat untuk registrasi baru; tidak ada kolom IP atau user agent tambahan. Down migration `000052` menghapus snapshot dan relasi ID dokumen, tetapi mempertahankan catatan user, versi, dan waktu persetujuan.

## Menerbitkan perubahan dokumen

Tambahkan baris `legal_documents` dengan ID baru, `document_type = 'terms_and_privacy'`, versi baru yang unik, `content` lengkap sesuai format API, dan `is_active = false`. Nilai `content.version` harus sama dengan kolom `version`. Periksa naskah sebelum diterbitkan; snapshot tidak dapat diedit setelah dibuat. Tidak ada menu admin atau endpoint tulis baru dalam perubahan ini.

Untuk mengaktifkan versi yang telah ditambahkan, ganti contoh versi di bawah dengan versi yang dimaksud. Satu pernyataan ini mengubah status aktif secara atomik dan gagal jika versi tujuan tidak ditemukan:

```sql
DO $$
DECLARE target_id UUID;
BEGIN
  SELECT id INTO STRICT target_id
  FROM legal_documents
  WHERE document_type = 'terms_and_privacy' AND version = '2026-11-01';

  UPDATE legal_documents SET is_active = FALSE
  WHERE document_type = 'terms_and_privacy' AND is_active AND id <> target_id;
  UPDATE legal_documents SET is_active = TRUE WHERE id = target_id;
END;
$$;
```

Persetujuan yang sudah ada tetap merujuk ke snapshot versi sebelumnya.

Uji backend: `go test ./...`. Uji PostgreSQL dengan migration asli, penyimpanan, foreign key, duplikasi, dan rollback tersedia melalui `HPP_TEST_DATABASE_DSN` pada database uji disposable; tes dilewati jika variabel tidak disediakan.

Contoh verifikasi manual pada server lokal (gunakan alamat email uji yang belum terdaftar):

```sh
curl -i http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  --data '{"name":"Consent Test","email":"consent-test@example.com","password":"Password123!","store":{"name":"Toko Uji"},"consent":{"accepted":true,"document_version":"2026-10-27"}}'

curl -i http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  --data '{"name":"Consent Test","email":"consent-rejected@example.com","password":"Password123!","store":{"name":"Toko Uji"}}'
```

Permintaan pertama seharusnya menghasilkan HTTP 201 dan satu baris persetujuan untuk user baru. Permintaan kedua seharusnya menghasilkan HTTP 400 tanpa membuat akun. Verifikasi dengan query:

```sql
SELECT consent.user_id, consent.document_id, consent.document_version,
       consent.accepted_at, document.content
FROM user_agreement_consents AS consent
JOIN users ON users.id = consent.user_id
JOIN legal_documents AS document
  ON document.id = consent.document_id AND document.version = consent.document_version
WHERE users.email = 'consent-test@example.com';
```

## Identitas dan praktik operasional

Nama badan usaha serta email/nomor bantuan belum diberikan. Naskah memakai nama aplikasi dan merujuk kanal bantuan resmi di halaman utama. Lengkapi identitas dan kontak nyata, serta pastikan praktik penyimpanan, penyedia pendukung, dan penanganan permintaan sesuai naskah sebelum publikasi.

## Validasi

- Tes komponen/alur autentikasi mencakup scroll sebagian, pembacaan hingga akhir, persetujuan eksplisit, email tidak valid, pencabutan persetujuan, serta kembali ke langkah akun.
- Tes backend memeriksa dokumen dari repository, penolakan versi usang, penyimpanan ID snapshot, serta HTTP 503 saat dokumen tidak tersedia atau rusak.
- Tes PostgreSQL memeriksa bahwa migration tidak mengisi data, seeder mengisi dokumen/backfill dengan benar, dan menjalankan ulang seeder tetap mempertahankan isi lama serta versi aktif yang lebih baru.
- Tes integrasi repository melalui driver PostgreSQL tetap membutuhkan `HPP_TEST_DATABASE_DSN`; tes ini dilewati jika variabel tersebut belum dikonfigurasi.
- Skenario browser: `npx playwright test e2e/registration-consent.spec.ts`. Mencakup keyboard, muat ulang, dan viewport 360 × 640.
- Eksekusi browser pada lingkungan agen terhalang izin sandbox: server Vite gagal bind dengan `EPERM` dan Chromium gagal diluncurkan dengan `Operation not permitted`. Tampilan mobile dan scroll keyboard nyata belum terverifikasi di browser.

## Arah perubahan UI

Mengikuti tampilan registrasi yang sudah ada: teks isi slate pada putih, aksen primary untuk aksi, judul bagian untuk navigasi dokumen. ENERGY 1 / RHYTHM 1 / MOTION 1. Dialog dibatasi tinggi viewport dan hanya isi dokumen yang digulir agar status dan tombol tetap dapat dijangkau. Tidak ada aset atau klaim sertifikasi baru.
