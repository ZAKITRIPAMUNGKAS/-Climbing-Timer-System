# Setup MySQL untuk Admin Dashboard

## 1. Install Dependencies

```bash
npm install
```

Dependencies yang akan diinstall:
- `mysql2` - MySQL client untuk Node.js
- `multer` - File upload handler
- `bcryptjs` - Password hashing
- `express-session` - Session management
- `dotenv` - Environment variables

## 2. Setup Database MySQL

### A. Install MySQL
Pastikan MySQL sudah terinstall di sistem Anda.

### B. Buat File .env
Buat file `.env` di root project dengan isi:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=fpti_karanganyar
DB_PORT=3306

SESSION_SECRET=your-random-secret-key-change-this
PORT=3000
```

### C. Initialize Database
Jalankan script untuk membuat database dan tables:

```bash
node database/init.js
```

Script ini akan:
- Membuat database `fpti_karanganyar`
- Membuat tables: `users`, `athletes`, `schedules`, `news`
- Membuat default admin user:
  - Username: `admin`
  - Password: `admin123`

**⚠️ PENTING: Ubah password admin setelah login pertama kali!**

## 3. Start Server

```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## 4. Akses Admin Dashboard

1. Buka browser dan akses: `http://localhost:3000/admin-login`
2. Login dengan:
   - Username: `admin`
   - Password: `admin123`
3. Setelah login, Anda akan diarahkan ke dashboard admin

## 5. Fitur Admin Dashboard

### Upload Gambar
- Semua gambar (atlet dan berita) menggunakan **upload file**, bukan URL
- File disimpan di folder `public/uploads/`
- Format yang didukung: JPEG, JPG, PNG, GIF, WEBP
- Maksimal ukuran: 5MB

### Rich Text Editor untuk Berita
- Deskripsi berita menggunakan **TinyMCE Rich Text Editor**
- Bisa format teks: **bold**, *italic*, underline, dll
- Bisa insert gambar langsung dari editor
- Bisa membuat list, link, dll

### Authentication
- Semua route admin dilindungi dengan session
- Harus login untuk mengakses dashboard
- Session berlaku selama 24 jam

## Troubleshooting

### Error: MySQL connection failed
- Pastikan MySQL service berjalan
- Cek kredensial di file `.env`
- Pastikan database sudah dibuat (jalankan `node database/init.js`)

### Error: Cannot find module
- Jalankan `npm install` untuk install semua dependencies

### Error: Upload failed
- Pastikan folder `public/uploads/` ada dan bisa ditulis
- Cek ukuran file (maksimal 5MB)
- Cek format file (hanya gambar)

## Struktur Database

### Table: users
- `id` - Primary key
- `username` - Unique username
- `password` - Hashed password (bcrypt)
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Table: athletes
- `id` - Primary key
- `name` - Nama atlet
- `category` - Kategori (Speed Climbing, Lead, Boulder, dll)
- `age` - Umur
- `achievement` - Prestasi
- `image` - Path gambar (contoh: /uploads/image-123.jpg)
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Table: schedules
- `id` - Primary key
- `date` - Tanggal event
- `title` - Judul event
- `location` - Lokasi
- `time` - Waktu
- `status` - Status (upcoming/past)
- `category` - Kategori
- `description` - Deskripsi
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Table: news
- `id` - Primary key
- `title` - Judul berita
- `category` - Kategori (Kompetisi, Latihan, Prestasi)
- `color` - Warna badge (crimson/goldenrod)
- `date` - Tanggal berita
- `description` - Deskripsi (HTML dari rich text editor)
- `image` - Path gambar (contoh: /uploads/image-123.jpg)
- `created_at` - Timestamp
- `updated_at` - Timestamp

