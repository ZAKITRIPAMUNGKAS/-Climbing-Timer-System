# Panduan Deployment

## Persiapan Deployment

### 1. Build React App
Sebelum deploy, pastikan React app sudah di-build:

```bash
# Install semua dependencies
npm run install:all

# Build React app
npm run build
```

Ini akan membuat folder `public/react-build/` yang berisi file-file static React.

### 2. Struktur File Setelah Build (Lokal)

```
timer-panjat/
├── server.js              # Backend server
├── package.json
├── public/
│   ├── react-build/      # React build output (dibuat setelah npm run build)
│   │   ├── index.html
│   │   ├── assets/
│   │   └── ...
│   ├── index.html         # Timer system index
│   ├── admin.html
│   ├── display.html
│   ├── boulder-admin.html
│   ├── boulder-display.html
│   ├── sounds/
│   └── logo.jpeg
└── client/                # Source code React (tidak perlu di-upload)
```

> **Setelah upload ke server**, struktur akan menjadi:
> ```
> public_html/nodeapp/  (isi dari folder timer-panjat/)
> ```

## Deployment ke cPanel/Shared Hosting

> **Catatan Penting:** 
> - **cPanel dengan Node.js App**: Node.js app harus di folder `public_html/nodeapp/` (tidak bisa langsung di `public_html/`)
> - Route web server (Apache/Nginx) tidak bisa handle Node.js, jadi perlu folder terpisah
> - cPanel akan setup reverse proxy dari domain ke Node.js app di `nodeapp/`

### Opsi 1: Upload Manual (Recommended)

1. **Build React app di local:**
   ```bash
   npm run build
   ```

2. **Upload ke server:**
   - Upload semua file kecuali:
     - `node_modules/`
     - `client/` (folder source code, tidak perlu)
     - `.git/`
     - File-file development lainnya
   - **Upload ke folder:** `public_html/nodeapp/`

3. **Struktur di server:**
   ```
   public_html/
   └── nodeapp/              # ✅ Node.js app di sini
       ├── server.js         # Entry point
       ├── package.json
       ├── package-lock.json
       ├── public/
       │   ├── react-build/    # ✅ Harus ada! (React build output)
       │   ├── index.html      # Timer system index
       │   ├── admin.html
       │   ├── display.html
       │   ├── boulder-admin.html
       │   ├── boulder-display.html
       │   ├── sounds/
       │   └── logo.jpeg
       └── node_modules/       # ✅ Install di server
   ```

4. **Setup Node.js App di cPanel:**
   - Login ke cPanel
   - Buka **"Node.js App"** atau **"Setup Node.js App"**
   - Klik **"Create Application"**
   - **Application Root:** `public_html/nodeapp`
   - **Application URL:** Pilih domain/subdomain (misal: `fptikaranganyar.my.id`)
   - **Application Startup File:** `server.js`
   - **Application Mode:** Production
   - Klik **"Create"**

5. **Install dependencies di server:**
   - Setelah Node.js App dibuat, cPanel akan otomatis install dependencies
   - Atau bisa manual via SSH/Terminal:
     ```bash
     cd ~/public_html/nodeapp
     npm install --production
     ```

6. **Start/Restart server:**
   - Di cPanel Node.js App, klik **"Restart"** atau **"Reload"**
   - Aplikasi akan otomatis start
   - Check log jika ada error

### Opsi 2: Build di Server (jika Node.js tersedia)

1. **Upload semua file termasuk folder `client/` ke server:**
   - Upload ke folder: `public_html/nodeapp/`

2. **SSH ke server atau gunakan Terminal di cPanel**

3. **Navigate ke folder aplikasi:**
   ```bash
   cd ~/public_html/nodeapp
   ```

4. **Jalankan build:**
   ```bash
   npm run install:all
   npm run build
   ```
   Ini akan:
   - Install dependencies root dan client
   - Build React app ke `public/react-build/`

5. **Setup Node.js App di cPanel** (jika belum):
   - Ikuti langkah 4-6 di Opsi 1

6. **Restart Node.js App** di cPanel

## Routing

Setelah deployment dengan struktur `public_html/nodeapp/`, routing akan bekerja sebagai berikut:

### Bagaimana Routing Bekerja:

1. **User mengakses domain** (misal: `https://fptikaranganyar.my.id`)
2. **cPanel/Passenger** akan proxy request ke Node.js app di `nodeapp/`
3. **Express server** (`server.js`) akan handle routing:
   - **`/`** → Landing page (React) dari `public/react-build/index.html`
   - **`/timersistem`** → Timer system index (`public/index.html`)
   - **`/timersistem/admin.html`** → Admin control
   - **`/timersistem/display.html`** → Display view
   - **`/timersistem/boulder-admin.html`** → Boulder admin
   - **`/timersistem/boulder-display.html`** → Boulder display
   - **`/socket.io/*`** → Socket.io connection (real-time)
   - **`/sounds/*`** → Audio files untuk timer

### Catatan Penting:

- ✅ **Semua routing di-handle oleh Express** di `server.js`
- ✅ **React Router** handle client-side routing untuk landing page
- ✅ **Static files** (React build, sounds, logo) di-serve dari `public/`
- ✅ **Socket.io** untuk real-time communication antara admin dan display

## Environment Variables

Jika perlu, buat file `.env` di root:

```env
PORT=3000
NODE_ENV=production
```

## Troubleshooting

### React build tidak muncul?
- Pastikan sudah menjalankan `npm run build` di folder `client/`
- Check apakah folder `public/react-build/` ada dan berisi file di `public_html/nodeapp/public/react-build/`
- Pastikan struktur folder di server: `public_html/nodeapp/`

### Timer system tidak bisa diakses?
- Pastikan route `/timersistem` sudah benar
- Check console browser untuk error
- Pastikan file HTML timer ada di folder `public/`
- Jika menggunakan cPanel Node.js App, pastikan aplikasi sudah di-start

### Socket.io tidak connect?
- Pastikan server.js berjalan dengan benar
- Check firewall/port settings
- Pastikan Socket.io client library ter-load
- Untuk cPanel Node.js App, pastikan port sesuai dengan yang dikonfigurasi

### Aplikasi tidak start di cPanel?
- Pastikan `server.js` adalah entry point yang benar di cPanel Node.js App settings
- Pastikan folder aplikasi: `public_html/nodeapp/`
- Check log di cPanel Node.js App untuk error
- Pastikan semua dependencies sudah ter-install (`node_modules/` ada)
- Verify Application Root di cPanel mengarah ke `public_html/nodeapp`
- Pastikan `public/react-build/` sudah ada (sudah di-build)

### Route tidak bekerja?
- Pastikan Node.js App sudah running di cPanel
- Check apakah domain sudah di-setup di Node.js App settings
- Pastikan tidak ada konflik dengan `.htaccess` di `public_html/`
- Verify Express routes di `server.js` sudah benar
- Check browser console untuk error 404 atau routing issues

## Tips Deployment

1. **Gunakan PM2 untuk production:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name timer-panjat
   pm2 save
   pm2 startup
   ```

2. **Setup reverse proxy (jika perlu):**
   - Nginx/Apache bisa di-setup sebagai reverse proxy
   - Point ke port yang digunakan Node.js

3. **SSL/HTTPS:**
   - Pastikan domain menggunakan HTTPS
   - Socket.io akan bekerja lebih baik dengan HTTPS

4. **Performance:**
   - React build sudah di-optimize oleh Vite
   - Static assets di-cache untuk performa lebih baik

