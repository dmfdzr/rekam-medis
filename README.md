# Rekam Medis Elektronik

Aplikasi rekam medis elektronik berbasis web untuk operasional fasilitas kesehatan kecil sampai menengah. Aplikasi memakai Next.js App Router, TypeScript/TSX, Tailwind CSS, shadcn/ui, Prisma, dan Supabase PostgreSQL.

## Ringkasan

Rekam Medis Elektronik membantu fasilitas kesehatan mencatat alur pasien secara berurutan dari pendaftaran sampai resume medis terverifikasi. Aplikasi ini standalone: tidak memakai Supabase Auth, Auth.js, BPJS, SATUSEHAT, SIMRS, payment gateway, atau storage upload dokumen eksternal.

Dokumen Resume Medis dibuat saat user klik lihat atau download, sehingga storage tetap ringan.

## Alur Layanan

1. Pasien
2. Kunjungan
3. Asesmen
4. Laboratorium
5. Resep
6. CPPT
7. Verifikasi dokumen medis

Data yang dibuat pada satu tahap tampil di fitur tahap tersebut, lalu tersedia sebagai pilihan untuk tahap berikutnya.

## Fitur Utama

- Landing page, login internal, logout dengan konfirmasi, session HTTP-only cookie, dan light/dark mode.
- Role-based access untuk `Master`, `Admin`, dan `Dokter`.
- Dashboard operasional untuk pasien aktif, kunjungan, dokumen medis, dan proses verifikasi.
- Manajemen pasien dengan NIK 16 digit, nomor RM, kontak, alergi, golongan darah, dan alamat terstruktur.
- Kunjungan pasien dengan ruang rawat, DPJP utama, rawat bersama, tipe registrasi, dan status alur otomatis.
- Dokter hanya melihat dan memproses data kunjungan ketika menjadi DPJP utama atau DPJP pendamping.
- Asesmen klinis dengan tanda vital, diagnosa masuk, riwayat penyakit, ICD-10, dan tindakan ICD-9-CM.
- Laboratorium dengan input numerik dan daftar hasil yang searchable serta paginated.
- Resep manual dengan nama obat, dosis, aturan pakai, jumlah, catatan, proses, dan pembatalan.
- CPPT dengan draft/finalisasi, pencarian, pagination, dan detail riwayat.
- Dokumen Resume Medis A4 yang dapat dilihat dan diunduh sebagai PDF.
- Verifikasi dokumen medis dengan kondisi pulang, instruksi pulang, nama verifier, dan waktu verifikasi.
- Laporan diagnosis/tindakan, export CSV/XLSX, dan peta persebaran diagnosis berbasis Leaflet + OpenStreetMap.
- Audit log aktivitas penting dengan detail risiko, aksi, entity, IP, dan user agent.
- Manajemen user oleh Master.
- Pengaturan akun untuk update profil dan password.
- Toast global untuk notifikasi sukses/error.
- Responsive layout untuk desktop, tablet, dan mobile.

## Role Pengguna

| Role | Akses |
| --- | --- |
| Master | Semua fitur aplikasi. |
| Admin | Dashboard, Pasien, Kunjungan, dan Pengaturan Akun. |
| Dokter | Dashboard, Asesmen, Laboratorium, Resep, CPPT, Dokumen Medis, Laporan, dan Pengaturan Akun. Data klinis dibatasi pada kunjungan yang memanggil dokter tersebut sebagai DPJP utama atau DPJP pendamping. |

## Akun Awal

Seed project membuat 17 user:

- `master`
- `admin`
- 15 dokter: `andi`, `siti`, `budi`, `rina`, `dedi`, `maya`, `rizky`, `fitri`, `arief`, `nabila`, `fajar`, `intan`, `yudha`, `ratna`, `hendra`

Password awal:

| Username | Password |
| --- | --- |
| `master` | `master123` |
| `admin` | `admin123` |
| Semua dokter | `dokter123` |

## Tech Stack

- Framework: Next.js App Router
- Bahasa: TypeScript / TSX
- UI: Tailwind CSS, shadcn/ui, Radix UI, lucide-react
- Map: Leaflet + OpenStreetMap
- Export Excel: `xlsx`
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
- `patients`, `regions`
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
- `npm run db:seed` mengisi role dan user awal.
- `npm run db:studio` membuka Prisma Studio.
- `npm run db:clear-patient-data` membersihkan pasien beserta data klinis terkait. Gunakan hati-hati.
- `npm run db:clear-clinical-data` membersihkan data klinis tanpa menghapus user dan pasien.
- `npm run db:import-regions` import dataset wilayah sampai kecamatan.
- `npm run db:import-patients` import data pasien contoh.
- `npm run db:prepare-prescriptions` menyiapkan data sampai tahap resep pending.
- `npm run db:prepare-cppt-drafts` menyiapkan data sampai tahap CPPT draft tanpa finalisasi.

Script tambahan:

```bash
npx tsx scripts/create-assessment-stage-data.ts
```

Script ini membersihkan data klinis, mempertahankan user/pasien, lalu mengisi data sampai tahap asesmen saja.

## Laporan Diagnosis

- Laporan diagnosis memakai data `Diagnosis -> MedicalRecord -> Visit -> Patient`.
- Pengelompokan wilayah memakai alamat terstruktur pasien: provinsi, kabupaten/kota, dan kecamatan.
- Map memakai Leaflet dan OpenStreetMap.
- Export laporan tersedia dalam format CSV dan XLSX.
- PDF laporan tidak dipakai; PDF difokuskan untuk Resume Medis.

## Dokumen Resume Medis

- Dokumen medis tidak disimpan sebagai file upload.
- Preview dan PDF Resume Medis dibuat saat user klik `Lihat` atau `Download`.
- Nomor dokumen memakai format `RI MM/YYYY/Romawi`, contoh `RI 07/2026/I`.
- Nomor romawi dihitung dari urutan CPPT final yang masuk fitur Dokumen Medis, termasuk yang belum diverifikasi.
- Logo aplikasi dan dokumen memakai `public/assets/ueu.png`.
- Verifikasi dokumen wajib mengisi kondisi pulang dan instruksi pulang.
- PDF Resume Medis menampilkan nama verifier dan waktu verifikasi setelah dokumen diverifikasi.

## Dokumentasi Developer

Dokumentasi teknis khusus developer tersedia di:

```text
DEVELOPER_DOCUMENTATION.md
```

File tersebut berisi mapping fitur ke file/fungsi, alur logic, struktur database, relasi, dan ERD.

## Keamanan

- Password di-hash dengan bcrypt.
- Session token disimpan sebagai hash di database.
- Cookie session bersifat HTTP-only.
- Akses server-side dibatasi berdasarkan role.
- Dokter hanya dapat membaca/memproses data klinis kunjungan ketika menjadi DPJP utama atau DPJP pendamping.
- Data modul hanya diambil jika role memiliki permission.
- Aktivitas penting dicatat ke audit log.
- Dokumen medis dan route download/preview memvalidasi permission serta assignment dokter.

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

Jika `npx` gagal di PowerShell karena execution policy, gunakan `cmd /c npx ...` atau jalankan terminal dengan policy yang sesuai.
