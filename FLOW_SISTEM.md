# Flow Sistem Live Score Boulder

## Overview
Sistem Live Score Boulder untuk kompetisi panjat tebing dengan fitur real-time updates menggunakan WebSocket.

## Flow Lengkap Sistem

### 1. **Admin Dashboard** (`/admin-dashboard`)
   - **Login**: Admin login dengan username/password
   - **Tab Kompetisi**: 
     - ✅ Create: Tambah kompetisi baru (nama, total boulder, status)
     - ✅ Read: Lihat daftar semua kompetisi
     - ✅ Update: Edit kompetisi (ubah nama, total boulder, status)
     - ✅ Delete: Hapus kompetisi
   - **Manage Climbers**: 
     - Klik tombol "Atlet" pada kompetisi
     - Tambah/Edit/Hapus climbers (nama, bib number, team)
   - **Tab Lainnya**: Atlet, Jadwal, Berita (CRUD)

### 2. **Judge Interface** (`/judge-interface`)
   - **Login**: Judge login dengan username/password yang sama dengan admin
   - **Pilih Boulder**: Pilih boulder (1, 2, 3, 4, dst)
   - **Input Score**: 
     - +Attempt: Tambah jumlah attempt
     - Zone: Tandai climber mencapai zone (auto-set attempt saat ini)
     - Top: Tandai climber mencapai top (auto-set zone + finalize)
     - Finalize: Finalisasi score (tidak bisa diubah lagi)
   - **Real-time Update**: Menggunakan WebSocket untuk update langsung ke Live Score

### 3. **Live Score Page** (`/live-score`)
   - **Public Access**: Tidak perlu login
   - **Leaderboard**: 
     - Menampilkan ranking berdasarkan IFSC rules:
       1. Total Tops DESC
       2. Total Zones DESC
       3. Sum of Top Attempts ASC
       4. Sum of Zone Attempts ASC
   - **Real-time Update**: Auto-refresh saat ada update dari judge
   - **Info Box**: Penjelasan sistem ranking IFSC

## Database Schema

### Tables:
1. **competitions**: id, name, total_boulders, status, created_at, updated_at
2. **climbers**: id, competition_id, name, bib_number, team, created_at, updated_at
3. **scores**: id, competition_id, climber_id, boulder_number, attempts, reached_zone, reached_top, zone_attempt, top_attempt, is_finalized, created_at, updated_at

## API Endpoints

### Competitions:
- `GET /api/competitions` - Get all competitions
- `GET /api/competitions/active` - Get active competition
- `GET /api/competitions/:id` - Get competition by ID
- `POST /api/competitions` - Create competition (Auth required)
- `PUT /api/competitions/:id` - Update competition (Auth required)
- `DELETE /api/competitions/:id` - Delete competition (Auth required)

### Climbers:
- `GET /api/competitions/:id/climbers` - Get climbers for competition
- `POST /api/competitions/:id/climbers` - Add climber (Auth required)
- `PUT /api/climbers/:id` - Update climber (Auth required)
- `DELETE /api/climbers/:id` - Delete climber (Auth required)

### Scores:
- `GET /api/competitions/:id/leaderboard` - Get leaderboard with IFSC ranking
- `GET /api/competitions/:competitionId/climbers/:climberId/boulders/:boulderNumber` - Get score
- `PUT /api/competitions/:competitionId/climbers/:climberId/boulders/:boulderNumber` - Update score (Auth required)

## WebSocket Events

- **score-updated**: Emitted saat score di-update oleh judge
  - Data: `{ competition_id, climber_id, boulder_number, score }`

## Cara Menggunakan

### Setup Awal:
1. Login ke `/admin-dashboard`
2. Buat kompetisi baru di tab "Kompetisi"
3. Set status ke "Aktif"
4. Klik tombol "Atlet" pada kompetisi
5. Tambah climbers (atlet) yang akan berkompetisi

### Saat Kompetisi:
1. Judge login ke `/judge-interface`
2. Pilih boulder yang akan di-judge
3. Input score untuk setiap climber:
   - Klik +Attempt setiap kali climber mencoba
   - Klik Zone saat climber mencapai zone
   - Klik Top saat climber mencapai top (otomatis finalize)
   - Atau klik Finalize untuk mengakhiri attempt

### Monitoring:
1. Public bisa melihat live score di `/live-score`
2. Leaderboard update real-time saat judge input score
3. Ranking otomatis berdasarkan IFSC rules

## Fitur Tambahan

- ✅ Button "Judge Interface" di admin dashboard
- ✅ Button "Live Score" di navbar semua halaman
- ✅ Real-time updates via WebSocket
- ✅ IFSC ranking system
- ✅ Auto-finalize saat top dicapai
- ✅ Auto-set zone saat top dicapai
- ✅ Protected routes (require authentication)

## Catatan Penting

1. **Hanya 1 kompetisi aktif**: Sistem mengambil kompetisi dengan status 'active' terbaru
2. **Bib number harus unique**: Tidak boleh ada 2 climber dengan bib number sama dalam 1 kompetisi
3. **Score finalize**: Setelah finalize, score tidak bisa diubah
4. **Top auto-finalize**: Saat top dicapai, score otomatis di-finalize
5. **Top auto-set zone**: Saat top dicapai, zone otomatis di-set jika belum ada

