# Product Requirements Document

# Aplikasi Rekam Medis Elektronik Standalone

## 1. Product Overview

### 1.1 Nama Produk

**MedRecord App**

MedRecord App adalah aplikasi rekam medis elektronik berbasis web yang digunakan untuk mengelola data pasien, kunjungan, pemeriksaan, tanda vital, diagnosa, tindakan medis, resep obat, data obat, dokumen medis, laporan, dan aktivitas user secara digital.

### 1.2 Deskripsi Produk

MedRecord App dirancang sebagai aplikasi rekam medis standalone untuk fasilitas kesehatan skala kecil hingga menengah seperti klinik, praktik dokter, atau layanan kesehatan mandiri.

Aplikasi ini tidak terintegrasi dengan sistem eksternal seperti BPJS, SATUSEHAT, SIMRS, payment gateway, aplikasi pihak ketiga, atau sistem rumah sakit lain. Seluruh proses pencatatan, pengelolaan, dan penyimpanan data dilakukan secara internal di dalam aplikasi.

Aplikasi dibangun menggunakan pendekatan fullstack dengan Next.js, Prisma sebagai ORM, dan Supabase PostgreSQL sebagai database utama. Autentikasi dibuat langsung melalui aplikasi tanpa menggunakan Supabase Auth, Auth.js, OAuth, atau layanan autentikasi eksternal.

### 1.3 Latar Belakang

Banyak fasilitas kesehatan kecil masih melakukan pencatatan data pasien dan rekam medis secara manual atau menggunakan spreadsheet sederhana. Cara tersebut memiliki beberapa masalah, seperti data sulit dicari, rawan hilang, riwayat pasien tidak tersusun rapi, proses pemeriksaan kurang terdokumentasi, dan pembuatan laporan membutuhkan waktu lama.

Dengan adanya aplikasi rekam medis berbasis web, data pasien dan riwayat pemeriksaan dapat tersimpan lebih terstruktur. Petugas dapat mendaftarkan pasien, perawat dapat mencatat tanda vital, dokter dapat mengisi hasil pemeriksaan, apoteker dapat memproses resep, dan admin dapat melihat laporan melalui satu aplikasi.

### 1.4 Tujuan Produk

Tujuan utama aplikasi ini adalah membangun sistem rekam medis digital yang sederhana, aman, terstruktur, responsif, dan mudah digunakan.

Tujuan produk meliputi:

* Mempermudah pengelolaan data pasien.
* Mempercepat pencarian riwayat rekam medis pasien.
* Membantu dokter mencatat hasil pemeriksaan secara terstruktur.
* Membantu perawat mencatat tanda vital pasien.
* Membantu apoteker mengelola resep dan stok obat.
* Membantu admin melihat laporan kunjungan, pasien, diagnosa, tindakan, dan penggunaan obat.
* Mengurangi risiko kehilangan data akibat pencatatan manual.
* Menjaga kerahasiaan data pasien melalui autentikasi, session, dan role access.
* Mencatat aktivitas penting user melalui audit log.
* Menyediakan desain antarmuka yang responsive di berbagai ukuran device.

### 1.5 Target Pengguna

Aplikasi ini ditujukan untuk:

* Super Admin
* Admin Klinik
* Petugas Pendaftaran
* Dokter
* Perawat
* Apoteker
* Pemilik atau manajemen fasilitas kesehatan

### 1.6 Platform

Aplikasi berjalan sebagai web application yang dapat diakses melalui browser desktop, laptop, tablet, dan mobile.

Prioritas utama penggunaan aplikasi adalah desktop dan laptop karena sistem ini digunakan untuk operasional fasilitas kesehatan. Namun, aplikasi tetap harus responsive agar dapat digunakan pada tablet dan mobile untuk kebutuhan akses cepat, monitoring, dan input sederhana.

---

## 2. Scope Produk

### 2.1 In Scope

Fitur yang termasuk dalam scope aplikasi:

* Custom authentication
* Database session
* HTTP-only cookie
* Role-based access control
* Dashboard berdasarkan role
* Manajemen user
* Manajemen pasien
* Pendaftaran kunjungan
* Pencatatan tanda vital
* Pencatatan rekam medis dokter
* Diagnosa pasien
* Tindakan medis
* Resep obat
* Manajemen obat
* Upload dokumen medis
* Riwayat rekam medis pasien
* Laporan dasar
* Audit log aktivitas user
* Export laporan sederhana
* Rencana desain UI/UX
* Design system dasar
* User flow utama
* Sitemap aplikasi
* Responsive design untuk desktop, laptop, tablet, dan mobile

### 2.2 Out of Scope

Fitur yang tidak termasuk dalam versi awal aplikasi:

* Integrasi BPJS
* Integrasi SATUSEHAT
* Integrasi SIMRS
* Integrasi payment gateway
* Telemedicine
* Mobile app native
* AI diagnosis
* Multi-fasilitas kompleks
* Rawat inap kompleks
* Sistem antrean real-time kompleks
* Single Sign-On
* OAuth Google login
* Supabase Auth
* Auth.js / NextAuth
* Integrasi akun eksternal

---

## 3. Tech Stack

### 3.1 Frontend

Teknologi frontend yang digunakan:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Shadcn UI
* React Hook Form
* Zod
* TanStack Table
* Lucide React
* Date-fns

### 3.2 Backend

Backend dibuat langsung di dalam project Next.js menggunakan pendekatan fullstack.

Teknologi backend:

* Next.js App Router
* Server Actions
* Route Handlers jika diperlukan
* Middleware Next.js
* Prisma ORM
* Zod untuk validasi request
* Role-based access control
* Custom authentication

### 3.3 Database

Database menggunakan:

* Supabase PostgreSQL
* Prisma ORM
* Prisma Migrate
* Prisma Studio untuk development

Supabase digunakan sebagai infrastruktur database, bukan sebagai sistem eksternal untuk pertukaran data kesehatan.

### 3.4 Authentication

Autentikasi dibuat langsung melalui aplikasi.

Komponen autentikasi:

* Custom login
* Password hashing menggunakan bcrypt atau argon2
* Database session
* HTTP-only cookie
* Middleware route protection
* Role-based access control
* Logout dengan pencabutan session

Aplikasi tidak menggunakan Supabase Auth, Auth.js, NextAuth, OAuth, atau layanan login eksternal.

### 3.5 Storage

Storage digunakan untuk menyimpan dokumen medis.

Pilihan storage:

* Supabase Storage

Contoh dokumen:

* Hasil laboratorium
* Surat rujukan
* Surat kontrol
* Foto pemeriksaan
* Dokumen pendukung lainnya

### 3.6 Deployment

Rencana deployment:

* Vercel untuk aplikasi Next.js
* Supabase untuk database PostgreSQL
* Supabase Storage untuk penyimpanan dokumen jika digunakan

### 3.7 Environment Variables

Environment variables yang dibutuhkan:

* DATABASE_URL
* DIRECT_URL
* SESSION_SECRET
* NEXT_PUBLIC_APP_URL
* SUPABASE_URL
* SUPABASE_SERVICE_ROLE_KEY, jika menggunakan Supabase Storage

Catatan keamanan:

* Secret key tidak boleh disimpan di frontend.
* SUPABASE_SERVICE_ROLE_KEY hanya boleh digunakan di server.
* Semua akses database harus dilakukan dari server-side Next.js.

---

## 4. Architecture Overview

### 4.1 Jenis Arsitektur

Aplikasi menggunakan arsitektur fullstack monolith berbasis Next.js.

Frontend, backend logic, validasi, autentikasi, session, role access, dan akses database berada dalam satu project Next.js. Database menggunakan Supabase PostgreSQL dan diakses melalui Prisma.

### 4.2 Alur Sistem

Alur utama sistem:

1. User membuka aplikasi.
2. User login menggunakan email atau username dan password.
3. Sistem memvalidasi input login.
4. Sistem mencocokkan password dengan password hash di database.
5. Jika valid, sistem membuat session di database.
6. Session token dikirim ke browser melalui HTTP-only cookie.
7. Middleware mengecek session ketika user mengakses halaman private.
8. User hanya dapat mengakses fitur sesuai role.
9. Semua proses CRUD dilakukan melalui Server Actions atau Route Handlers.
10. Prisma mengirim query ke Supabase PostgreSQL.
11. Aktivitas penting dicatat ke audit log.

### 4.3 Struktur Folder Rekomendasi

Struktur folder aplikasi:

* app

  * auth
  * dashboard
  * patients
  * visits
  * medical-records
  * prescriptions
  * medicines
  * reports
  * users
  * api
* actions

  * auth actions
  * user actions
  * patient actions
  * visit actions
  * medical record actions
  * prescription actions
  * medicine actions
* components

  * ui
  * forms
  * tables
  * layouts
  * shared
* lib

  * prisma
  * auth
  * session
  * permissions
  * validations
  * utils
  * storage helper
* middleware
* types

---

## 5. Design Overview

### 5.1 Tujuan Design

Rencana desain aplikasi berfokus pada pembuatan antarmuka yang sederhana, rapi, profesional, mudah digunakan, dan sesuai dengan kebutuhan operasional fasilitas kesehatan.

Aplikasi akan digunakan oleh beberapa role dengan kebutuhan berbeda, sehingga desain harus mendukung alur kerja yang cepat dan jelas.

Tujuan desain:

* Membuat tampilan aplikasi yang bersih dan profesional.
* Mempermudah pencarian data pasien dan riwayat rekam medis.
* Mengurangi jumlah langkah dalam proses pendaftaran dan pemeriksaan pasien.
* Menampilkan informasi medis secara terstruktur.
* Menyediakan navigasi yang konsisten untuk setiap role.
* Membantu user memahami status data melalui badge, warna, dan indikator visual.
* Membuat aplikasi nyaman digunakan pada desktop, laptop, tablet, dan mobile.
* Mengurangi risiko kesalahan input melalui validasi, helper text, dan layout form yang jelas.

### 5.2 Design Principles

#### Simple and Clear

Setiap halaman harus sederhana, tidak terlalu padat, dan fokus pada tugas utama user. Informasi penting seperti nama pasien, nomor rekam medis, status kunjungan, dan riwayat pemeriksaan harus mudah ditemukan.

#### Role-Based Interface

Menu, dashboard, dan data yang ditampilkan harus menyesuaikan role user. Dokter tidak perlu melihat menu manajemen user, apoteker tidak perlu melihat form pemeriksaan dokter, dan petugas pendaftaran tidak perlu mengakses laporan medis detail.

#### Fast Data Entry

Form harus dirancang agar input data dapat dilakukan dengan cepat. Field yang sering digunakan harus mudah dijangkau, sedangkan field tambahan dapat diletakkan pada bagian lanjutan atau section terpisah.

#### Consistent Layout

Setiap halaman menggunakan pola layout yang konsisten, seperti header halaman, tombol aksi utama, tabel data, filter, dan form input.

#### Visual Feedback

Setiap aksi user harus memiliki feedback yang jelas, seperti loading state, success message, error message, empty state, dan confirmation dialog.

#### Safe Interaction

Aksi yang berisiko seperti hapus data, finalisasi rekam medis, logout, dan proses resep harus menggunakan confirmation dialog.

#### Responsive and Adaptive

Tampilan aplikasi harus menyesuaikan ukuran layar tanpa merusak struktur informasi. Layout, tabel, form, navigasi, dan dashboard harus tetap dapat digunakan pada berbagai device.

---

## 6. User Roles

### 6.1 Super Admin

Super Admin memiliki akses penuh ke seluruh sistem.

Hak akses:

* Mengelola semua user
* Mengelola role
* Mengelola pasien
* Mengelola kunjungan
* Melihat seluruh rekam medis
* Melihat seluruh laporan
* Melihat audit log
* Mengatur data master

### 6.2 Admin Klinik

Admin Klinik bertugas mengelola operasional aplikasi.

Hak akses:

* Mengelola user tertentu
* Mengelola data pasien
* Mengelola data kunjungan
* Mengelola obat
* Melihat laporan
* Melihat data aktivitas tertentu

### 6.3 Petugas Pendaftaran

Petugas Pendaftaran bertugas mendaftarkan pasien dan membuat kunjungan.

Hak akses:

* Menambah pasien
* Mengubah data dasar pasien
* Mencari pasien
* Membuat kunjungan
* Melihat status kunjungan

### 6.4 Dokter

Dokter bertugas melakukan pemeriksaan dan mengisi rekam medis.

Hak akses:

* Melihat daftar pasien yang menunggu pemeriksaan
* Melihat data pasien
* Melihat riwayat rekam medis pasien
* Mengisi rekam medis
* Menambahkan diagnosa
* Menambahkan tindakan
* Membuat resep
* Menentukan rencana kontrol

### 6.5 Perawat

Perawat bertugas mencatat pemeriksaan awal pasien.

Hak akses:

* Melihat daftar kunjungan
* Melihat data pasien terbatas
* Mengisi tanda vital
* Menambahkan catatan perawat

### 6.6 Apoteker

Apoteker bertugas mengelola obat dan memproses resep.

Hak akses:

* Melihat resep
* Memproses resep
* Mengelola stok obat
* Melihat laporan penggunaan obat

---

## 7. Information Architecture

### 7.1 Menu Utama

Menu utama aplikasi:

* Dashboard
* Pasien
* Kunjungan
* Tanda Vital
* Rekam Medis
* Resep
* Obat
* Dokumen Medis
* Laporan
* Manajemen User
* Audit Log
* Pengaturan Akun

### 7.2 Role-Based Menu

| Menu          | Admin | Petugas | Dokter   | Perawat | Apoteker |
| ------------- | ----- | ------- | -------- | ------- | -------- |
| Dashboard     | Ya    | Ya      | Ya       | Ya      | Ya       |
| Pasien        | Ya    | Ya      | Lihat    | Lihat   | Tidak    |
| Kunjungan     | Ya    | Ya      | Lihat    | Lihat   | Tidak    |
| Tanda Vital   | Lihat | Tidak   | Lihat    | Ya      | Tidak    |
| Rekam Medis   | Lihat | Tidak   | Ya       | Tidak   | Tidak    |
| Resep         | Lihat | Tidak   | Buat     | Tidak   | Proses   |
| Obat          | Ya    | Tidak   | Lihat    | Tidak   | Ya       |
| Dokumen Medis | Ya    | Tidak   | Ya       | Ya      | Tidak    |
| Laporan       | Ya    | Tidak   | Terbatas | Tidak   | Terbatas |
| User          | Ya    | Tidak   | Tidak    | Tidak   | Tidak    |
| Audit Log     | Ya    | Tidak   | Tidak    | Tidak   | Tidak    |

---

## 8. Sitemap / Struktur Halaman

### 8.1 Authentication Pages

* Login
* Forgot Password, optional untuk fase lanjutan
* Reset Password, optional untuk fase lanjutan

### 8.2 Dashboard Pages

* Dashboard Admin
* Dashboard Petugas
* Dashboard Dokter
* Dashboard Perawat
* Dashboard Apoteker

### 8.3 Patient Pages

* Daftar Pasien
* Tambah Pasien
* Edit Pasien
* Detail Pasien
* Riwayat Kunjungan Pasien
* Riwayat Rekam Medis Pasien
* Dokumen Pasien

### 8.4 Visit Pages

* Daftar Kunjungan
* Tambah Kunjungan
* Detail Kunjungan
* Update Status Kunjungan

### 8.5 Vital Sign Pages

* Daftar Pasien Menunggu Tanda Vital
* Form Input Tanda Vital
* Detail Tanda Vital

### 8.6 Medical Record Pages

* Daftar Pasien Pemeriksaan
* Form Pemeriksaan Dokter
* Detail Rekam Medis
* Riwayat Rekam Medis
* Finalisasi Rekam Medis

### 8.7 Prescription Pages

* Buat Resep
* Detail Resep
* Daftar Resep Pending
* Proses Resep
* Riwayat Resep

### 8.8 Medicine Pages

* Daftar Obat
* Tambah Obat
* Edit Obat
* Detail Obat
* Stok Rendah
* Obat Kedaluwarsa

### 8.9 Report Pages

* Laporan Kunjungan
* Laporan Pasien Baru
* Laporan Diagnosa
* Laporan Tindakan
* Laporan Penggunaan Obat
* Laporan Stok Obat

### 8.10 User Management Pages

* Daftar User
* Tambah User
* Edit User
* Detail User
* Ubah Status User

### 8.11 Audit Log Pages

* Daftar Audit Log
* Detail Audit Log
* Filter Audit Log

---

## 9. Main User Flows

### 9.1 Login Flow

1. User membuka halaman login.
2. User mengisi email atau username dan password.
3. Sistem memvalidasi input.
4. Jika berhasil, user diarahkan ke dashboard sesuai role.
5. Jika gagal, sistem menampilkan pesan error.

### 9.2 Patient Registration Flow

1. Petugas membuka menu Pasien.
2. Petugas mencari pasien berdasarkan nama, NIK, atau nomor rekam medis.
3. Jika pasien sudah ada, petugas membuka detail pasien.
4. Jika pasien belum ada, petugas menambahkan data pasien baru.
5. Sistem membuat nomor rekam medis otomatis.
6. Petugas membuat kunjungan baru untuk pasien.

### 9.3 Visit Flow

1. Petugas membuat kunjungan pasien.
2. Status kunjungan menjadi Menunggu.
3. Perawat melihat daftar pasien menunggu.
4. Perawat mengisi tanda vital.
5. Dokter melihat pasien pada daftar pemeriksaan.
6. Dokter melakukan pemeriksaan dan mengisi rekam medis.
7. Dokter menambahkan diagnosa, tindakan, dan resep jika diperlukan.
8. Dokter memfinalisasi rekam medis.
9. Status kunjungan menjadi Selesai.

### 9.4 Prescription Flow

1. Dokter membuat resep dari halaman pemeriksaan.
2. Resep masuk ke daftar resep pending.
3. Apoteker membuka detail resep.
4. Apoteker mengecek ketersediaan stok obat.
5. Apoteker memproses resep.
6. Sistem mengurangi stok obat.
7. Status resep menjadi Diproses.

### 9.5 Medical Record History Flow

1. User membuka detail pasien.
2. User memilih tab Riwayat Rekam Medis.
3. Sistem menampilkan daftar kunjungan sebelumnya.
4. User membuka salah satu rekam medis.
5. Sistem menampilkan data tanda vital, pemeriksaan dokter, diagnosa, tindakan, resep, dan dokumen terkait.

---

## 10. Layout Structure

### 10.1 App Layout

Layout utama aplikasi terdiri dari:

* Sidebar navigation
* Topbar
* Page header
* Content area
* Footer optional

### 10.2 Sidebar

Sidebar berisi menu utama sesuai role user.

Requirement sidebar:

* Menampilkan menu sesuai hak akses.
* Memiliki active state.
* Dapat collapsible pada tablet.
* Berubah menjadi drawer pada mobile.

### 10.3 Topbar

Topbar berisi:

* Nama aplikasi
* Nama user
* Role user
* Avatar user optional
* Tombol logout
* Search shortcut optional

### 10.4 Page Header

Setiap halaman memiliki header yang berisi:

* Judul halaman
* Deskripsi singkat
* Breadcrumb optional
* Tombol aksi utama

Contoh:

* Judul: Data Pasien
* Deskripsi: Kelola data pasien dan riwayat kunjungan.
* Aksi utama: Tambah Pasien

### 10.5 Content Area

Content area digunakan untuk menampilkan:

* Table
* Form
* Card
* Detail data
* Grafik
* Tab
* Dialog
* Empty state
* Loading state

---

## 11. Design System

### 11.1 Visual Style

Gaya visual aplikasi menggunakan tampilan modern, bersih, dan profesional.

Karakter visual:

* Clean
* Professional
* Calm
* Trustworthy
* Easy to read
* Minimal

### 11.2 Color Palette

Warna utama yang direkomendasikan:

* Primary: Blue atau Teal
* Neutral: White, Slate, Gray
* Success: Green
* Warning: Yellow atau Orange
* Error / Danger: Red
* Information: Blue
* Disabled: Gray

Contoh penggunaan warna:

| Elemen         | Warna              |
| -------------- | ------------------ |
| Primary button | Blue / Teal        |
| Success badge  | Green              |
| Warning badge  | Yellow / Orange    |
| Danger button  | Red                |
| Table border   | Gray               |
| Background     | White / Light Gray |
| Sidebar active | Primary color      |

### 11.3 Typography

Font yang direkomendasikan:

* Inter
* Geist
* Plus Jakarta Sans

Ukuran typography:

| Elemen        | Ukuran  |
| ------------- | ------- |
| Page title    | 24-30px |
| Section title | 18-20px |
| Body text     | 14-16px |
| Table text    | 13-14px |
| Helper text   | 12-13px |

### 11.4 Spacing

Sistem spacing menggunakan skala:

* 4px
* 8px
* 12px
* 16px
* 24px
* 32px

### 11.5 Components

Komponen utama yang digunakan:

* Button
* Input
* Textarea
* Select
* Checkbox
* Radio
* Date picker
* Badge
* Card
* Table
* Tabs
* Dialog
* Dropdown menu
* Alert
* Toast
* Pagination
* Breadcrumb
* Sidebar
* Navbar
* Skeleton loading
* Empty state
* Confirmation modal
* Drawer navigation
* Accordion
* Stepper, optional untuk form panjang

---

## 12. Responsive Design Plan

### 12.1 Overview

Aplikasi Rekam Medis Elektronik dirancang menggunakan pendekatan responsive web design agar dapat digunakan dengan baik pada berbagai ukuran perangkat, mulai dari desktop, laptop, tablet, hingga mobile.

Meskipun prioritas utama penggunaan aplikasi adalah desktop karena digunakan untuk operasional fasilitas kesehatan, aplikasi tetap harus dapat menyesuaikan tampilan pada tablet dan mobile untuk kebutuhan akses cepat, monitoring, atau penggunaan saat berpindah tempat.

Responsive design bertujuan agar tampilan tetap rapi, mudah dibaca, dan fungsi utama tetap dapat digunakan tanpa mengganggu alur kerja user.

### 12.2 Responsive Design Goals

Tujuan responsive design:

* Aplikasi dapat digunakan pada desktop, laptop, tablet, dan mobile.
* Layout menyesuaikan ukuran layar tanpa merusak struktur informasi.
* Navigasi tetap mudah digunakan pada layar kecil.
* Form tetap nyaman diisi pada berbagai ukuran layar.
* Tabel tetap dapat dibaca tanpa memotong data penting.
* Tombol aksi utama tetap mudah ditemukan.
* Informasi medis tetap jelas dan tidak terlalu padat.
* User tetap dapat melakukan tugas utama meskipun menggunakan perangkat kecil.

### 12.3 Breakpoint Strategy

| Device       |    Ukuran Layar | Layout Strategy                                |
| ------------ | --------------: | ---------------------------------------------- |
| Mobile Small |         < 480px | Single column, drawer navigation               |
| Mobile Large |   480px - 767px | Single column, compact card layout             |
| Tablet       |  768px - 1023px | Two-column where possible, collapsible sidebar |
| Laptop       | 1024px - 1279px | Full dashboard layout                          |
| Desktop      |        ≥ 1280px | Full layout with sidebar and expanded content  |

### 12.4 Desktop Layout

Desktop menjadi prioritas utama karena aplikasi kemungkinan besar digunakan di komputer klinik.

Karakteristik desktop:

* Sidebar tampil secara penuh.
* Topbar tampil lengkap.
* Dashboard menggunakan grid beberapa kolom.
* Form dapat menggunakan dua kolom.
* Tabel menampilkan kolom lengkap.
* Detail pasien dapat menggunakan layout tab.
* Halaman pemeriksaan dokter dapat menggunakan section atau tab horizontal.

Prioritas desktop:

* Efisiensi kerja.
* Tampilan data lengkap.
* Navigasi cepat.
* Tabel dan laporan mudah dibaca.
* Form panjang tetap nyaman digunakan.

### 12.5 Laptop Layout

Laptop menggunakan layout yang hampir sama dengan desktop, tetapi dengan penyesuaian ruang.

Karakteristik laptop:

* Sidebar tetap tampil.
* Beberapa card dashboard dapat turun ke baris berikutnya.
* Tabel tetap menggunakan horizontal scroll jika kolom terlalu banyak.
* Form dapat menggunakan dua kolom untuk field pendek.
* Section pemeriksaan tetap dipisahkan dengan card atau tab.

### 12.6 Tablet Layout

Tablet menggunakan layout semi-compact.

Karakteristik tablet:

* Sidebar dapat berubah menjadi collapsible sidebar.
* Topbar tetap tampil.
* Dashboard menggunakan dua kolom.
* Form menggunakan satu atau dua kolom sesuai kebutuhan.
* Tabel menggunakan horizontal scroll.
* Detail pasien tetap menggunakan tab, tetapi tab dapat dibuat scrollable.
* Tombol aksi utama tetap berada di area atas atau bawah halaman.

### 12.7 Mobile Layout

Mobile digunakan untuk akses cepat, monitoring, atau input sederhana. Mobile bukan prioritas utama untuk pekerjaan berat seperti pengisian rekam medis panjang, tetapi tetap harus mendukung fungsi dasar.

Karakteristik mobile:

* Sidebar berubah menjadi drawer menu.
* Topbar lebih ringkas.
* Dashboard menggunakan single column.
* Card ditampilkan secara vertikal.
* Tabel dapat berubah menjadi card list.
* Form menggunakan satu kolom.
* Tombol utama menggunakan full width.
* Tab dapat dibuat scrollable secara horizontal.
* Konten panjang dibagi menjadi beberapa section accordion.

Prioritas mobile:

* Login.
* Melihat dashboard ringkas.
* Mencari pasien.
* Melihat detail pasien.
* Melihat riwayat kunjungan.
* Melihat rekam medis.
* Melihat resep.
* Input data sederhana seperti tanda vital.
* Melihat laporan ringkas.

Batasan mobile:

Beberapa fitur kompleks tetap lebih direkomendasikan untuk desktop atau tablet, seperti:

* Pengisian rekam medis lengkap.
* Pembuatan laporan detail.
* Pengelolaan user.
* Pengelolaan data obat dalam jumlah banyak.
* Audit log detail.

### 12.8 Responsive Navigation

#### Desktop

Navigasi menggunakan sidebar permanen.

Sidebar berisi:

* Logo aplikasi
* Menu sesuai role
* Active menu state
* Logout atau akses akun

#### Tablet

Navigasi menggunakan collapsible sidebar.

Behavior:

* Sidebar dapat diperkecil.
* Icon tetap tampil.
* Label menu dapat disembunyikan.
* User dapat membuka kembali sidebar jika diperlukan.

#### Mobile

Navigasi menggunakan drawer menu.

Behavior:

* Menu dibuka melalui tombol hamburger.
* Drawer muncul dari sisi kiri.
* Menu menyesuaikan role user.
* Drawer tertutup otomatis setelah user memilih menu.
* Tombol logout tetap tersedia di bagian bawah drawer.

### 12.9 Responsive Dashboard

#### Desktop

* Summary card tampil dalam 4 kolom.
* Chart dan table dapat berdampingan.
* Aktivitas terbaru tampil di sisi kanan atau bawah.

#### Tablet

* Summary card tampil dalam 2 kolom.
* Chart berada di bawah summary card.
* Table menggunakan horizontal scroll jika diperlukan.

#### Mobile

* Summary card tampil satu kolom.
* Chart dibuat lebih sederhana.
* Data list ditampilkan dalam bentuk card.
* Informasi yang tidak terlalu penting dapat disembunyikan atau dipindahkan ke section detail.

### 12.10 Responsive Table

Tabel digunakan pada data pasien, kunjungan, obat, resep, user, laporan, dan audit log.

#### Desktop

* Tabel menampilkan kolom lengkap.
* Aksi berada di kolom kanan.
* Search, filter, dan pagination tampil lengkap.

#### Tablet

* Tabel tetap digunakan dengan horizontal scroll.
* Kolom penting tetap berada di kiri.
* Beberapa kolom opsional dapat disembunyikan.

#### Mobile

Pada mobile, tabel dapat menggunakan dua pendekatan:

1. Horizontal scroll, jika data tabel harus tetap lengkap.
2. Card list, jika data lebih nyaman dibaca dalam bentuk ringkas.

Kolom prioritas mobile untuk halaman pasien:

* Nama pasien
* Nomor rekam medis
* Status
* Aksi

Kolom prioritas mobile untuk halaman kunjungan:

* Nama pasien
* Dokter
* Status
* Tanggal
* Aksi

Kolom prioritas mobile untuk halaman resep:

* Nama pasien
* Dokter
* Status resep
* Aksi

### 12.11 Responsive Form

#### Desktop

* Form dapat menggunakan dua kolom.
* Field panjang seperti alamat dan catatan menggunakan full width.
* Tombol aksi berada di kanan bawah atau sticky footer.

#### Tablet

* Form dapat menggunakan satu atau dua kolom.
* Section form dipisahkan dengan card.
* Tombol aksi tetap mudah ditemukan.

#### Mobile

* Form menggunakan satu kolom.
* Input menggunakan full width.
* Label selalu tampil.
* Field angka diberi satuan.
* Tombol submit menggunakan full width.
* Form panjang dibagi menjadi section accordion atau stepper.

Form yang perlu responsive khusus:

* Form tambah pasien
* Form kunjungan
* Form tanda vital
* Form pemeriksaan dokter
* Form resep
* Form obat
* Form user

### 12.12 Responsive Medical Record Page

Halaman rekam medis dokter memiliki data yang cukup banyak, sehingga perlu desain responsive khusus.

#### Desktop

Halaman dapat dibagi menjadi beberapa section:

* Informasi pasien
* Tanda vital
* SOAP
* Pemeriksaan fisik
* Diagnosa
* Tindakan
* Resep
* Finalisasi

Section dapat ditampilkan dalam layout dua kolom atau tab.

#### Tablet

* Section tampil dalam card vertikal.
* Tab dapat dibuat scrollable.
* Informasi pasien tetap tampil di bagian atas.
* Tombol simpan dan finalisasi tetap mudah dijangkau.

#### Mobile

* Section ditampilkan dalam accordion.
* Informasi pasien dibuat ringkas.
* Tanda vital tampil sebagai compact card.
* Form SOAP tampil satu kolom.
* Diagnosa, tindakan, dan resep dapat dibuka satu per satu.
* Tombol simpan draft dan finalisasi dibuat sticky di bagian bawah jika memungkinkan.

### 12.13 Responsive Patient Detail Page

#### Desktop

* Patient profile card di bagian atas.
* Informasi pasien dan statistik singkat dapat berdampingan.
* Riwayat ditampilkan menggunakan tab.
* Tabel riwayat tampil lengkap.

#### Tablet

* Profile card full width.
* Statistik turun ke bawah.
* Tab dapat scroll horizontal.
* Riwayat menggunakan tabel scroll.

#### Mobile

* Profile pasien tampil sebagai card ringkas.
* Informasi tambahan dapat menggunakan accordion.
* Tab riwayat berubah menjadi segmented control atau horizontal scroll.
* Riwayat kunjungan ditampilkan sebagai card list.

### 12.14 Responsive Report Page

#### Desktop

* Filter laporan tampil horizontal.
* Summary card tampil 3 sampai 4 kolom.
* Chart dan tabel dapat berdampingan.
* Export button berada di kanan atas.

#### Tablet

* Filter laporan dapat turun ke dua baris.
* Summary card tampil dua kolom.
* Chart full width.
* Tabel menggunakan horizontal scroll.

#### Mobile

* Filter laporan tampil satu kolom.
* Date picker full width.
* Summary card tampil satu kolom.
* Chart dibuat sederhana.
* Tabel laporan dapat berubah menjadi card list.
* Export button full width.

### 12.15 Touch-Friendly Interaction

Untuk tablet dan mobile, desain harus mendukung interaksi sentuh.

Requirement:

* Tombol memiliki ukuran klik yang nyaman.
* Jarak antar tombol tidak terlalu dekat.
* Dropdown mudah dipilih.
* Date picker nyaman digunakan pada layar kecil.
* Dialog tidak terlalu besar.
* Tombol aksi penting tidak terlalu dekat dengan tombol aksi berbahaya.
* Table row action tidak terlalu kecil.

### 12.16 Responsive UI States

#### Loading State

* Desktop: skeleton table atau skeleton card.
* Mobile: skeleton card list.

#### Empty State

* Desktop: empty state di tengah table atau card.
* Mobile: empty state ringkas dengan tombol aksi full width.

#### Error State

* Desktop: alert di atas halaman atau dekat form.
* Mobile: alert ringkas dan mudah dibaca.

#### Success State

* Desktop: toast notification.
* Mobile: toast atau inline success message.

#### Confirmation Dialog

* Desktop: modal center.
* Mobile: bottom sheet atau modal full width.

### 12.17 Responsive Testing Plan

Ukuran layar yang perlu diuji:

* Mobile small: 360px
* Mobile large: 414px
* Tablet: 768px
* Small laptop: 1024px
* Desktop: 1280px
* Large desktop: 1440px

Browser yang perlu diuji:

* Google Chrome
* Microsoft Edge
* Mozilla Firefox
* Safari, jika memungkinkan

Scenario yang diuji:

* Login pada mobile dan desktop.
* Buka dashboard di berbagai ukuran layar.
* Search pasien pada mobile.
* Tambah pasien pada mobile dan desktop.
* Buat kunjungan pada tablet.
* Input tanda vital pada tablet atau mobile.
* Isi rekam medis pada desktop.
* Lihat detail pasien pada mobile.
* Proses resep pada tablet.
* Buka laporan pada desktop dan mobile.
* Buka drawer navigation pada mobile.
* Cek tabel dengan data banyak.
* Cek form panjang.
* Cek modal confirmation.

### 12.18 Responsive Acceptance Criteria

Responsive design dianggap berhasil jika memenuhi kriteria berikut:

* Aplikasi dapat dibuka pada desktop, tablet, dan mobile tanpa layout rusak.
* Sidebar berubah menjadi drawer pada mobile.
* Tabel tetap dapat dibaca melalui horizontal scroll atau card list.
* Form tetap nyaman diisi pada layar kecil.
* Tombol aksi utama tetap mudah ditemukan.
* Informasi penting pasien tetap terlihat jelas pada mobile.
* Dashboard tetap terbaca pada berbagai ukuran layar.
* Halaman rekam medis tetap dapat digunakan tanpa tampilan terlalu padat.
* Dialog dan modal tidak keluar dari layar.
* Tidak ada teks penting yang terpotong.
* Tidak ada tombol yang terlalu kecil untuk ditekan.
* Semua halaman MVP sudah diuji minimal pada ukuran 360px, 768px, 1024px, dan 1280px.

---

## 13. Page Design Requirements

### 13.1 Login Page

Elemen utama:

* Logo atau nama aplikasi
* Judul login
* Input email atau username
* Input password
* Tombol login
* Error message
* Loading state

Design notes:

Halaman login harus sederhana, profesional, dan fokus pada form login.

### 13.2 Dashboard Page

Elemen utama:

* Summary card
* Grafik kunjungan sederhana
* Daftar pasien menunggu
* Daftar resep pending
* Stok obat rendah
* Aktivitas terbaru

Design notes:

Dashboard harus menampilkan informasi paling penting sesuai role. Jangan menampilkan terlalu banyak data dalam satu layar.

### 13.3 Patient List Page

Elemen utama:

* Search bar
* Filter status
* Table pasien
* Tombol tambah pasien
* Pagination
* Empty state

Kolom tabel:

* Nomor rekam medis
* NIK
* Nama pasien
* Tanggal lahir
* Jenis kelamin
* Nomor telepon
* Status
* Aksi

Design notes:

Search pasien harus menjadi elemen utama karena sering digunakan oleh petugas.

### 13.4 Patient Detail Page

Elemen utama:

* Patient profile card
* Informasi dasar pasien
* Badge status pasien
* Tab riwayat
* Riwayat kunjungan
* Riwayat rekam medis
* Dokumen pasien
* Tombol buat kunjungan

Tab yang digunakan:

* Overview
* Kunjungan
* Rekam Medis
* Resep
* Dokumen

### 13.5 Visit Page

Elemen utama:

* Filter tanggal
* Filter status
* Filter dokter
* Table kunjungan
* Badge status kunjungan
* Tombol tambah kunjungan

Status badge:

* Menunggu
* Dalam Pemeriksaan
* Selesai
* Dibatalkan

### 13.6 Vital Sign Form Page

Elemen utama:

* Informasi pasien
* Informasi kunjungan
* Input tekanan darah
* Input suhu
* Input berat badan
* Input tinggi badan
* Input nadi
* Input respirasi
* Input saturasi oksigen
* Catatan perawat
* Tombol simpan

Design notes:

Form tanda vital harus ringkas dan mudah diisi. Field angka harus diberi satuan agar user tidak bingung.

### 13.7 Medical Record Form Page

Elemen utama:

* Informasi pasien
* Informasi kunjungan
* Tanda vital
* Form SOAP
* Pemeriksaan fisik
* Diagnosa
* Tindakan
* Resep
* Catatan dokter
* Rencana kontrol
* Tombol simpan draft
* Tombol finalisasi

Rekomendasi section:

* Informasi Pasien
* Tanda Vital
* Pemeriksaan
* Diagnosa
* Tindakan
* Resep
* Finalisasi

Design notes:

Halaman pemeriksaan dokter sebaiknya menggunakan section atau tab agar tidak terlalu panjang.

### 13.8 Prescription Page

Elemen utama:

* Informasi pasien
* Informasi dokter
* Daftar obat
* Dosis
* Aturan pakai
* Jumlah
* Catatan
* Status resep
* Tombol proses resep

Design notes:

Apoteker harus dapat melihat resep dengan jelas dan langsung mengetahui apakah stok obat mencukupi.

### 13.9 Medicine Page

Elemen utama:

* Search obat
* Filter kategori
* Filter status
* Filter stok rendah
* Table obat
* Tombol tambah obat

Kolom tabel:

* Kode obat
* Nama obat
* Kategori
* Satuan
* Stok
* Stok minimum
* Tanggal kedaluwarsa
* Status
* Aksi

### 13.10 Report Page

Elemen utama:

* Filter periode
* Summary card
* Table laporan
* Chart sederhana
* Tombol export PDF
* Tombol export Excel

Design notes:

Laporan harus mudah difilter berdasarkan tanggal. Grafik digunakan hanya jika membantu pemahaman, bukan sekadar hiasan kosong.

---

## 14. UI States

Setiap halaman perlu memiliki beberapa state agar pengalaman pengguna jelas.

### 14.1 Loading State

Digunakan saat data sedang dimuat.

Contoh:

* Skeleton table
* Spinner pada tombol submit
* Loading card pada dashboard

### 14.2 Empty State

Digunakan saat data belum tersedia.

Contoh:

* Belum ada pasien.
* Belum ada kunjungan hari ini.
* Belum ada resep pending.
* Belum ada laporan untuk periode ini.

### 14.3 Error State

Digunakan ketika terjadi kesalahan.

Contoh:

* Gagal memuat data.
* Gagal menyimpan data.
* Password salah.
* Session berakhir.

### 14.4 Success State

Digunakan ketika aksi berhasil.

Contoh:

* Data pasien berhasil disimpan.
* Rekam medis berhasil difinalisasi.
* Resep berhasil diproses.
* Obat berhasil diperbarui.

### 14.5 Confirmation State

Digunakan untuk aksi penting.

Contoh:

* Finalisasi rekam medis.
* Proses resep.
* Nonaktifkan user.
* Hapus dokumen.
* Logout.

---

## 15. Accessibility Requirements

Desain harus memperhatikan aksesibilitas dasar.

Requirement:

* Kontras teks harus cukup jelas.
* Semua input memiliki label.
* Error message ditampilkan dekat dengan field terkait.
* Tombol memiliki teks yang jelas.
* Navigasi dapat dipahami tanpa hanya mengandalkan warna.
* Status penting menggunakan teks dan warna.
* Fokus keyboard terlihat.
* Ukuran klik tombol cukup nyaman.
* Form medis tidak hanya menggunakan placeholder sebagai label.

---

## 16. Form Design Guidelines

Guidelines:

* Gunakan label yang jelas untuk setiap field.
* Gunakan placeholder hanya sebagai contoh, bukan pengganti label.
* Field wajib diberi tanda required.
* Validasi dilakukan di client dan server.
* Error message harus spesifik.
* Field angka diberi satuan, seperti kg, cm, bpm, dan °C.
* Form panjang dibagi menjadi beberapa section.
* Tombol utama ditempatkan di bagian bawah form.
* Aksi berbahaya menggunakan warna danger dan confirmation dialog.
* Pada mobile, form harus menggunakan layout satu kolom.

---

## 17. Table Design Guidelines

Guidelines:

* Tabel memiliki search dan filter jika data berpotensi banyak.
* Tabel memiliki pagination.
* Kolom penting diletakkan di kiri.
* Status menggunakan badge.
* Aksi diletakkan di kolom paling kanan.
* Tabel mendukung empty state.
* Tabel mendukung loading state.
* Tabel pada mobile dapat menggunakan horizontal scroll atau card list.

---

## 18. Core Features

### 18.1 Custom Authentication

Sistem autentikasi dibuat langsung di dalam aplikasi. User login menggunakan email atau username dan password. Setelah login berhasil, sistem membuat session dan menyimpannya di database.

Functional requirements:

* User dapat login menggunakan email atau username dan password.
* Sistem memvalidasi input login.
* Password disimpan dalam bentuk hash.
* Session disimpan di database.
* Cookie session menggunakan HTTP-only cookie.
* User dapat logout.
* Session dihapus atau dinonaktifkan saat logout.
* User inactive tidak dapat login.
* Middleware melindungi halaman private.

Acceptance criteria:

* User valid dapat login.
* User tidak valid tidak dapat login.
* Password tidak tersimpan dalam bentuk plain text.
* User yang belum login tidak bisa masuk dashboard.
* User hanya bisa mengakses fitur sesuai role.
* Logout menghapus session aktif.

### 18.2 Dashboard

Dashboard menampilkan ringkasan data utama sesuai role user.

Data yang ditampilkan:

* Jumlah pasien
* Jumlah kunjungan hari ini
* Jumlah pasien menunggu
* Jumlah rekam medis selesai
* Jumlah resep pending
* Jumlah obat stok rendah
* Grafik kunjungan sederhana

Acceptance criteria:

* Dashboard menampilkan data sesuai role.
* User hanya melihat informasi yang berhak diakses.
* Data dashboard diperbarui berdasarkan database terbaru.
* Dashboard responsive di desktop, tablet, dan mobile.

### 18.3 Manajemen User

Fitur untuk membuat dan mengelola akun user aplikasi.

Data user:

* Nama
* Email
* Username
* Password
* Role
* Status akun

Functional requirements:

* Admin dapat menambah user.
* Admin dapat mengubah data user.
* Admin dapat menonaktifkan user.
* Admin dapat mengatur role user.
* Password user di-hash sebelum disimpan.

Acceptance criteria:

* Email user tidak boleh duplikat.
* Username tidak boleh duplikat.
* User inactive tidak dapat login.
* Aktivitas tambah, ubah, dan nonaktif user tercatat di audit log.

### 18.4 Manajemen Pasien

Fitur untuk menyimpan dan mengelola data identitas pasien.

Data pasien:

* Nomor rekam medis
* NIK
* Nama lengkap
* Tanggal lahir
* Jenis kelamin
* Alamat
* Nomor telepon
* Golongan darah
* Alergi
* Kontak darurat
* Status pasien

Functional requirements:

* Petugas dapat menambah pasien.
* Petugas dapat mengubah data pasien.
* User berwenang dapat mencari pasien.
* Sistem membuat nomor rekam medis otomatis.
* Sistem mencegah duplikasi NIK.
* Detail pasien menampilkan riwayat kunjungan dan rekam medis.

Acceptance criteria:

* Data pasien berhasil disimpan.
* Nomor rekam medis unik.
* NIK tidak boleh sama dengan pasien lain.
* Data pasien dapat dicari berdasarkan nama, NIK, atau nomor rekam medis.
* Halaman pasien tetap usable di mobile melalui card list atau table scroll.

### 18.5 Pendaftaran Kunjungan

Fitur untuk mencatat kunjungan pasien ke fasilitas kesehatan.

Data kunjungan:

* Pasien
* Tanggal kunjungan
* Poli atau layanan
* Dokter tujuan
* Keluhan utama
* Status kunjungan
* Petugas pembuat kunjungan

Status kunjungan:

* Menunggu
* Dalam pemeriksaan
* Selesai
* Dibatalkan

Functional requirements:

* Petugas dapat membuat kunjungan baru.
* Dokter dapat melihat daftar pasien yang menunggu.
* Status kunjungan dapat diperbarui.
* Kunjungan terhubung dengan data pasien.

Acceptance criteria:

* Kunjungan baru berhasil dibuat.
* Kunjungan muncul di daftar pemeriksaan dokter.
* Status kunjungan berubah sesuai proses pelayanan.
* Kunjungan yang selesai memiliki rekam medis final.

### 18.6 Tanda Vital

Fitur untuk mencatat pemeriksaan awal pasien sebelum diperiksa dokter.

Data tanda vital:

* Tekanan darah
* Suhu tubuh
* Berat badan
* Tinggi badan
* Denyut nadi
* Respirasi
* Saturasi oksigen
* Catatan perawat

Functional requirements:

* Perawat dapat mengisi tanda vital.
* Dokter dapat melihat tanda vital saat pemeriksaan.
* Tanda vital terhubung dengan kunjungan.

Acceptance criteria:

* Data tanda vital berhasil disimpan.
* Tanda vital tampil pada halaman pemeriksaan dokter.
* Satu kunjungan dapat memiliki satu data tanda vital utama.
* Form tanda vital responsive dan nyaman digunakan pada tablet atau mobile.

### 18.7 Rekam Medis Dokter

Fitur utama untuk mencatat hasil pemeriksaan pasien oleh dokter.

Data rekam medis:

* Subjective
* Objective
* Assessment
* Plan
* Keluhan utama
* Riwayat penyakit sekarang
* Riwayat penyakit dahulu
* Pemeriksaan fisik
* Catatan dokter
* Rencana kontrol
* Status final

Functional requirements:

* Dokter dapat membuat rekam medis berdasarkan kunjungan.
* Dokter dapat mengisi hasil pemeriksaan.
* Dokter dapat menambahkan diagnosa.
* Dokter dapat menambahkan tindakan.
* Dokter dapat membuat resep.
* Rekam medis dapat difinalisasi.
* Rekam medis final tidak dapat diubah sembarangan.

Acceptance criteria:

* Rekam medis berhasil dibuat untuk kunjungan.
* Rekam medis dapat dilihat di detail pasien.
* Rekam medis final terkunci.
* Perubahan rekam medis tercatat di audit log.
* Halaman rekam medis menggunakan section, tab, atau accordion agar tetap rapi di berbagai device.

### 18.8 Diagnosa

Fitur untuk mencatat diagnosa pasien berdasarkan hasil pemeriksaan dokter.

Data diagnosa:

* Kode diagnosa
* Nama diagnosa
* Jenis diagnosa
* Catatan diagnosa

Jenis diagnosa:

* Diagnosa utama
* Diagnosa tambahan

Functional requirements:

* Dokter dapat menambahkan diagnosa.
* Satu rekam medis dapat memiliki lebih dari satu diagnosa.
* Minimal satu diagnosa utama diperlukan sebelum rekam medis difinalisasi.

Acceptance criteria:

* Diagnosa berhasil tersimpan.
* Diagnosa tampil pada detail rekam medis.
* Rekam medis tidak dapat difinalisasi tanpa diagnosa utama.

### 18.9 Tindakan Medis

Fitur untuk mencatat tindakan medis yang diberikan kepada pasien.

Data tindakan:

* Kode tindakan
* Nama tindakan
* Biaya tindakan
* Catatan tindakan
* Tenaga medis pelaksana

Functional requirements:

* Dokter dapat menambahkan tindakan medis.
* Tindakan terhubung dengan rekam medis.
* Tindakan dapat ditampilkan pada laporan.

Acceptance criteria:

* Tindakan berhasil disimpan.
* Tindakan muncul pada riwayat rekam medis pasien.
* Data tindakan dapat digunakan untuk laporan.

### 18.10 Resep Obat

Fitur untuk membuat dan memproses resep obat.

Data resep:

* Rekam medis
* Dokter pembuat resep
* Status resep
* Obat
* Dosis
* Aturan pakai
* Jumlah
* Catatan penggunaan

Status resep:

* Pending
* Diproses
* Dibatalkan

Functional requirements:

* Dokter dapat membuat resep dari halaman pemeriksaan.
* Resep dapat berisi lebih dari satu obat.
* Apoteker dapat melihat resep pending.
* Apoteker dapat memproses resep.
* Stok obat berkurang setelah resep diproses.

Acceptance criteria:

* Resep berhasil dibuat.
* Resep muncul di halaman apoteker.
* Stok obat otomatis berkurang setelah diproses.
* Resep yang sudah diproses tidak dapat diproses ulang.
* Halaman resep responsive pada tablet dan mobile.

### 18.11 Manajemen Obat

Fitur untuk mengelola data obat dan stok obat.

Data obat:

* Kode obat
* Nama obat
* Kategori obat
* Satuan
* Stok
* Stok minimum
* Harga
* Tanggal kedaluwarsa
* Status obat

Functional requirements:

* Apoteker atau admin dapat menambah obat.
* Apoteker atau admin dapat mengubah data obat.
* Sistem menampilkan peringatan stok rendah.
* Sistem menampilkan obat yang mendekati kedaluwarsa.
* Obat inactive tidak dapat digunakan dalam resep baru.

Acceptance criteria:

* Obat berhasil disimpan.
* Stok obat berubah setelah resep diproses.
* Sistem dapat menampilkan daftar stok rendah.
* Sistem dapat menampilkan obat mendekati kedaluwarsa.

### 18.12 Dokumen Medis

Fitur untuk menyimpan dokumen pendukung pasien.

Jenis dokumen:

* Hasil laboratorium
* Surat rujukan
* Surat kontrol
* Foto pemeriksaan
* Dokumen pendukung lainnya

Functional requirements:

* User berwenang dapat mengunggah dokumen.
* Dokumen terhubung dengan pasien dan kunjungan.
* File disimpan di Supabase Storage atau storage server yang ditentukan.
* File hanya dapat diakses oleh role yang memiliki izin.

Acceptance criteria:

* Dokumen berhasil diunggah.
* Dokumen muncul pada detail pasien atau detail kunjungan.
* User tanpa izin tidak dapat membuka dokumen.

### 18.13 Laporan

Fitur untuk menampilkan laporan dasar operasional dan medis.

Jenis laporan:

* Laporan kunjungan
* Laporan pasien baru
* Laporan diagnosa
* Laporan tindakan
* Laporan penggunaan obat
* Laporan stok obat
* Laporan berdasarkan periode

Functional requirements:

* Admin dapat melihat laporan.
* Laporan dapat difilter berdasarkan tanggal.
* Laporan dapat diekspor ke PDF atau Excel.
* Laporan hanya dapat diakses oleh role tertentu.

Acceptance criteria:

* Laporan berhasil ditampilkan.
* Filter tanggal berjalan dengan benar.
* Data laporan sesuai dengan data di database.
* Export PDF atau Excel berjalan pada fase lanjutan.
* Halaman laporan responsive pada desktop, tablet, dan mobile.

### 18.14 Audit Log

Fitur untuk mencatat aktivitas penting user di aplikasi.

Aktivitas yang dicatat:

* Login
* Logout
* Tambah user
* Ubah user
* Nonaktifkan user
* Tambah pasien
* Ubah pasien
* Buat kunjungan
* Ubah status kunjungan
* Tambah rekam medis
* Finalisasi rekam medis
* Tambah resep
* Proses resep
* Upload dokumen
* Export laporan

Functional requirements:

* Sistem mencatat aktivitas penting secara otomatis.
* Audit log menyimpan user, aksi, entitas, waktu, dan IP address.
* Audit log hanya dapat dilihat oleh admin tertentu.
* Audit log tidak dapat dihapus oleh user biasa.

Acceptance criteria:

* Aktivitas penting tercatat otomatis.
* Admin dapat melihat audit log.
* User biasa tidak dapat menghapus audit log.

---

## 19. Conceptual Data Model

Bagian ini menjelaskan model data secara konseptual tanpa memasukkan Prisma schema.

### 19.1 User

Menyimpan data akun pengguna aplikasi.

Field utama:

* ID user
* Nama
* Email
* Username
* Password hash
* Role
* Status akun
* Waktu login terakhir
* Waktu dibuat
* Waktu diperbarui

### 19.2 Role

Menyimpan daftar role pengguna.

Field utama:

* ID role
* Nama role
* Deskripsi role
* Waktu dibuat
* Waktu diperbarui

### 19.3 Session

Menyimpan session login user.

Field utama:

* ID session
* User
* Token hash
* Waktu expired
* Waktu revoked
* IP address
* User agent
* Waktu dibuat

### 19.4 Patient

Menyimpan data pasien.

Field utama:

* ID pasien
* Nomor rekam medis
* NIK
* Nama lengkap
* Tanggal lahir
* Jenis kelamin
* Alamat
* Nomor telepon
* Golongan darah
* Alergi
* Kontak darurat
* Status pasien

### 19.5 Visit

Menyimpan data kunjungan pasien.

Field utama:

* ID kunjungan
* Pasien
* Dokter
* Tanggal kunjungan
* Poli atau layanan
* Keluhan utama
* Status kunjungan
* Petugas pembuat kunjungan

### 19.6 Vital Sign

Menyimpan data tanda vital pasien.

Field utama:

* ID tanda vital
* Kunjungan
* Tekanan darah
* Suhu tubuh
* Berat badan
* Tinggi badan
* Nadi
* Respirasi
* Saturasi oksigen
* Catatan perawat

### 19.7 Medical Record

Menyimpan hasil pemeriksaan dokter.

Field utama:

* ID rekam medis
* Kunjungan
* Subjective
* Objective
* Assessment
* Plan
* Pemeriksaan fisik
* Catatan dokter
* Tanggal kontrol
* Status final
* Dokter pembuat

### 19.8 Diagnosis

Menyimpan diagnosa pasien.

Field utama:

* ID diagnosa
* Rekam medis
* Kode diagnosa
* Nama diagnosa
* Jenis diagnosa
* Catatan diagnosa

### 19.9 Treatment

Menyimpan tindakan medis.

Field utama:

* ID tindakan
* Rekam medis
* Kode tindakan
* Nama tindakan
* Biaya tindakan
* Catatan tindakan
* Tenaga medis pelaksana

### 19.10 Medicine

Menyimpan data obat.

Field utama:

* ID obat
* Kode obat
* Nama obat
* Kategori
* Satuan
* Stok
* Stok minimum
* Harga
* Tanggal kedaluwarsa
* Status obat

### 19.11 Prescription

Menyimpan data resep.

Field utama:

* ID resep
* Rekam medis
* Status resep
* Dokter pembuat resep
* Apoteker pemroses
* Waktu dibuat
* Waktu diproses

### 19.12 Prescription Item

Menyimpan detail obat dalam resep.

Field utama:

* ID item resep
* Resep
* Obat
* Dosis
* Aturan pakai
* Jumlah
* Catatan penggunaan

### 19.13 Medical Document

Menyimpan dokumen medis pasien.

Field utama:

* ID dokumen
* Pasien
* Kunjungan
* Jenis dokumen
* Nama file
* URL file
* User pengunggah
* Waktu upload

### 19.14 Audit Log

Menyimpan catatan aktivitas penting user.

Field utama:

* ID log
* User
* Aksi
* Nama entitas
* ID entitas
* Data sebelum perubahan
* Data setelah perubahan
* IP address
* User agent
* Waktu aktivitas

---

## 20. Entity Relationship

Relasi utama dalam sistem:

* One Role has many Users.
* One User has many Sessions.
* One Patient has many Visits.
* One Visit belongs to one Patient.
* One Visit belongs to one Doctor.
* One Visit has one Vital Sign.
* One Visit has one Medical Record.
* One Medical Record has many Diagnoses.
* One Medical Record has many Treatments.
* One Medical Record has one Prescription.
* One Prescription has many Prescription Items.
* One Medicine has many Prescription Items.
* One Patient has many Medical Documents.
* One Visit has many Medical Documents.
* One User has many Audit Logs.

---

## 21. Permission Matrix

| Feature                | Super Admin | Admin Klinik | Petugas | Dokter  | Perawat | Apoteker |
| ---------------------- | ----------- | ------------ | ------- | ------- | ------- | -------- |
| Dashboard              | Yes         | Yes          | Yes     | Yes     | Yes     | Yes      |
| Kelola User            | Yes         | Yes          | No      | No      | No      | No       |
| Kelola Pasien          | Yes         | Yes          | Yes     | View    | View    | No       |
| Buat Kunjungan         | Yes         | Yes          | Yes     | No      | No      | No       |
| Input Tanda Vital      | Yes         | Yes          | No      | View    | Yes     | No       |
| Input Rekam Medis      | Yes         | No           | No      | Yes     | No      | No       |
| Finalisasi Rekam Medis | Yes         | No           | No      | Yes     | No      | No       |
| Buat Resep             | Yes         | No           | No      | Yes     | No      | No       |
| Proses Resep           | Yes         | No           | No      | No      | No      | Yes      |
| Kelola Obat            | Yes         | Yes          | No      | View    | No      | Yes      |
| Upload Dokumen         | Yes         | Yes          | No      | Yes     | Yes     | No       |
| Laporan                | Yes         | Yes          | No      | Limited | No      | Limited  |
| Audit Log              | Yes         | Limited      | No      | No      | No      | No       |

---

## 22. Non-Functional Requirements

### 22.1 Security

* Password wajib di-hash.
* Session menggunakan HTTP-only cookie.
* Cookie menggunakan secure flag di production.
* Cookie menggunakan sameSite protection.
* Route private wajib dilindungi middleware.
* User hanya dapat mengakses data sesuai role.
* Data penting harus memiliki audit log.
* Secret key tidak boleh disimpan di frontend.
* Database hanya diakses dari server-side.
* Dokumen medis tidak boleh diakses secara publik.

### 22.2 Performance

* Halaman dashboard dimuat kurang dari 3 detik pada koneksi normal.
* Pencarian pasien harus cepat.
* Query laporan harus menggunakan filter tanggal.
* Database index digunakan pada kolom penting seperti NIK, nomor rekam medis, dan tanggal kunjungan.
* UI harus tetap ringan pada desktop, tablet, dan mobile.

### 22.3 Usability

* UI sederhana dan mudah dipahami.
* Form tidak terlalu panjang dalam satu layar.
* Data pasien mudah dicari.
* Status kunjungan jelas.
* Error message mudah dimengerti.
* Setiap role hanya melihat menu yang relevan.
* Layout tetap nyaman digunakan pada berbagai ukuran device.

### 22.4 Reliability

* Data pasien tidak boleh duplikat berdasarkan NIK dan nomor rekam medis.
* Session expired otomatis setelah periode tertentu.
* Sistem memiliki validasi input di client dan server.
* Sistem memiliki backup database berkala melalui Supabase.

### 22.5 Privacy

* Data pasien hanya dapat diakses oleh user berwenang.
* Rekam medis final tidak dapat diubah tanpa izin khusus.
* Dokumen medis tidak boleh diakses secara publik.
* Aktivitas akses data sensitif harus tercatat.

### 22.6 Responsiveness

* Aplikasi harus mendukung desktop, laptop, tablet, dan mobile.
* Layout harus menyesuaikan ukuran layar tanpa merusak konten.
* Navigasi harus berubah sesuai device.
* Tabel harus tetap dapat dibaca pada layar kecil.
* Form harus tetap nyaman diisi pada mobile.
* Komponen UI tidak boleh keluar dari viewport.

---

## 23. Design Phase

### Phase 1: UI/UX Research & Requirement Mapping

Goals:

Memahami kebutuhan pengguna dan alur kerja utama aplikasi.

Tasks:

* Menentukan role pengguna.
* Menentukan kebutuhan setiap role.
* Menentukan fitur prioritas.
* Membuat user flow utama.
* Membuat sitemap aplikasi.
* Menentukan kebutuhan responsive untuk setiap role.

Deliverables:

* User role definition
* User flow
* Sitemap
* Initial design notes
* Responsive requirement notes

### Phase 2: Wireframing

Goals:

Membuat struktur awal halaman aplikasi.

Tasks:

* Membuat low-fidelity wireframe.
* Menentukan layout dashboard.
* Menentukan layout form pasien.
* Menentukan layout pemeriksaan dokter.
* Menentukan layout tabel dan detail data.
* Membuat wireframe desktop, tablet, dan mobile untuk halaman utama.

Deliverables:

* Low-fidelity wireframe
* Struktur halaman utama
* Layout awal dashboard dan form
* Wireframe responsive halaman prioritas

### Phase 3: Design System

Goals:

Membuat standar visual dan komponen UI.

Tasks:

* Menentukan warna utama.
* Menentukan typography.
* Menentukan spacing.
* Menentukan komponen utama.
* Membuat style untuk button, input, card, table, badge, dialog, drawer, dan accordion.
* Menentukan responsive behavior untuk komponen utama.

Deliverables:

* Color palette
* Typography scale
* Component guideline
* UI style guide
* Responsive component guideline

### Phase 4: High-Fidelity Design

Goals:

Membuat desain final halaman prioritas.

Tasks:

* Mendesain halaman login.
* Mendesain dashboard.
* Mendesain halaman pasien.
* Mendesain halaman detail pasien.
* Mendesain halaman pemeriksaan dokter.
* Mendesain halaman resep.
* Mendesain halaman obat.
* Mendesain halaman laporan.
* Mendesain versi desktop, tablet, dan mobile untuk halaman prioritas.

Deliverables:

* High-fidelity UI design
* Prototype dasar
* Design handoff untuk development
* Responsive high-fidelity screen

### Phase 5: Usability & Responsive Review

Goals:

Memastikan desain mudah digunakan dan sesuai alur kerja di berbagai device.

Tasks:

* Review alur pendaftaran pasien.
* Review alur pemeriksaan dokter.
* Review alur resep.
* Review konsistensi komponen.
* Review error state dan empty state.
* Review tampilan desktop, tablet, dan mobile.
* Perbaikan desain berdasarkan hasil review.

Deliverables:

* Revised design
* Final UI flow
* Final design guideline
* Responsive review checklist

---

## 24. Development Phases

### Phase 1: Project Setup & Foundation

Goals:

Membuat fondasi project Next.js fullstack.

Tasks:

* Setup Next.js App Router
* Setup TypeScript
* Setup Tailwind CSS
* Setup Shadcn UI
* Setup Prisma
* Setup Supabase PostgreSQL
* Setup environment variables
* Setup database connection
* Setup layout dashboard
* Setup sidebar navigation
* Setup responsive layout foundation

Deliverables:

* Project Next.js siap digunakan
* Database terkoneksi
* Prisma berjalan
* Layout dashboard tersedia
* Struktur folder rapi
* Responsive layout dasar tersedia

### Phase 2: Custom Authentication & Role Access

Goals:

Membangun sistem login internal dan pembatasan akses berdasarkan role.

Tasks:

* Membuat model konseptual User, Role, dan Session
* Membuat halaman login responsive
* Membuat logic password hashing
* Membuat login Server Action
* Membuat logout Server Action
* Membuat HTTP-only cookie
* Membuat middleware proteksi route
* Membuat helper getCurrentUser
* Membuat permission helper
* Membuat audit log login dan logout

Deliverables:

* User dapat login
* User dapat logout
* Session tersimpan di database
* Route dashboard terlindungi
* Role access berjalan
* Login page responsive

### Phase 3: Patient & Visit Module

Goals:

Membangun fitur dasar pasien dan kunjungan.

Tasks:

* CRUD pasien
* Generate nomor rekam medis otomatis
* Search pasien
* Detail pasien
* Buat kunjungan
* Daftar kunjungan
* Update status kunjungan
* Hubungkan pasien dengan kunjungan
* Buat tampilan table dan card list responsive

Deliverables:

* Modul pasien selesai
* Modul kunjungan selesai
* Pasien dapat memiliki banyak kunjungan
* Dokter dapat melihat daftar kunjungan menunggu
* Halaman pasien dan kunjungan responsive

### Phase 4: Vital Sign & Medical Record Module

Goals:

Membangun fitur inti rekam medis.

Tasks:

* Input tanda vital
* Halaman pemeriksaan dokter
* Input subjective, objective, assessment, plan
* Input pemeriksaan fisik
* Input catatan dokter
* Input rencana kontrol
* Finalisasi rekam medis
* Riwayat rekam medis pasien
* Buat responsive layout untuk form panjang

Deliverables:

* Perawat dapat mengisi tanda vital
* Dokter dapat mengisi rekam medis
* Rekam medis dapat difinalisasi
* Riwayat rekam medis tampil di detail pasien
* Form pemeriksaan responsive

### Phase 5: Diagnosis, Treatment & Prescription Module

Goals:

Membangun fitur diagnosa, tindakan, dan resep.

Tasks:

* Tambah diagnosa
* Tambah tindakan medis
* Buat resep
* Tambah item obat ke resep
* Validasi minimal satu diagnosa utama
* Validasi stok obat sebelum resep diproses
* Buat tampilan resep responsive

Deliverables:

* Dokter dapat menambahkan diagnosa
* Dokter dapat menambahkan tindakan
* Dokter dapat membuat resep
* Resep memiliki beberapa item obat
* Halaman resep responsive

### Phase 6: Medicine & Pharmacy Module

Goals:

Membangun fitur manajemen obat dan pemrosesan resep.

Tasks:

* CRUD obat
* Stok obat
* Stok minimum
* Obat kedaluwarsa
* Daftar resep pending
* Proses resep
* Kurangi stok otomatis
* Laporan penggunaan obat sederhana
* Buat table obat responsive

Deliverables:

* Apoteker dapat mengelola obat
* Apoteker dapat memproses resep
* Stok obat otomatis berkurang
* Obat stok rendah dapat ditampilkan
* Halaman obat responsive

### Phase 7: Medical Document, Report & Audit Log

Goals:

Menambahkan dokumen medis, laporan, dan pencatatan aktivitas.

Tasks:

* Upload dokumen medis
* Hubungkan dokumen dengan pasien dan kunjungan
* Buat laporan kunjungan
* Buat laporan pasien baru
* Buat laporan diagnosa
* Buat laporan penggunaan obat
* Buat audit log untuk aktivitas penting
* Export laporan ke PDF atau Excel
* Buat layout laporan responsive

Deliverables:

* Dokumen medis dapat diunggah
* Laporan dasar tersedia
* Audit log berjalan
* Export laporan tersedia
* Halaman laporan responsive

### Phase 8: Testing, Optimization & Deployment

Goals:

Menyiapkan aplikasi untuk demo atau penggunaan internal.

Tasks:

* Testing role access
* Testing CRUD setiap modul
* Testing validasi form
* Testing session expired
* Testing middleware
* Testing responsive layout
* Testing ukuran layar 360px, 414px, 768px, 1024px, 1280px, dan 1440px
* Optimasi query Prisma
* Tambahkan loading state
* Tambahkan empty state
* Tambahkan error handling
* Deploy ke Vercel
* Cek koneksi Supabase production

Deliverables:

* Aplikasi siap demo
* Aplikasi dapat digunakan secara internal
* Role access berjalan stabil
* Database production siap
* Dokumentasi setup tersedia
* Tampilan responsive sudah diuji

---

## 25. MVP Priority

### 25.1 Must Have

* Custom login
* Logout
* Database session
* Role access
* Dashboard
* Manajemen user
* Manajemen pasien
* Pendaftaran kunjungan
* Tanda vital
* Rekam medis dokter
* Diagnosa
* Resep dasar
* Riwayat pasien
* Audit log dasar
* Layout dashboard
* Sidebar navigation
* Responsive navigation
* Responsive form
* Responsive table
* Form validation
* Loading state
* Empty state
* Error state

### 25.2 Should Have

* Manajemen obat
* Proses resep oleh apoteker
* Upload dokumen medis
* Laporan kunjungan
* Laporan diagnosa
* Laporan penggunaan obat
* Export PDF / Excel
* Design system lengkap
* Responsive layout untuk semua halaman utama
* Mobile card list untuk tabel penting

### 25.3 Could Have

* Grafik dashboard
* Notifikasi stok rendah
* Notifikasi obat kedaluwarsa
* Advanced search
* Filter laporan detail
* Template cetak rekam medis
* Prototype high-fidelity lengkap
* Bottom sheet untuk mobile action
* Stepper untuk form panjang

### 25.4 Won’t Have for MVP

* Integrasi BPJS
* Integrasi SATUSEHAT
* Integrasi SIMRS
* Supabase Auth
* Auth.js
* OAuth login
* Telemedicine
* Mobile app native
* AI diagnosis
* Payment gateway

---

## 26. Success Metrics

### 26.1 Product Metrics

* Data pasien dapat dicari dengan cepat.
* Riwayat rekam medis pasien tersimpan rapi.
* Dokter dapat menyelesaikan pencatatan pemeriksaan dalam satu alur.
* Admin dapat melihat laporan dasar tanpa menghitung manual.
* Jumlah duplikasi data pasien berkurang.
* User dapat memahami navigasi aplikasi tanpa pelatihan panjang.

### 26.2 Technical Metrics

* Login dan logout berjalan stabil.
* Session tidak dapat digunakan setelah logout.
* Password tersimpan dalam bentuk hash.
* User tidak dapat mengakses halaman di luar role.
* Query pasien dan kunjungan berjalan cepat.
* Error aplikasi rendah saat demo atau penggunaan internal.

### 26.3 Design Metrics

* Semua halaman MVP memiliki wireframe.
* Semua role memiliki struktur menu yang jelas.
* Form utama memiliki label, validasi, dan error state.
* Tabel memiliki search, filter, pagination, dan empty state.
* Status kunjungan dan resep mudah dikenali.
* Komponen utama konsisten.

### 26.4 Responsive Metrics

* Semua halaman utama dapat dibuka pada desktop, laptop, tablet, dan mobile.
* Tidak ada layout rusak pada ukuran 360px, 768px, 1024px, dan 1280px.
* Sidebar berubah menjadi drawer pada mobile.
* Tabel tetap terbaca melalui horizontal scroll atau card list.
* Form tetap nyaman diisi pada mobile.
* Tombol utama tetap mudah ditemukan di semua device.
* Halaman rekam medis tetap usable tanpa tampilan terlalu padat.

---

## 27. Final Technical & Design Decision

Aplikasi dibangun sebagai web application standalone menggunakan Next.js fullstack.

Keputusan teknis final:

| Area                 | Decision                                   |
| -------------------- | ------------------------------------------ |
| Tipe Aplikasi        | Standalone Web App                         |
| Framework            | Next.js                                    |
| Frontend             | React, TypeScript, Tailwind CSS, Shadcn UI |
| Backend              | Next.js Server Actions dan Route Handlers  |
| ORM                  | Prisma                                     |
| Database             | Supabase PostgreSQL                        |
| Authentication       | Custom Auth dari aplikasi                  |
| Session              | Database session                           |
| Cookie               | HTTP-only cookie                           |
| Password             | bcrypt atau argon2                         |
| Storage              | Supabase Storage, opsional                 |
| Deployment           | Vercel                                     |
| External Integration | Tidak ada                                  |

Keputusan desain final:

| Area                  | Decision                                    |
| --------------------- | ------------------------------------------- |
| Design Approach       | Responsive Web Design                       |
| Design Priority       | Desktop first                               |
| Supported Device      | Desktop, laptop, tablet, mobile             |
| Desktop Navigation    | Full sidebar                                |
| Tablet Navigation     | Collapsible sidebar                         |
| Mobile Navigation     | Drawer menu                                 |
| Mobile Table          | Horizontal scroll atau card list            |
| Mobile Form           | Single column                               |
| Medical Record Mobile | Accordion atau section-based layout         |
| Dashboard Mobile      | Single column card                          |
| Testing Width         | 360px, 414px, 768px, 1024px, 1280px, 1440px |

---

## 28. Notes

Aplikasi ini dibuat sebagai sistem internal standalone. Supabase digunakan sebagai infrastruktur database dan storage, bukan sebagai sistem eksternal untuk pertukaran data kesehatan.

Fokus utama MVP adalah memastikan data pasien, kunjungan, rekam medis, diagnosa, resep, role access, dan desain alur utama berjalan dengan baik. Fitur tambahan seperti export laporan, upload dokumen, dashboard statistik, dan high-fidelity prototype lengkap dapat dikembangkan setelah fitur inti stabil.

Dokumen ini tidak memasukkan Prisma schema. Data model hanya dijelaskan secara konseptual agar PRD tetap fokus pada kebutuhan produk, fitur, desain, responsive behavior, dan arah pengembangan aplikasi.
