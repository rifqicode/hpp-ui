# Unit, component, hook, dan page tests

## Menjalankan test

Dari `hpp-ui`, pasang dependency dengan `npm install`, lalu jalankan:

```sh
npm test
npm run test:typecheck
npm run test:coverage
npm run test:legacy
```

`npm run test:coverage` memakai V8 dan gagal jika salah satu metrik statements, branches, functions, atau lines kurang dari 85%. Scope mencakup seluruh `src/**/*.ts` dan `src/**/*.tsx`, termasuk file yang tidak diimport test. Hanya bootstrap `src/main.tsx` dan deklarasi `.d.ts` yang dikecualikan.

Report dibuat di:

- `coverage/index.html`: rincian baris dan cabang per file.
- `coverage/coverage-summary.json`: persentase tiap metrik.
- `coverage/lcov.info`: input untuk layanan laporan coverage.

Threshold adalah persyaratan kelulusan, bukan bukti bahwa hasil pengukuran sudah mencapai 85%. Pada penambahan suite ini, registry npm tidak dapat diakses (`EAI_AGAIN`), dependency test belum terpasang, dan report coverage belum dihasilkan. Lockfile juga perlu diperbarui melalui `npm install` sebelum menjalankan `npm ci`.

## Struktur dan batas test

| Direktori / file | Tanggung jawab |
|---|---|
| `tests/unit` | Format angka dan mata uang, konversi satuan, routing menu, validasi, kalkulasi HPP/margin, layout kalender, mapping response, dan API interceptor |
| `tests/components` | Input, filter, tabel, pagination, upload, password, avatar, switch, dan feedback quota/langganan |
| `tests/hooks` | Lifecycle auth, CRUD inventaris, race response detail, permissions, role form, quota, loading, dan isolasi query antar toko |
| `tests/pages/all-pages.test.tsx` | Render seluruh halaman menggunakan hook dan komponen asli dengan service fixture |
| `tests/pages/app-routes.test.tsx` | Pemetaan route dan redirect alias; page diganti stub hanya untuk mengisolasi router |
| `tests/pages/auth-flows.test.tsx` | Validasi dan alur login, registrasi, OTP, undangan, dan pemulihan password |
| `tests/pages/product-list.test.tsx` | Filter URL, mode tampilan, izin, quota, retry, dan konfirmasi hapus produk |
| `tests/pages/error-states.test.tsx` | Penanganan detail yang gagal dimuat serta retry langganan |
| `tests/support` | Fixture bertipe, QueryClient per render, MemoryRouter, dan mock batas API |

Render contract memastikan halaman bisa ditampilkan dengan data fixture. Test interaksi terpisah memeriksa hasil tindakan user; render contract sendiri tidak membuktikan seluruh cabang halaman sudah diuji. Gunakan report coverage untuk menentukan cabang tambahan setelah runner dapat dijalankan.

Mock service berlaku hanya di suite yang memanggil `mockPageServices()`. Request API yang tidak punya fixture ditolak agar test tidak memakai backend atau jaringan. Unit test interceptor dan auth service memakai adapter Axios lokal untuk menjalankan request/response pipeline asli. Retry query dimatikan dalam test dan QueryClient dibuat per render agar cache tidak bocor ke kasus lain.

## Hasil scan halaman

Seluruh 34 file halaman memiliki render contract di `tests/support/page-cases.ts`. `all-pages.test.tsx` membandingkan daftar ini dengan `import.meta.glob` agar halaman baru yang belum didaftarkan menyebabkan test gagal. HPP calculator lama tetap masuk scope walaupun route aplikasi sekarang mengarah ke halaman simulasi resep.

| File di `src/pages` | Route / entry test |
|---|---|
| `auth/accept-invite-page.tsx` | `/accept-invite?token=invite-token` |
| `auth/forgot-password-page.tsx` | `/forgot-password` |
| `auth/login-page.tsx` | `/login` |
| `auth/register-page.tsx` | `/register` |
| `auth/reset-password-page.tsx` | `/reset-password?token=reset-token` |
| `auth/verify-email-page.tsx` | `/verify-email?email=rina%40example.com` |
| `dashboard/dashboard-page.tsx` | `/dashboard` |
| `inventory/create-purchase-order-page.tsx` | `/inventory/purchase-orders/new` |
| `inventory/movement-stock-page.tsx` | `/inventory/movements/new` |
| `inventory/purchase-order-detail-page.tsx` | `/inventory/purchase-orders/po-1` |
| `inventory/purchase-order-list-page.tsx` | `/inventory/purchase-orders` |
| `inventory/purchase-stock-page.tsx` | `/inventory/purchase/new` |
| `inventory/stock-detail-page.tsx` | `/inventory/stocks/stock-1` |
| `inventory/stock-list-page.tsx` | `/inventory/stocks` |
| `landing/landing-page.tsx` | `/` |
| `production/batch-create-page.tsx` | `/production/batches/new` |
| `production/batch-detail-page.tsx` | `/production/batches/batch-1` |
| `production/batch-list-page.tsx` | `/production/batches?tab=list` |
| `production/hpp-calculator-page.tsx` | `/hpp` |
| `production/overhead-list-page.tsx` | `/production/overheads` |
| `production/production-simulation-page.tsx` | `/production/hpp/production-simulation` |
| `production/recipe-simulation-page.tsx` | `/production/hpp/recipe-simulation` |
| `recipes/recipe-create-page.tsx` | `/production/products/new` |
| `recipes/recipe-detail-page.tsx` | `/production/products/product-1` |
| `recipes/recipe-list-page.tsx` | `/production/products` |
| `sales/customer-list-page.tsx` | `/sales/customers` |
| `sales/pos-page.tsx` | `/sales/pos` |
| `sales/transaction-history-page.tsx` | `/sales/history` |
| `settings/account-setting-page.tsx` | `/settings` |
| `settings/role-create-page.tsx` | `/settings/role/new` |
| `settings/store-settings-page.tsx` | `/settings/store` |
| `subscription/subscription-page.tsx` | `/subscription` |
| `suppliers/supplier-detail-page.tsx` | `/inventory/suppliers/supplier-1` |
| `suppliers/supplier-list-page.tsx` | `/inventory/suppliers` |
