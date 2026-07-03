# MedNote

Aplikasi rekam medis elektronik berbasis web untuk operasional klinik kecil sampai menengah. Aplikasi memakai Next.js App Router, TypeScript/TSX, Tailwind CSS, shadcn/ui, Prisma, dan Supabase PostgreSQL.

## Ringkasan

MedNote membantu fasilitas kesehatan mencatat alur layanan pasien secara berurutan dari data pasien sampai dokumen medis terverifikasi. Aplikasi ini bersifat standalone: tidak memakai Supabase Auth, Auth.js, BPJS, SATUSEHAT, SIMRS, payment gateway, atau storage upload dokumen eksternal.

Dokumen medis dibuat saat dibutuhkan dari data yang sudah tersimpan, sehingga kebutuhan storage tetap ringan.

## Alur Layanan

1. Pasien
2. Kunjungan
3. Asesmen
4. Laboratorium
5. Resep
6. CPPT
7. Verifikasi dokumen medis

Data yang dibuat pada satu tahap tampil di fitur tahap tersebut, dan tersedia sebagai pilihan/dropdown untuk tahap berikutnya.

## Fitur Utama

- Landing page, login internal, logout dengan konfirmasi, dan session HTTP-only cookie.
- Role-based access untuk `Master`, `Admin`, dan `Dokter`.
- Dashboard operasional dengan antrean layanan dan alur kerja.
- Manajemen pasien dengan NIK 16 digit, nomor RM, kontak, alamat, golongan darah, dan alergi.
- Kunjungan pasien dengan tipe pasien, layanan, DPJP utama, rawat bersama, dan status alur otomatis.
- Asesmen klinis dengan diagnosis masuk, riwayat penyakit, diagnosa ICD-10, tindakan ICD-9-CM, dan tanda vital.
- Laboratorium dengan input nilai numerik.
- Resep dengan nama obat manual, dosis, aturan pakai, jumlah, catatan, proses, dan pembatalan.
- CPPT dengan draft/finalisasi dan data pemeriksaan fisik.
- Dokumen medis Resume Medis A4 yang dapat dilihat dan diunduh sebagai PDF.
- Verifikasi dokumen medis dengan kondisi pulang, instruksi pulang, nama verifier, dan waktu verifikasi.
- Laporan dengan export CSV, JSON, PDF, dan XLS.
- Audit log aktivitas penting.
- Manajemen user oleh Master.
- Pengaturan akun untuk update profil dan password.
- Toast global untuk notifikasi sukses/error.
- Responsive layout untuk desktop, tablet, dan mobile.
- Light/dark mode toggle.

## Role Pengguna

| Role | Akses |
| --- | --- |
| Master | Semua fitur aplikasi. |
| Admin | Dashboard, Pasien, Kunjungan, dan Pengaturan Akun. |
| Dokter | Dashboard, Asesmen, Laboratorium, Resep, CPPT, Dokumen Medis, Laporan, dan Pengaturan Akun. |

## Tech Stack

- Framework: Next.js App Router
- Bahasa: TypeScript / TSX
- UI: Tailwind CSS, shadcn/ui, Radix UI, lucide-react
- ORM: Prisma
- Database: Supabase PostgreSQL
- Auth: Custom auth dengan bcrypt, session database, dan HTTP-only cookie
- Deployment: Vercel
- Test: Node test runner via `tsx --test`, Playwright untuk e2e

## Prasyarat

- Node.js 20 atau lebih baru.
- Project Supabase PostgreSQL.
- Connection string Supabase pooler:
  - `DATABASE_URL` untuk transaction-mode pooler.
  - `DIRECT_URL` untuk migration/session-mode pooler.

## Environment

Copy `.env.example` menjadi `.env.local`, lalu isi sesuai project Supabase.

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:5432/postgres"
SESSION_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

`SESSION_SECRET` wajib diisi dengan string panjang dan random. Jangan commit `.env.local`.

## Setup Lokal

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Aplikasi berjalan di `http://localhost:3000`.

Jika memakai PowerShell dan `npm` terkena execution policy, gunakan `npm.cmd`.

```bash
npm.cmd run dev
```

## Database

Schema utama mencakup:

- `roles`, `users`, `sessions`
- `patients`
- `visits`, `visit_companion_doctors`
- `vital_signs`
- `laboratory_results`
- `medical_records`
- `diagnoses`, `treatments`
- `prescriptions`, `prescription_items`
- `medical_documents`
- `audit_logs`

Untuk production/deployment, jalankan migration:

```bash
npx prisma migrate deploy
```

Catatan: verifikasi dokumen medis membutuhkan kolom `dischargeCondition` dan `dischargeInstruction` pada tabel `medical_records`.

## Akun Awal

Seed project saat ini menggunakan tiga role utama:

- `master`
- `admin`
- `dokter`

Password awal mengikuti seed database. Jika lupa password, reset lewat database/seed atau fitur manajemen user jika masih ada akun Master aktif.

## Script

- `npm run dev` menjalankan server lokal.
- `npm run build` menjalankan `prisma generate` lalu `next build`.
- `npm run start` menjalankan production server.
- `npm run test` menjalankan unit test.
- `npm run test:e2e` menjalankan Playwright test.
- `npm run typecheck` menjalankan TypeScript check.
- `npm run lint` menjalankan ESLint.
- `npm run format` menjalankan Prettier.
- `npm run db:generate` menjalankan Prisma generate.
- `npm run db:migrate` menjalankan Prisma migration lokal.
- `npm run db:seed` mengisi data awal.
- `npm run db:studio` membuka Prisma Studio.

## Deployment Vercel

Tambahkan environment variables berikut di Vercel:

```env
DATABASE_URL=...
DIRECT_URL=...
SESSION_SECRET=...
NEXT_PUBLIC_APP_URL=https://domain-anda.vercel.app
```

Build command:

```bash
npm run build
```

Pastikan migration sudah dijalankan ke database production sebelum fitur baru dipakai:

```bash
npx prisma migrate deploy
```

## Catatan Dokumen Medis

- Dokumen medis tidak disimpan sebagai file upload.
- Preview dan PDF Resume Medis dibuat saat user klik `Lihat` atau `Download`.
- Logo aplikasi dan dokumen memakai `public/assets/ueu.png`.
- Verifikasi dokumen wajib mengisi kondisi pulang dan instruksi pulang.
- PDF Resume Medis menampilkan nama verifier dan waktu verifikasi.

## Keamanan

- Password di-hash dengan bcrypt.
- Session token disimpan sebagai hash di database.
- Cookie session bersifat HTTP-only.
- Akses server-side dibatasi berdasarkan role.
- Data modul hanya diambil jika role memiliki permission.
- Aktivitas penting dicatat ke audit log.
- Dokumen medis hanya dapat diakses user dengan permission.

## Troubleshooting

Jika Prisma Client tidak mengenali field baru:

```bash
npm run db:generate
npm run build
```

Jika migration belum masuk database production:

```bash
npx prisma migrate deploy
```

Jika verifikasi dokumen gagal karena kolom belum ada, pastikan migration terbaru sudah dijalankan dan tabel `medical_records` memiliki:

- `dischargeCondition`
- `dischargeInstruction`

Jika login gagal setelah deploy, cek:

- `SESSION_SECRET` sudah ada.
- `DATABASE_URL` dan `DIRECT_URL` benar.
- Migration sudah dijalankan.
- Data user awal tersedia.
