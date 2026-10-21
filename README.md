# React + TypeScript + Vite

## Unit & component tests

Unit tests ada di `tests/unit/`. Component tests ada di `tests/components/`, memakai Vitest, React Testing Library, dan jsdom. Test ini tidak memerlukan browser, dev server, atau backend.

Jalankan dari direktori `hpp-ui` dengan Node.js 22.22+:

```sh
npm install
npm test
npm run test:typecheck
```

`npm install` memasang dependency test dan memperbarui `package-lock.json`. Commit lockfile yang diperbarui sebelum menggunakan `npm ci` di CI.

Perintah lain:

```sh
npm run test:watch
npm test -- tests/components/formatted-number-input.test.tsx
npm run test:legacy
```

`test:legacy` menjalankan test Node.js yang sudah ada untuk navigasi sidebar dan konversi satuan. `npm test` hanya mengambil file unit/component yang ditentukan di `vitest.config.ts`.

Skenario yang dicakup:

- Format angka Indonesia, parsing desimal, dan posisi kursor setelah pemisah ribuan.
- Validasi password dan pembaruan indikator kekuatannya.
- Konversi jumlah PO, validasi harga faktur, serta ekstensi, MIME type, nama, dan ukuran lampiran.
- Input angka melalui keyboard, sinkronisasi nilai dari parent, pengosongan, serta kondisi disabled/read-only.
- Pencarian, perubahan kategori, reset filter, dan feedback saat mengambil data.
- Pagination pada data kosong, halaman pertama/terakhir, dan saat loading.

Tambahkan unit test sebagai `tests/unit/<nama>.test.ts` dan component test sebagai `tests/components/<nama>.test.tsx`. Import `describe`, `it`, `expect`, dan `vi` dari `vitest`; gunakan `screen.getByRole` atau `getByLabelText` untuk mencari kontrol. Simulasikan interaksi dengan `userEvent.setup()` dan `await`. DOM dibersihkan otomatis setelah setiap test melalui `tests/setup.ts`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
