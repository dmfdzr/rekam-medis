# MedRecord App

Aplikasi rekam medis elektronik standalone untuk operasional klinik kecil sampai menengah. Aplikasi memakai Next.js App Router, TypeScript/TSX, Tailwind CSS, Prisma, dan Supabase PostgreSQL.

## Fitur MVP

- Custom login, logout, HTTP-only cookie, dan database session.
- Role-based navigation dan server-side data minimization.
- Manajemen pasien, kunjungan, tanda vital, rekam medis, resep, obat, dokumen medis, laporan, user, audit log, dan pengaturan akun.
- Dashboard dari agregasi database.
- Export laporan CSV dengan filter tanggal.
- Audit log untuk aktivitas penting.
- Dialog/modal untuk form dan filter.
- Loading, error, dan not-found state.

## Prasyarat

- Node.js 20 atau lebih baru.
- Supabase PostgreSQL project.
- Connection string Supabase pooler untuk `DATABASE_URL` dan `DIRECT_URL`.

## Environment

Copy `.env.example` menjadi `.env.local`, lalu isi value sesuai project Supabase.

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:5432/postgres"
SESSION_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

`SESSION_SECRET` wajib diisi dengan random string panjang. Jangan commit `.env.local`.

## Setup Lokal

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

App berjalan di `http://localhost:3000`.

## Akun Demo Seed

Semua akun demo memakai password:

```text
rekammedis123
```

Username:

- `admin`
- `pendaftaran`
- `dokter`
- `perawat`
- `apoteker`

## Script

- `npm run dev` menjalankan development server.
- `npm run build` menjalankan `prisma generate` lalu `next build`.
- `npm run start` menjalankan production server.
- `npm run typecheck` menjalankan TypeScript check.
- `npm run lint` menjalankan ESLint.
- `npm run db:migrate` menjalankan Prisma migration.
- `npm run db:seed` mengisi data demo.
- `npm run db:studio` membuka Prisma Studio.

## Deployment Vercel

Tambahkan environment variables berikut di Vercel:

```env
DATABASE_URL=...
DIRECT_URL=...
SESSION_SECRET=...
NEXT_PUBLIC_APP_URL=https://domain-vercel-anda.vercel.app
```

Build command:

```bash
npm run build
```

Script build sudah menjalankan `prisma generate` sebelum `next build`, sehingga Prisma Client selalu sesuai schema saat deploy.

## Catatan Keamanan

- Aplikasi tidak memakai Supabase Auth, Auth.js, NextAuth, atau OAuth.
- Password di-hash menggunakan bcrypt.
- Session disimpan di database dan token disimpan dalam HTTP-only cookie.
- Akses modul dibatasi berdasarkan role.
- Data server hanya di-fetch jika role memiliki permission modul terkait.
- Aktivitas penting dicatat ke audit log.

## Troubleshooting

Jika deploy menampilkan error Prisma Client atau enum tidak ditemukan, jalankan:

```bash
npm run db:generate
npm run build
```

Jika login gagal setelah deploy, cek:

- `SESSION_SECRET` sudah ada.
- `DATABASE_URL` dan `DIRECT_URL` benar.
- Migration sudah dijalankan.
- Seed user sudah tersedia atau user dibuat dari database.
