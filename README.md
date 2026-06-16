# MedNote

Aplikasi rekam medis elektronik standalone untuk operasional klinik kecil sampai menengah. Aplikasi memakai Next.js App Router, TypeScript/TSX, Tailwind CSS, Shadcn UI, Prisma, dan Supabase PostgreSQL.

## Deskripsi

MedNote adalah aplikasi rekam medis elektronik berbasis web yang dirancang untuk membantu operasional fasilitas kesehatan skala kecil hingga menengah seperti klinik, praktik dokter, atau layanan kesehatan mandiri.

Aplikasi mendukung alur kerja multi-role dari pendaftaran pasien, pencatatan tanda vital, pemeriksaan dokter, pengelolaan resep dan obat, hingga laporan operasional — semuanya dalam satu platform terintegrasi.

## Fitur Utama

- Custom login, logout, HTTP-only cookie, dan database session.
- Role-based navigation dan server-side data minimization.
- Dashboard operasional per role dengan data agregasi.
- Manajemen pasien dengan nomor rekam medis otomatis.
- Pendaftaran kunjungan dan update status alur pelayanan.
- Pencatatan tanda vital pasien oleh perawat.
- Rekam medis dokter dengan SOAP, diagnosa, tindakan, dan resep.
- Manajemen resep dan pemrosesan oleh apoteker.
- Manajemen stok obat dengan peringatan stok rendah dan kedaluwarsa.
- Upload dan pengelolaan dokumen medis pasien.
- Laporan operasional dengan export PDF dan CSV.
- Audit log untuk aktivitas penting.
- Dialog/modal konfirmasi untuk aksi berisiko.
- Loading, error, dan not-found state.
- Responsive design untuk desktop, tablet, dan mobile.

## Roles Pengguna

| Role              | Akses Utama                                                       |
| ----------------- | ----------------------------------------------------------------- |
| Super Admin       | Akses penuh ke seluruh sistem                                     |
| Admin Klinik      | User, pasien, kunjungan, obat, laporan, audit log                 |
| Petugas Pendaftaran | Pasien dan kunjungan                                            |
| Dokter            | Rekam medis, diagnosa, tindakan, resep                            |
| Perawat           | Tanda vital, dokumen medis                                        |
| Apoteker          | Resep, manajemen obat, laporan penggunaan obat                    |

## Tech Stack

- **Framework**: Next.js App Router
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **ORM**: Prisma
- **Database**: Supabase PostgreSQL
- **Auth**: Custom (bcrypt, HTTP-only cookie, database session)
- **Storage**: Supabase Storage (untuk dokumen medis)
- **Deployment**: Vercel

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

## Akun Awal

Semua akun awal memakai password:

```text
[username]123
```

Username:

- `admin`
- `pendaftaran`
- `dokter`
- `perawat`
- `apoteker`

## Script

- `npm run dev` menjalankan server lokal.
- `npm run build` menjalankan `prisma generate` lalu `next build`.
- `npm run start` menjalankan production server.
- `npm run typecheck` menjalankan TypeScript check.
- `npm run lint` menjalankan ESLint.
- `npm run db:migrate` menjalankan Prisma migration.
- `npm run db:seed` mengisi data awal.
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
- Dokumen medis tidak dapat diakses secara publik.

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
- Data user awal sudah tersedia atau user dibuat dari database.
