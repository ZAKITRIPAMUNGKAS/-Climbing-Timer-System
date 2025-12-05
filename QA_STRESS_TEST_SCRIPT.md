# 🧪 QA Stress Test Script - Speed Climbing System

**Version:** 1.0.0  
**Date:** 2024  
**Purpose:** Comprehensive testing checklist untuk memastikan sistem Speed Climbing siap untuk Game Day

---

## 📋 Pre-Test Checklist

Sebelum memulai testing, pastikan:

- [ ] Database sudah di-reset atau menggunakan database test terpisah
- [ ] Server backend running (`npm start`)
- [ ] Frontend running (`cd client && npm run dev`)
- [ ] Login sebagai Admin (username: `admin`, password: `admin123`)
- [ ] Browser console terbuka untuk monitoring errors
- [ ] Network tab terbuka untuk monitoring API calls

---

## 🎯 Scenario A: Standard Flow (8 Participants, Predictable Wins)

**Objective:** Test alur normal dengan 8 peserta dan hasil yang predictable (higher seed selalu menang).

### Setup
1. [ ] Buat Speed Competition baru dengan nama: `"Test A - Standard Flow"`
2. [ ] Upload 8 peserta dengan format CSV:
   ```csv
   name,bib_number,team
   Atlet 1,1,Tim A
   Atlet 2,2,Tim B
   Atlet 3,3,Tim C
   Atlet 4,4,Tim D
   Atlet 5,5,Tim E
   Atlet 6,6,Tim F
   Atlet 7,7,Tim G
   Atlet 8,8,Tim H
   ```

### Qualification Phase
3. [ ] Input score qualifikasi untuk semua 8 peserta:
   - Atlet 1: Lane A = 5.50s, Lane B = 5.60s (Total: 11.10s)
   - Atlet 2: Lane A = 5.80s, Lane B = 5.90s (Total: 11.70s)
   - Atlet 3: Lane A = 6.00s, Lane B = 6.10s (Total: 12.10s)
   - Atlet 4: Lane A = 6.20s, Lane B = 6.30s (Total: 12.50s)
   - Atlet 5: Lane A = 6.40s, Lane B = 6.50s (Total: 12.90s)
   - Atlet 6: Lane A = 6.60s, Lane B = 6.70s (Total: 13.30s)
   - Atlet 7: Lane A = 6.80s, Lane B = 6.90s (Total: 13.70s)
   - Atlet 8: Lane A = 7.00s, Lane B = 7.10s (Total: 14.10s)

4. [ ] **VERIFY:** Ranking qualifikasi harus:
   - Rank 1: Atlet 1 (11.10s)
   - Rank 2: Atlet 2 (11.70s)
   - Rank 3: Atlet 3 (12.10s)
   - Rank 4: Atlet 4 (12.50s)
   - Rank 5: Atlet 5 (12.90s)
   - Rank 6: Atlet 6 (13.30s)
   - Rank 7: Atlet 7 (13.70s)
   - Rank 8: Atlet 8 (14.10s)

### Generate Bracket (Quarter Final)
5. [ ] Klik tombol **"Generate Bracket"** di halaman Manage Competitions
6. [ ] **VERIFY:** Sistem membuat 4 Quarter Final matches dengan seeding:
   - **QF1:** Atlet 1 (Rank 1) vs Atlet 8 (Rank 8) → Atlet 1 di Lane A
   - **QF2:** Atlet 4 (Rank 4) vs Atlet 5 (Rank 5) → Atlet 4 di Lane A
   - **QF3:** Atlet 3 (Rank 3) vs Atlet 6 (Rank 6) → Atlet 3 di Lane A
   - **QF4:** Atlet 2 (Rank 2) vs Atlet 7 (Rank 7) → Atlet 2 di Lane A

7. [ ] **VERIFY:** Status competition berubah menjadi `"finals"`

### Quarter Final Matches
8. [ ] Input score untuk QF1: Atlet 1 menang (5.50s) vs Atlet 8 (7.00s)
9. [ ] Input score untuk QF2: Atlet 4 menang (6.20s) vs Atlet 5 (6.40s)
10. [ ] Input score untuk QF3: Atlet 3 menang (6.00s) vs Atlet 6 (6.60s)
11. [ ] Input score untuk QF4: Atlet 2 menang (5.80s) vs Atlet 7 (6.80s)

12. [ ] **VERIFY:** Semua matches memiliki winner yang benar

### Generate Semi Final
13. [ ] Klik tombol **"Generate Next Round"**
14. [ ] **VERIFY:** Sistem membuat 2 Semi Final matches:
   - **SF1:** Winner QF1 (Atlet 1) vs Winner QF2 (Atlet 4) → Atlet 1 di Lane A (higher seed)
   - **SF2:** Winner QF3 (Atlet 3) vs Winner QF4 (Atlet 2) → Atlet 2 di Lane A (higher seed)

15. [ ] **VERIFY:** Lane assignment benar (higher seed di Lane A)

### Semi Final Matches
16. [ ] Input score untuk SF1: Atlet 1 menang (5.50s) vs Atlet 4 (6.20s)
17. [ ] Input score untuk SF2: Atlet 2 menang (5.80s) vs Atlet 3 (6.00s)

18. [ ] **VERIFY:** Winners: Atlet 1 (SF1), Atlet 2 (SF2)

### Generate Finals
19. [ ] Klik tombol **"Generate Next Round"** lagi
20. [ ] **VERIFY:** Sistem membuat 2 Final matches:
   - **Small Final:** Loser SF1 (Atlet 4) vs Loser SF2 (Atlet 3) → Atlet 3 di Lane A (higher seed)
   - **Big Final:** Winner SF1 (Atlet 1) vs Winner SF2 (Atlet 2) → Atlet 1 di Lane A (higher seed)

21. [ ] **VERIFY:** Small Final muncul **SEBELUM** Big Final di UI

### Final Matches
22. [ ] Input score untuk Small Final: Atlet 3 menang (6.00s) vs Atlet 4 (6.20s)
23. [ ] Input score untuk Big Final: Atlet 1 menang (5.50s) vs Atlet 2 (5.80s)

24. [ ] **VERIFY:** Final Results:
   - Juara 1: Atlet 1
   - Juara 2: Atlet 2
   - Juara 3: Atlet 3
   - Juara 4: Atlet 4

### ✅ Expected Result
- Semua matches ter-generate dengan seeding yang benar
- Lane assignment selalu higher seed di Lane A
- Small Final ditampilkan sebelum Big Final
- Final ranking sesuai dengan hasil matches

---

## 🎯 Scenario B: The "Upset" Flow (Rank 8 Beats Rank 1)

**Objective:** Test dynamic lane assignment saat terjadi upset (lower seed menang).

### Setup
1. [ ] Buat Speed Competition baru: `"Test B - Upset Flow"`
2. [ ] Upload 8 peserta (sama seperti Scenario A)

### Qualification Phase
3. [ ] Input score qualifikasi (sama seperti Scenario A)
4. [ ] **VERIFY:** Ranking sama seperti Scenario A

### Generate Bracket & Quarter Final
5. [ ] Generate bracket (sama seperti Scenario A)
6. [ ] Input score untuk QF1: **Atlet 8 (Rank 8) MENANG** (6.50s) vs Atlet 1 (7.00s) ← **UPSET!**
7. [ ] Input score untuk QF2: Atlet 4 menang (6.20s) vs Atlet 5 (6.40s)
8. [ ] Input score untuk QF3: Atlet 3 menang (6.00s) vs Atlet 6 (6.60s)
9. [ ] Input score untuk QF4: Atlet 2 menang (5.80s) vs Atlet 7 (6.80s)

### Generate Semi Final
10. [ ] Generate Next Round
11. [ ] **VERIFY:** SF1 pairing:
   - Winner QF1: **Atlet 8** (Rank 8, tapi menang QF1)
   - Winner QF2: Atlet 4 (Rank 4)
   - **CRITICAL:** Atlet 4 harus di **Lane A** (karena Rank 4 > Rank 8)
   - Atlet 8 harus di **Lane B** (lower seed)

12. [ ] **VERIFY:** Sistem menggunakan **qualification rank** untuk lane assignment, bukan bracket position

### Semi Final Matches
13. [ ] Input score untuk SF1: Atlet 4 menang (6.20s) vs Atlet 8 (6.50s)
14. [ ] Input score untuk SF2: Atlet 2 menang (5.80s) vs Atlet 3 (6.00s)

### Generate Finals
15. [ ] Generate Next Round
16. [ ] **VERIFY:** Small Final:
   - Loser SF1: Atlet 8 (Rank 8)
   - Loser SF2: Atlet 3 (Rank 3)
   - **CRITICAL:** Atlet 3 harus di **Lane A** (Rank 3 > Rank 8)

17. [ ] **VERIFY:** Big Final:
   - Winner SF1: Atlet 4 (Rank 4)
   - Winner SF2: Atlet 2 (Rank 2)
   - **CRITICAL:** Atlet 2 harus di **Lane A** (Rank 2 > Rank 4)

### ✅ Expected Result
- Lane assignment selalu menggunakan qualification rank, bukan bracket position
- Higher seed (lower rank number) selalu di Lane A, bahkan setelah upset

---

## 🎯 Scenario C: The "Disaster" Flow (Both Climbers FALL in Finals)

**Objective:** Test tie-breaker logic saat kedua climber FALL atau FALSE_START.

### Setup
1. [ ] Buat Speed Competition baru: `"Test C - Disaster Flow"`
2. [ ] Upload 8 peserta
3. [ ] Input qualifikasi (sama seperti Scenario A)
4. [ ] Generate bracket

### Quarter Final - Normal
5. [ ] Input score QF1: Atlet 1 menang (5.50s) vs Atlet 8 (7.00s)
6. [ ] Input score QF2: Atlet 4 menang (6.20s) vs Atlet 5 (6.40s)
7. [ ] Input score QF3: Atlet 3 menang (6.00s) vs Atlet 6 (6.60s)
8. [ ] Input score QF4: Atlet 2 menang (5.80s) vs Atlet 7 (6.80s)

### Semi Final - Disaster Case
9. [ ] Generate Next Round
10. [ ] Input score untuk SF1 dengan **DISASTER SCENARIO:**
    - Atlet 1: Status = **FALL**, Time = 0
    - Atlet 4: Status = **FALL**, Time = 0
    - **CRITICAL:** Sistem harus menentukan winner berdasarkan qualification rank
    - **Expected Winner:** Atlet 1 (Rank 1 > Rank 4)

11. [ ] **VERIFY:** Sistem menampilkan Atlet 1 sebagai winner
12. [ ] Input score untuk SF2: Atlet 2 menang (5.80s) vs Atlet 3 (6.00s)

### Final - Both FALSE_START
13. [ ] Generate Next Round
14. [ ] Input score untuk Big Final dengan **DISASTER SCENARIO:**
    - Atlet 1: Status = **FALSE_START**, Time = 0
    - Atlet 2: Status = **FALSE_START**, Time = 0
    - **CRITICAL:** Sistem harus menggunakan qualification rank sebagai tie-breaker
    - **Expected Winner:** Atlet 1 (Rank 1 > Rank 2)

15. [ ] **VERIFY:** Sistem menampilkan Atlet 1 sebagai winner

### Additional Edge Cases
16. [ ] Test kombinasi FALL vs FALSE_START:
    - Atlet A: FALL
    - Atlet B: FALSE_START
    - **VERIFY:** Atlet B menang (FALSE_START lebih buruk dari FALL)

17. [ ] Test kombinasi DNS vs FALL:
    - Atlet A: DNS
    - Atlet B: FALL
    - **VERIFY:** Atlet B menang (DNS lebih buruk dari FALL)

### ✅ Expected Result
- Sistem selalu menentukan winner, bahkan jika kedua climber FALL/FALSE_START
- Tie-breaker menggunakan qualification rank (lower rank number = higher seed = winner)
- Status hierarchy: VALID > FALL > FALSE_START > DNS

---

## 🎯 Scenario D: Odd Number (7 Participants) - BYE Handling

**Objective:** Test sistem BYE saat jumlah peserta ganjil.

### Setup
1. [ ] Buat Speed Competition baru: `"Test D - BYE Handling"`
2. [ ] Upload **7 peserta** saja (bukan 8):
   ```csv
   name,bib_number,team
   Atlet 1,1,Tim A
   Atlet 2,2,Tim B
   Atlet 3,3,Tim C
   Atlet 4,4,Tim D
   Atlet 5,5,Tim E
   Atlet 6,6,Tim F
   Atlet 7,7,Tim G
   ```

### Qualification Phase
3. [ ] Input qualifikasi untuk 7 peserta (Rank 1-7)
4. [ ] **VERIFY:** Ranking: Rank 1 (tercepat) sampai Rank 7 (terlambat)

### Generate Bracket
5. [ ] Klik **"Generate Bracket"**
6. [ ] **VERIFY:** Sistem membuat 4 Quarter Final matches:
   - **QF1:** Atlet 1 (Rank 1) vs **BYE** (opponent = NULL)
   - **QF2:** Atlet 4 (Rank 4) vs Atlet 5 (Rank 5)
   - **QF3:** Atlet 3 (Rank 3) vs Atlet 6 (Rank 6)
   - **QF4:** Atlet 2 (Rank 2) vs Atlet 7 (Rank 7)

7. [ ] **VERIFY:** QF1 menampilkan "BYE" untuk opponent
8. [ ] **VERIFY:** Atlet 1 otomatis menjadi winner QF1 (tanpa perlu input score)

### Quarter Final Matches
9. [ ] **VERIFY:** QF1 sudah otomatis selesai (Atlet 1 winner)
10. [ ] Input score untuk QF2: Atlet 4 menang
11. [ ] Input score untuk QF3: Atlet 3 menang
12. [ ] Input score untuk QF4: Atlet 2 menang

### Generate Semi Final
13. [ ] Generate Next Round
14. [ ] **VERIFY:** SF1 pairing:
   - Winner QF1: Atlet 1 (Rank 1, dari BYE)
   - Winner QF2: Atlet 4 (Rank 4)
   - Atlet 1 di Lane A (higher seed)

### ✅ Expected Result
- Sistem menangani BYE dengan benar
- Rank 1 otomatis advance ke Semi Final tanpa match
- UI menampilkan "BYE" dengan jelas
- Bracket tetap valid meskipun ada BYE

---

## 🎯 Scenario E: Double Click Attack (Spam Protection)

**Objective:** Test proteksi terhadap double-click atau spam pada tombol Generate.

### Setup
1. [ ] Buat Speed Competition baru: `"Test E - Double Click"`
2. [ ] Upload 8 peserta
3. [ ] Input qualifikasi
4. [ ] Buka browser console untuk monitoring

### Test Generate Bracket
5. [ ] Klik tombol **"Generate Bracket"** dengan cepat **2-3 kali berturut-turut**
6. [ ] **VERIFY:** Sistem hanya membuat bracket **sekali**
7. [ ] **VERIFY:** Tidak ada duplicate matches di database
8. [ ] **VERIFY:** UI menampilkan error message atau disable button setelah klik pertama
9. [ ] **VERIFY:** Console tidak menampilkan error duplicate

### Test Generate Next Round (Quarter Final → Semi Final)
10. [ ] Input score untuk semua QF matches
11. [ ] Klik **"Generate Next Round"** dengan cepat **2-3 kali berturut-turut**
12. [ ] **VERIFY:** Sistem hanya membuat Semi Final **sekali**
13. [ ] **VERIFY:** Tidak ada duplicate SF matches

### Test Generate Next Round (Semi Final → Final)
14. [ ] Input score untuk semua SF matches
15. [ ] Klik **"Generate Next Round"** dengan cepat **2-3 kali berturut-turut**
16. [ ] **VERIFY:** Sistem hanya membuat Final matches **sekali**
17. [ ] **VERIFY:** Tidak ada duplicate Final matches

### Test dengan Network Delay Simulation
18. [ ] Buka browser DevTools → Network tab
19. [ ] Set throttling ke "Slow 3G"
20. [ ] Klik **"Generate Bracket"** 2 kali dengan cepat
21. [ ] **VERIFY:** Sistem tetap hanya membuat bracket sekali, meskipun ada network delay

### ✅ Expected Result
- Sistem memiliki proteksi double-click (frontend + backend)
- Button disabled setelah klik pertama
- Backend menolak duplicate requests
- Tidak ada race condition

---

## 🔍 Additional Edge Cases

### Edge Case 1: Single Participant
- [ ] Test dengan hanya 1 peserta
- [ ] **VERIFY:** Sistem menangani dengan benar (BYE, auto-winner)

### Edge Case 2: All Participants FALL in Qualification
- [ ] Input semua peserta dengan status FALL
- [ ] **VERIFY:** Ranking tetap terhitung berdasarkan time atau rank default

### Edge Case 3: Invalid Time Input
- [ ] Input time negatif atau sangat besar (999.99s)
- [ ] **VERIFY:** Sistem validasi dan reject invalid input

### Edge Case 4: Missing Qualification Score
- [ ] Coba generate bracket tanpa semua peserta memiliki score
- [ ] **VERIFY:** Sistem menampilkan error atau hanya include peserta dengan score

### Edge Case 5: Edit Score After Finalize
- [ ] Input score untuk match
- [ ] Coba edit score yang sudah di-submit
- [ ] **VERIFY:** Sistem allow edit atau prevent edit sesuai requirement

---

## 📊 Test Results Summary

**Date:** _______________  
**Tester:** _______________  
**Environment:** Development / Staging / Production

### Scenario Results

| Scenario | Status | Notes |
|----------|--------|-------|
| A: Standard Flow | ⬜ Pass / ⬜ Fail | |
| B: Upset Flow | ⬜ Pass / ⬜ Fail | |
| C: Disaster Flow | ⬜ Pass / ⬜ Fail | |
| D: BYE Handling | ⬜ Pass / ⬜ Fail | |
| E: Double Click | ⬜ Pass / ⬜ Fail | |

### Issues Found

1. **Issue:** _______________  
   **Severity:** Critical / High / Medium / Low  
   **Steps to Reproduce:** _______________  
   **Expected:** _______________  
   **Actual:** _______________

2. **Issue:** _______________  
   **Severity:** Critical / High / Medium / Low  
   **Steps to Reproduce:** _______________  
   **Expected:** _______________  
   **Actual:** _______________

### Recommendations

- _______________
- _______________
- _______________

---

## ✅ Sign-Off

**QA Lead:** _______________ **Date:** _______________  
**Developer:** _______________ **Date:** _______________  
**Product Owner:** _______________ **Date:** _______________

---

**Document Version:** 1.0.0  
**Last Updated:** 2024

