# 📋 Panduan Singkat Juri - Speed Climbing System

**Versi:** 1.0.0  
**Untuk:** Juri & Operator Dashboard  
**Bahasa:** Indonesia

---

## 🚀 Persiapan (Sebelum Kompetisi)

### 1. Login ke Dashboard
- Buka browser (Chrome/Firefox recommended)
- Masuk ke: `http://localhost:3000/login` (atau URL server)
- **Username:** `admin` (atau username yang diberikan)
- **Password:** `admin123` (atau password yang diberikan)
- Klik **"Login"**

### 2. Akses Judge Interface
- Setelah login, klik menu **"Judge Interface"** di sidebar
- Atau langsung ke: `/dashboard/judge-interface`

### 3. Pilih Kompetisi
- Di dropdown **"Select Competition"**, pilih kompetisi Speed yang akan di-judge
- Pastikan status kompetisi sudah **"Qualification"** atau **"Finals"**

---

## 🏃 Saat Kualifikasi (Qualification Round)

### Input Score Kualifikasi

1. **Cari Peserta**
   - Gunakan **Search Bar** untuk mencari nama atlet atau nomor bib
   - Atau scroll untuk melihat semua peserta

2. **Klik "Input Score"** pada peserta yang akan di-input

3. **Isi Data Score:**
   - **Lane A Time:** Waktu lane A (dalam detik, contoh: `6.50`)
   - **Lane A Status:** Pilih status:
     - ✅ **VALID** - Waktu valid (normal)
     - ⚠️ **FALL** - Atlet jatuh
     - ❌ **FALSE_START** - False start
     - 🚫 **DNS** - Did Not Start
   
   - **Lane B Time:** Waktu lane B (dalam detik, contoh: `6.60`)
   - **Lane B Status:** Pilih status (sama seperti Lane A)

4. **Klik "Save Score"**
   - Sistem otomatis menghitung **Total Time** (Lane A + Lane B)
   - Sistem otomatis menghitung **Ranking**
   - Score langsung muncul di **Live Score** (public)

### Tips Kualifikasi:
- ✅ Input score **setelah** atlet selesai memanjat di kedua lane
- ✅ Pastikan waktu sudah benar sebelum klik "Save"
- ✅ Jika ada kesalahan, bisa klik "Input Score" lagi untuk edit

---

## 🔄 Transisi Babak (Generate Bracket)

**⚠️ PENTING: Hanya Admin yang bisa generate bracket!**

### Setelah Kualifikasi Selesai:

1. **Pastikan Semua Peserta Sudah Ada Score**
   - Cek di Live Score → Tab "Qualification"
   - Pastikan semua peserta yang lolos sudah memiliki score

2. **Generate Bracket (Top 8)**
   - Buka halaman **"Manage Competitions"**
   - Cari kompetisi Speed yang akan di-generate
   - Klik tombol **"Generate Bracket"** (hanya muncul jika status = "Qualification")
   - **Tunggu** sampai muncul notifikasi "Bracket generated successfully"
   - Status kompetisi otomatis berubah menjadi **"Finals"**

3. **Generate Next Round (Setelah Quarter Final)**
   - Setelah semua Quarter Final matches selesai
   - Klik tombol **"Generate Next Round"**
   - Sistem akan membuat **Semi Final** matches

4. **Generate Next Round (Setelah Semi Final)**
   - Setelah semua Semi Final matches selesai
   - Klik tombol **"Generate Next Round"** lagi
   - Sistem akan membuat **Small Final** (juara 3) dan **Big Final** (juara 1 & 2)

### ⚠️ Catatan Penting:
- **JANGAN** klik tombol "Generate" berkali-kali! Sistem sudah ada proteksi, tapi tetap tunggu sampai selesai
- Pastikan **semua matches di round sebelumnya sudah selesai** sebelum generate round berikutnya
- Jika ada error, hubungi Admin

---

## 🏆 Saat Final (Finals Round)

### Input Score Final (Head-to-Head)

1. **Akses Final Matches**
   - Buka **Live Score** → Pilih kompetisi → Tab **"Final"**
   - Atau via **Judge Interface** (jika ada akses)

2. **Pilih Match yang Akan Di-Input**
   - Lihat bracket: Quarter Final → Semi Final → Small Final / Big Final
   - Klik pada match card yang akan di-input score

3. **Isi Data Score:**
   - **Time A:** Waktu climber di Lane A (dalam detik, contoh: `5.80`)
   - **Status A:** Pilih status (VALID/FALL/FALSE_START/DNS)
   - **Time B:** Waktu climber di Lane B (dalam detik, contoh: `6.20`)
   - **Status B:** Pilih status (VALID/FALL/FALSE_START/DNS)

4. **Klik "Save Score"**
   - Sistem otomatis menentukan **Winner** (waktu lebih cepat = menang)
   - Jika kedua climber FALL/FALSE_START, sistem menggunakan ranking kualifikasi sebagai tie-breaker
   - Winner otomatis advance ke round berikutnya

### Tips Final:
- ✅ **Lane A** = Atlet dengan ranking kualifikasi lebih tinggi (otomatis)
- ✅ **Lane B** = Atlet dengan ranking kualifikasi lebih rendah (otomatis)
- ✅ Jika ada **BYE** (tidak ada lawan), atlet otomatis menang tanpa perlu input
- ✅ Pastikan waktu sudah benar sebelum save (tidak bisa edit setelah final selesai)

---

## 🆘 Darurat (Troubleshooting)

### Masalah 1: Score Tidak Tersimpan
**Solusi:**
- Cek koneksi internet
- Refresh halaman (F5)
- Coba input lagi
- Jika masih error, hubungi Admin

### Masalah 2: False Start Terdeteksi
**Solusi:**
- Input status: **FALSE_START** untuk atlet yang false start
- Input status: **VALID** untuk atlet yang tidak false start
- Sistem otomatis menentukan winner

### Masalah 3: Kedua Atlet FALL
**Solusi:**
- Input status: **FALL** untuk kedua atlet
- Sistem otomatis menggunakan ranking kualifikasi sebagai tie-breaker
- Atlet dengan ranking lebih tinggi (nomor lebih kecil) otomatis menang

### Masalah 4: Data Salah (Perlu Edit)
**Solusi:**
- Klik **"Input Score"** lagi pada peserta yang salah
- Edit waktu/status
- Klik **"Save Score"** lagi
- Data akan ter-update

### Masalah 5: Bracket Tidak Muncul
**Solusi:**
- Pastikan Admin sudah klik **"Generate Bracket"**
- Pastikan status kompetisi = **"Finals"**
- Refresh halaman Live Score
- Jika masih tidak muncul, hubungi Admin

### Masalah 6: Tombol "Generate" Tidak Bisa Diklik
**Solusi:**
- Pastikan semua matches di round sebelumnya sudah selesai
- Pastikan sudah login sebagai **Admin** (bukan Judge)
- Refresh halaman
- Jika masih tidak bisa, hubungi Developer

---

## 📱 Quick Reference

### Status Score:
- ✅ **VALID** = Waktu valid, atlet selesai dengan baik
- ⚠️ **FALL** = Atlet jatuh sebelum finish
- ❌ **FALSE_START** = Atlet start sebelum signal
- 🚫 **DNS** = Atlet tidak start

### Urutan Bracket:
1. **Qualification** → Semua peserta
2. **Quarter Final** → Top 8 (4 matches)
3. **Semi Final** → Top 4 (2 matches)
4. **Small Final** → Juara 3 (1 match)
5. **Big Final** → Juara 1 & 2 (1 match)

### Lane Assignment:
- **Lane A** = Atlet dengan ranking kualifikasi lebih tinggi (nomor lebih kecil)
- **Lane B** = Atlet dengan ranking kualifikasi lebih rendah (nomor lebih besar)
- **Contoh:** Rank 1 vs Rank 8 → Rank 1 di Lane A, Rank 8 di Lane B

### Winner Determination:
1. **Waktu lebih cepat** = Menang (jika kedua VALID)
2. **VALID** > **FALL** > **FALSE_START** > **DNS** (jika status berbeda)
3. **Ranking kualifikasi** (jika kedua FALL/FALSE_START/DNS)

---

## 📞 Kontak Darurat

**Admin:** _______________  
**Developer:** _______________  
**Phone:** _______________

**Email:** _______________

---

## ✅ Checklist Sebelum Mulai

- [ ] Sudah login sebagai Admin/Judge
- [ ] Kompetisi sudah dipilih
- [ ] Semua peserta sudah ter-upload
- [ ] Browser console tidak ada error (F12)
- [ ] Koneksi internet stabil
- [ ] Backup data sudah dibuat (oleh Admin)

---

## 📝 Catatan Tambahan

**Space untuk catatan selama kompetisi:**

- _______________
- _______________
- _______________
- _______________

---

**Dokumen ini dapat dicetak dan dibawa saat kompetisi untuk referensi cepat.**

**Versi:** 1.0.0  
**Terakhir Diperbarui:** 2024

