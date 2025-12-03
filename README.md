# Climbing Timer System

Sistem timer real-time untuk lomba panjat tebing dengan 2 mode:
1. **Speed Climbing** - Dual lane dengan sensor detection
2. **Boulder** - Countdown timer dengan auto-restart cycle

## 🚀 Fitur Utama

### Speed Climbing (Dual Lane):
- **Dual Lane System**: Timer untuk 2 jalur simultan (Lane A & Lane B)
- **Simulation Mode**: Testing tanpa hardware Arduino (via keyboard/tombol)
- **False Start Detection**: Deteksi false start otomatis
- **Real-time Display**: Split screen untuk proyektor dengan visual feedback
- **Admin Control Panel**: Kontrol lengkap dari HP/laptop

### Boulder Timer:
- **Countdown Timer**: Timer countdown dengan fase CLIMBING dan REST
- **Auto-restart**: Otomatis restart setelah fase REST
- **Audio Feedback**: Warning, countdown, finish, start sounds
- **Visual Feedback**: Background berubah warna sesuai fase

## 📋 Tech Stack

- **Backend**: Node.js, Express, Socket.io
- **Hardware Interface**: SerialPort (untuk Arduino - opsional)
- **Frontend**: HTML5, CSS3, Vue.js (CDN)

## 🛠️ Instalasi

```bash
# Install dependencies
npm install

# Start server
npm start
```

Server akan berjalan di `http://localhost:3000`

## 📱 Halaman

### Speed Climbing:
- **Display (Proyektor)**: `http://localhost:3000/display.html`
- **Admin Control**: `http://localhost:3000/admin.html`

### Boulder Timer:
- **Display (Proyektor)**: `http://localhost:3000/boulder-display.html`
- **Admin Control**: `http://localhost:3000/boulder-admin.html`

## 🎮 Mode Simulation (Testing)

Sistem default menggunakan **Simulation Mode** untuk testing tanpa hardware.

### Keyboard Shortcuts (di Admin Panel):
- **A** - Toggle Lane A Bottom Sensor (Injak/Lepas)
- **Q** - Hit Lane A Top Sensor (Finish)
- **L** - Toggle Lane B Bottom Sensor (Injak/Lepas)
- **P** - Hit Lane B Top Sensor (Finish)

### Tombol Simulasi:
Admin panel memiliki tombol untuk simulasi sensor jika tidak menggunakan keyboard.

## 🔧 Setup Hardware (Ketika Arduino Ready)

1. Ubah `IS_SIMULATION = false` di `server.js` (line 16)
2. Uncomment kode SerialPort (line 54-121)
3. Sesuaikan port Arduino:
   - Windows: `'COM3'` (ganti dengan port Arduino Anda)
   - Linux/Mac: `'/dev/ttyUSB0'` atau `/dev/ttyACM0`
4. Sesuaikan baudRate jika perlu (default: 9600)

### Format Data Arduino:

Arduino harus mengirim string dengan format:
```
A_BOT_ON     // Lane A bottom sensor ON
A_BOT_OFF    // Lane A bottom sensor OFF
A_TOP_HIT    // Lane A top sensor hit (finish)
B_BOT_ON     // Lane B bottom sensor ON
B_BOT_OFF    // Lane B bottom sensor OFF
B_TOP_HIT    // Lane B top sensor hit (finish)
```

## 📖 Cara Menggunakan

### 1. Persiapan
- Buka **Display.html** di proyektor/tab terpisah
- Buka **Admin.html** di HP/laptop untuk kontrol

### 2. Jalankan Lomba

1. **ARM MATCH**: Aktifkan sistem, siap menerima sensor
2. **Injak Sensor**: Atlet menginjak bottom sensor (atau tekan tombol simulasi)
   - Status akan berubah ke **READY** setelah 2 detik
3. **START MATCH**: Mulai countdown (3 beep)
4. **GO**: Setelah beep ke-3, timer mulai otomatis saat atlet melepas kaki
5. **FINISH**: Atlet tekan top sensor (tombol finish) untuk stop timer
6. **RESET**: Reset semua untuk lomba berikutnya

### 3. False Start Detection

Sistem otomatis mendeteksi false start jika:
- Atlet melepas kaki (bottom sensor OFF) **sebelum** beep ke-3 selesai
- Status lane akan berubah ke **FALSE_START** (background merah)

## 🎨 Visual Feedback

### Display (Proyektor):
- **Lane A**: Background Merah (Kiri)
- **Lane B**: Background Biru (Kanan)
- **Status Indicator**:
  - ⚪ Abu-abu: IDLE
  - 🟢 Hijau (berkedip): READY
  - 🟡 Kuning: RUNNING
  - 🔵 Biru: FINISHED
  - 🔴 Merah (shake): FALSE_START
- **Winner**: Timer berkedip untuk pemenang

## ⚙️ Konfigurasi

Di `server.js`, Anda bisa mengubah:

```javascript
config: {
    readyDuration: 2000,    // Waktu injak sensor untuk READY (ms)
    countdownTime: 3000,    // Durasi countdown beep (ms)
}
```

## 📝 Log & Debugging

Semua event dicatat di console server:
- `[SENSOR]` - Sensor state changes
- `[READY]` - Lane ready status
- `[FALSE START]` - False start detection
- `[VALID START]` - Valid start
- `[FINISH]` - Finish dengan waktu
- `[BEEP]` - Countdown beep

## 🔍 Troubleshooting

**Audio tidak bunyi?**
- Pastikan file `/public/sounds/countdown.mp3` ada
- Check browser console untuk error

**Sensor tidak responsive?**
- Di simulation mode, pastikan fokus di halaman admin
- Check console browser untuk error socket.io

**Timer tidak update?**
- Check koneksi socket.io (indikator di halaman)
- Refresh halaman display

## 📄 License

ISC

