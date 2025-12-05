# 📚 Dokumentasi Lengkap - Sistem Kompetisi Panjat Tebing FPTI Karanganyar

## 📋 Daftar Isi

1. [Overview Sistem](#overview-sistem)
2. [Arsitektur & Teknologi](#arsitektur--teknologi)
3. [Setup & Instalasi](#setup--instalasi)
4. [Flow Penggunaan](#flow-penggunaan)
5. [Fitur-Fitur Utama](#fitur-fitur-utama)
6. [API Documentation](#api-documentation)
7. [Troubleshooting](#troubleshooting)
8. [Dokumen Tambahan](#dokumen-tambahan)

---

## 🎯 Overview Sistem

Sistem Kompetisi Panjat Tebing FPTI Karanganyar adalah aplikasi web lengkap untuk mengelola kompetisi panjat tebing dengan fitur:

- **Live Score Public**: Tampilan real-time hasil kompetisi untuk publik
- **Admin Dashboard**: Manajemen kompetisi, peserta, jadwal, dan user
- **Judge Interface**: Input score untuk kompetisi Boulder dan Speed
- **Timer System**: Sistem timer profesional untuk Speed Climbing dan Boulder
- **Bracket System**: Sistem gugur (Single Elimination) untuk Speed Climbing Final

### Tipe Kompetisi yang Didukung

1. **Boulder Competition**
   - Sistem scoring: Zone & Top dengan attempts
   - Multiple boulders (default: 4)
   - Real-time leaderboard

2. **Speed Climbing Competition**
   - Qualification: 2 lanes (Lane A + Lane B)
   - Finals: Sistem gugur (Top 8)
   - Bracket: Quarter Final → Semi Final → Small Final & Big Final

---

## 🏗️ Arsitektur & Teknologi

### Tech Stack

**Backend:**
- Node.js + Express.js
- MySQL (Database)
- Socket.io (Real-time updates)
- Multer (File upload)
- Bcryptjs (Password hashing)
- Express-session (Authentication)

**Frontend:**
- React 18 + Vite
- React Router DOM
- Tailwind CSS
- Framer Motion (Animations)
- Socket.io Client

**Timer System:**
- HTML5 + CSS3
- Vue.js (CDN)
- Socket.io Client

### Struktur Database

**Tabel Utama:**
- `users` - User management (admin, judge, timer)
- `athletes` - Data atlet profil
- `schedules` - Jadwal kompetisi
- `news` - Berita
- `competitions` - Kompetisi Boulder
- `climbers` - Peserta Boulder
- `scores` - Score Boulder
- `speed_competitions` - Kompetisi Speed
- `speed_climbers` - Peserta Speed
- `speed_qualification_scores` - Score Kualifikasi Speed
- `speed_finals_matches` - Match Final Speed

---

## 🚀 Setup & Instalasi

### Prerequisites

- Node.js (v16 atau lebih baru)
- MySQL (v8.0 atau lebih baru)
- npm atau yarn

### Langkah Instalasi

1. **Clone Repository**
```bash
git clone <repository-url>
cd timer-panjat
```

2. **Install Dependencies**
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

3. **Setup Database**
```bash
# Buat database MySQL
mysql -u root -p

# Di MySQL console:
CREATE DATABASE fpti_karanganyar;
USE fpti_karanganyar;

# Import schema
SOURCE database/schema.sql;

# (Optional) Run migration jika database sudah ada
SOURCE database/migration_add_role_to_users.sql;
```

4. **Konfigurasi Environment**
Buat file `.env` di root directory:
```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fpti_karanganyar
DB_PORT=3306
SESSION_SECRET=your-secret-key-change-in-production
```

5. **Build Frontend (Production)**
```bash
cd client
npm run build
cd ..
```

6. **Start Server**
```bash
# Production
npm start

# Development (dengan hot-reload)
# Terminal 1: Backend
npm start

# Terminal 2: Frontend
cd client
npm run dev
```

### Default Login

- **Username:** `admin`
- **Password:** `admin123`
- **Role:** `admin`

⚠️ **PENTING:** Ganti password default setelah login pertama kali!

---

## 🔄 Flow Penggunaan

### A. Flow untuk Admin

#### 1. Setup Kompetisi Baru

**Boulder Competition:**
1. Login ke Dashboard (`/login`)
2. Navigasi ke **Manage Competitions**
3. Klik **Add Competition**
4. Pilih tipe: **Boulder**
5. Isi:
   - Name: Nama kompetisi
   - Total Boulders: Jumlah boulder (default: 4)
   - Status: Active
6. Klik **Create**

**Speed Competition:**
1. Login ke Dashboard
2. Navigasi ke **Manage Competitions**
3. Klik **Add Competition**
4. Pilih tipe: **Speed Climbing**
5. Isi:
   - Name: Nama kompetisi
   - Status: Qualification
6. Klik **Create**

#### 2. Upload Data Peserta

**Metode 1: Bulk Upload (Recommended)**
1. Di halaman **Manage Competitions**, klik **Upload Peserta** pada competition card
2. Siapkan file CSV/Excel dengan format:
   ```
   name,bib_number,team
   John Doe,1,Tim A
   Jane Smith,2,Tim B
   ```
3. Drag & drop atau pilih file
4. Klik **Upload**
5. Sistem akan memproses dan menampilkan hasil (inserted, skipped, errors)

**Metode 2: Manual Input (via Judge Interface)**
- Lihat bagian "Flow untuk Judge"

#### 3. Generate Bracket (Speed Climbing)

**Setelah Qualifikasi Selesai:**
1. Pastikan semua peserta sudah memiliki score qualifikasi
2. Pastikan ranking sudah terhitung dengan benar
3. Di halaman **Manage Competitions**, klik **Generate Bracket**
4. Sistem akan membuat 4 Quarter Final matches dengan seeding:
   - QF1: Rank 1 vs Rank 8
   - QF2: Rank 4 vs Rank 5
   - QF3: Rank 3 vs Rank 6
   - QF4: Rank 2 vs Rank 7
5. Status competition otomatis berubah ke "finals"

#### 4. Generate Next Round

**Setelah Quarter Final Selesai:**
1. Pastikan semua QF matches sudah memiliki winner
2. Klik **Generate Next Round**
3. Sistem akan membuat 2 Semi Final matches dengan dynamic seeding

**Setelah Semi Final Selesai:**
1. Pastikan semua SF matches sudah memiliki winner
2. Klik **Generate Next Round** lagi
3. Sistem akan membuat:
   - Small Final (3rd place): Loser SF1 vs Loser SF2
   - Big Final (1st place): Winner SF1 vs Winner SF2

#### 5. Manage Schedules

1. Navigasi ke **Manage Schedules**
2. Klik **Add Schedule**
3. Isi:
   - Date: Tanggal kompetisi
   - Title: Judul/jenis kompetisi
   - Location: Lokasi
   - Time: Waktu
   - Category: Speed/Boulder/Lead
   - Status: Upcoming/Past
   - Description: (Optional)
4. Klik **Create**

#### 6. User Management

1. Navigasi ke **User Management**
2. Klik **Add User**
3. Isi:
   - Username: Nama user
   - Password: Password
   - Role: Admin/Judge/Timer
4. Klik **Create**

---

### B. Flow untuk Judge

#### 1. Input Score Boulder

1. Login ke Dashboard
2. Navigasi ke **Judge Interface**
3. Pilih **Competition** dari dropdown
4. Cari peserta menggunakan search bar (nama atau bib number)
5. Klik **Input Score** pada peserta
6. Modal akan muncul dengan semua boulders
7. Untuk setiap boulder:
   - Klik **+ Attempt** untuk menambah attempt
   - Klik **Zone** saat peserta mencapai zone (hanya sekali)
   - Klik **Top** saat peserta mencapai top (auto-finalize)
8. Score otomatis ter-update dan terkirim ke Live Score

#### 2. Input Score Speed Qualification

1. Login ke Dashboard
2. Navigasi ke **Judge Interface**
3. Pilih **Speed Competition** dari dropdown
4. Cari peserta menggunakan search bar
5. Klik **Input Score**
6. Isi:
   - **Lane A Time**: Waktu lane A (dalam detik, e.g., 6.50)
   - **Lane A Status**: VALID/FALL/FALSE_START/DNS
   - **Lane B Time**: Waktu lane B
   - **Lane B Status**: VALID/FALL/FALSE_START/DNS
7. Klik **Save Score**
8. Sistem otomatis:
   - Menghitung total time (Lane A + Lane B)
   - Menentukan status (VALID/INVALID)
   - Menghitung ranking

#### 3. Input Score Speed Finals

1. Buka **Live Score** → Pilih competition → Tab **Final**
2. Atau via **Judge Interface** (jika ada akses)
3. Pilih match yang akan di-input
4. Isi:
   - **Time A**: Waktu climber A
   - **Status A**: VALID/FALL/FALSE_START/DNS
   - **Time B**: Waktu climber B
   - **Status B**: VALID/FALL/FALSE_START/DNS
5. Sistem otomatis:
   - Menghitung winner (lower time wins)
   - Jika kedua FS/FALL → gunakan ranking kualifikasi sebagai tiebreaker
   - Update bracket untuk round berikutnya

---

### C. Flow untuk Public (Live Score)

#### 1. Melihat Live Score

1. Buka website → Klik **Live Score** di navbar
2. Halaman akan menampilkan semua kompetisi aktif (Boulder & Speed)
3. Klik pada card kompetisi yang ingin dilihat
4. Sistem akan redirect ke halaman Live Score dengan:
   - **Tab Qualification** (Speed) atau **Leaderboard** (Boulder)
   - **Tab Finals** (Speed) - jika sudah ada bracket

#### 2. Mencari Atlet

1. Di halaman Live Score, gunakan **Search Bar** di bagian atas
2. Ketik nama atlet atau bib number
3. Hasil akan ter-filter secara real-time

#### 3. Melihat Bracket Final

1. Pilih Speed Competition yang statusnya "finals"
2. Klik tab **Final**
3. Bracket akan ditampilkan dengan urutan:
   - Quarter Final (4 matches)
   - Semi Final (2 matches)
   - Small Final (1 match) - untuk juara 3
   - Big Final (1 match) - untuk juara 1 & 2

---

## 🎨 Fitur-Fitur Utama

### 1. Live Score System

**Fitur:**
- Real-time updates via WebSocket
- Auto-refresh saat ada update score
- Search & filter atlet
- Responsive design (Mobile, Tablet, Desktop)

**Teknologi:**
- Socket.io untuk real-time communication
- React hooks untuk state management

### 2. Admin Dashboard

**Fitur:**
- Manage Competitions (Boulder & Speed)
- Manage Athletes (CRUD + Bulk Upload)
- Manage Schedules
- User Management (Admin, Judge, Timer)
- Generate Bracket (Speed)
- Upload Data Peserta (CSV/Excel)

**Keamanan:**
- Protected routes (require authentication)
- Role-based access control
- Session management

### 3. Judge Interface

**Fitur:**
- Input score Boulder (per boulder)
- Input score Speed (Qualification & Finals)
- Search peserta
- Real-time validation

### 4. Timer System

**Speed Climbing:**
- Dual lane timer
- False start detection
- Sensor simulation (keyboard shortcuts)
- Real-time display untuk proyektor

**Boulder:**
- Countdown timer
- Auto-restart cycle
- Phase management (CLIMBING/REST)
- Audio feedback

### 5. Bracket System (Speed Finals)

**Fitur:**
- Auto-generate bracket dari qualifikasi
- IFSC/FPTI standard seeding
- BYE handling (untuk peserta ganjil)
- Dynamic lane assignment (higher seed di Lane A)
- Auto-progression ke round berikutnya

**Seeding Rules:**
- Quarter Final: Fixed order (Rank 1 vs 8, 4 vs 5, 3 vs 6, 2 vs 7)
- Semi Final: Dynamic seeding berdasarkan ranking kualifikasi
- Final: Dynamic seeding berdasarkan ranking kualifikasi

---

## 📡 API Documentation

### Authentication

**POST `/api/login`**
- Body: `{ username, password }`
- Response: `{ success: true, user: {...} }`

**POST `/api/logout`**
- Response: `{ success: true, message: 'Logout successful' }`

**GET `/api/check-auth`**
- Response: `{ authenticated: true/false, user: {...} }`

### Competitions

**GET `/api/competitions`**
- Response: Array of Boulder competitions

**POST `/api/competitions`** (Auth required)
- Body: `{ name, total_boulders, status }`
- Response: Created competition object

**GET `/api/speed-competitions`**
- Response: Array of Speed competitions

**POST `/api/speed-competitions`** (Auth required)
- Body: `{ name, status }`
- Response: Created competition object

### Climbers

**GET `/api/competitions/:id/climbers`**
- Response: Array of climbers for Boulder competition

**POST `/api/competitions/:id/climbers/bulk-upload`** (Auth required)
- Method: POST
- Content-Type: multipart/form-data
- Body: `file` (CSV/Excel)
- Response: `{ success, inserted, skipped, errors, details }`

**GET `/api/speed-competitions/:id/climbers`**
- Response: Array of climbers for Speed competition

**POST `/api/speed-competitions/:id/climbers/bulk-upload`** (Auth required)
- Method: POST
- Content-Type: multipart/form-data
- Body: `file` (CSV/Excel)
- Response: `{ success, inserted, skipped, errors, details }`

### Scores

**GET `/api/competitions/:id/leaderboard`**
- Response: Array of leaderboard entries dengan scores

**PUT `/api/competitions/:competitionId/climbers/:climberId/boulders/:boulderNumber`** (Auth required)
- Body: `{ action: 'attempt' | 'zone' | 'top' | 'finalize' }`
- Response: Updated score object

**GET `/api/speed-competitions/:id/qualification`**
- Response: Array of qualification leaderboard

**PUT `/api/speed-competitions/:id/qualification/:climberId`** (Auth required)
- Body: `{ lane_a_time, lane_b_time, lane_a_status, lane_b_status }`
- Response: Updated qualification score

### Finals (Speed)

**GET `/api/speed-competitions/:id/finals`**
- Response: Array of finals matches dengan ranking info

**POST `/api/speed-competitions/:id/generate-bracket`** (Auth required)
- Body: `{ topCount: 8 }` (optional, default: 8)
- Response: `{ success, message, matches }`

**POST `/api/speed-competitions/:id/generate-next-round`** (Auth required)
- Response: `{ success, message, matches }`

**PUT `/api/speed-competitions/:id/finals/:matchId`** (Auth required)
- Body: `{ time_a, time_b, status_a, status_b }`
- Response: Updated match object

### Schedules

**GET `/api/schedules`**
- Response: Array of schedules

**POST `/api/schedules`** (Auth required)
- Body: `{ date, title, location, time, status, category, description }`
- Response: Created schedule object

### Users

**GET `/api/users`** (Auth required)
- Response: Array of users (tanpa password)

**POST `/api/users`** (Auth required)
- Body: `{ username, password, role }`
- Response: Created user object

---

## 🔧 Troubleshooting

### Masalah Umum

**1. Database Connection Error**
```
Error: ER_ACCESS_DENIED_ERROR
```
**Solusi:**
- Cek credentials di `.env`
- Pastikan MySQL service running
- Cek user MySQL memiliki akses ke database

**2. Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solusi:**
- Kill process yang menggunakan port 3000
- Atau ubah port di `server.js`

**3. Module Not Found**
```
Error: Cannot find module 'xxx'
```
**Solusi:**
- Run `npm install` di root dan `client/` directory
- Pastikan semua dependencies ter-install

**4. Upload File Error**
```
Error: File size too large
```
**Solusi:**
- Maksimal file size: 10MB untuk CSV/Excel
- Pastikan file format benar (CSV, XLS, XLSX)

**5. Bracket Already Exists**
```
Error: Bracket already exists
```
**Solusi:**
- Hapus semua matches yang sudah ada terlebih dahulu
- Atau gunakan fitur delete match di dashboard

### Debug Mode

**Enable verbose logging:**
```javascript
// Di server.js, tambahkan:
console.log('[DEBUG]', data);
```

**Check WebSocket connection:**
- Buka browser console
- Cek apakah ada error Socket.io
- Pastikan server running di port yang benar

---

## 📝 Format File Upload

### Format CSV untuk Upload Peserta

```csv
name,bib_number,team
John Doe,1,Tim A
Jane Smith,2,Tim B
Ahmad Rizki,3,Tim C
```

**Kolom Wajib:**
- `name` (atau `nama`): Nama peserta
- `bib_number` (atau `bib`, `nomor`): Nomor bib

**Kolom Opsional:**
- `team` (atau `tim`): Nama tim

### Format Excel untuk Upload Peserta

**Sheet 1:**
| name | bib_number | team |
|------|------------|------|
| John Doe | 1 | Tim A |
| Jane Smith | 2 | Tim B |

**Catatan:**
- Header case-insensitive
- Bisa menggunakan spasi atau underscore
- Nama kolom bisa dalam bahasa Indonesia atau Inggris

---

## 🎯 Best Practices

### Untuk Admin

1. **Backup Database Regular**
   - Export database sebelum event besar
   - Simpan backup di lokasi aman

2. **Test Generate Bracket**
   - Test dengan data dummy sebelum event
   - Pastikan seeding benar

3. **Monitor User Access**
   - Hapus user yang tidak aktif
   - Ganti password secara berkala

### Untuk Judge

1. **Double Check Score**
   - Pastikan score benar sebelum finalize
   - Cek ranking setelah input score

2. **Handle Edge Cases**
   - Jika ada FS, pastikan lawan tetap dapat score
   - Jika ada BYE, pastikan winner sudah ter-set

### Untuk Developer

1. **Environment Variables**
   - Jangan commit `.env` file
   - Gunakan different secrets untuk production

2. **Database Migrations**
   - Selalu backup sebelum migration
   - Test migration di staging first

3. **Error Handling**
   - Log semua errors dengan detail
   - Return meaningful error messages

---

## 📞 Support & Contact

Untuk pertanyaan atau issue:
- Check dokumentasi ini terlebih dahulu
- Review error logs di console/server
- Contact system administrator

---

## 📄 License

Sistem ini dikembangkan untuk FPTI Karanganyar.

**Version:** 1.0.0  
**Last Updated:** 2024

---

## 🎓 Quick Reference

### Keyboard Shortcuts (Timer System)

**Speed Climbing:**
- `A` - Toggle Lane A Bottom Sensor
- `Q` - Hit Lane A Top Sensor
- `L` - Toggle Lane B Bottom Sensor
- `P` - Hit Lane B Top Sensor

### URL Routes

**Public:**
- `/` - Landing Page
- `/live-score-selector` - Pilih kompetisi
- `/live-score?competition=X&round=qualification` - Live Score Boulder
- `/speed-score?competition=X&round=qualification` - Live Score Speed

**Admin:**
- `/login` - Login page
- `/dashboard` - Dashboard overview
- `/dashboard/competitions` - Manage competitions
- `/dashboard/athletes` - Manage athletes
- `/dashboard/schedules` - Manage schedules
- `/dashboard/users` - User management
- `/dashboard/judge-interface` - Judge interface

**Timer System:**
- `/timersistem` - Timer system index
- `/timersistem/admin.html` - Speed timer admin
- `/timersistem/display.html` - Speed timer display
- `/timersistem/boulder-admin.html` - Boulder timer admin
- `/timersistem/boulder-display.html` - Boulder timer display

---

**Dokumentasi ini akan terus di-update sesuai perkembangan sistem.**

---

## 📚 Dokumen Tambahan

Untuk persiapan Game Day dan operasional, tersedia dokumen tambahan:

### 1. QA Stress Test Script
**File:** [`QA_STRESS_TEST_SCRIPT.md`](./QA_STRESS_TEST_SCRIPT.md)

Dokumen ini berisi skenario uji coba lengkap untuk memastikan sistem siap digunakan pada hari kompetisi. Termasuk:
- Scenario A: Standard Flow (8 participants, predictable wins)
- Scenario B: Upset Flow (Rank 8 beats Rank 1)
- Scenario C: Disaster Flow (Both climbers FALL)
- Scenario D: BYE Handling (Odd number of participants)
- Scenario E: Double Click Attack (Spam protection)

**Gunakan dokumen ini untuk:**
- Pre-production testing
- Regression testing setelah update
- Training QA team
- Validasi sebelum Game Day

### 2. Judge/Operator Cheat Sheet
**File:** [`JUDGE_OPERATOR_CHEATSHEET.md`](./JUDGE_OPERATOR_CHEATSHEET.md)

Panduan singkat satu halaman untuk juri dan operator dashboard. Berisi:
- Persiapan sebelum kompetisi
- Input score kualifikasi
- Generate bracket
- Input score final
- Troubleshooting darurat

**Gunakan dokumen ini untuk:**
- Training juri dan operator
- Referensi cepat saat kompetisi
- Onboarding staff baru

**Format:** Dapat dicetak dan dibawa saat kompetisi untuk referensi cepat.

