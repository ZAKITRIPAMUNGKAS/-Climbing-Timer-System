# Quick Start Guide

## Setup Awal

1. **Install Dependencies:**
   ```bash
   npm run install:all
   ```

2. **Build React App:**
   ```bash
   npm run build
   ```

3. **Start Server:**
   ```bash
   npm start
   ```

4. **Akses Website:**
   - Landing Page: http://localhost:3000
   - Timer System: http://localhost:3000/timersistem

## Struktur Routing

```
/                          → Landing Page (React)
/timersistem               → Timer System Index
/timersistem/admin.html    → Admin Control
/timersistem/display.html  → Display View
```

## Development

Untuk development dengan hot-reload:

**Terminal 1 (Backend):**
```bash
npm start
```

**Terminal 2 (React Frontend):**
```bash
npm run dev:client
```

React dev server akan berjalan di http://localhost:5173 (default Vite port)

## Deployment

Lihat file `DEPLOYMENT.md` untuk panduan lengkap deployment.

**Quick Deploy:**
1. Build React: `npm run build`
2. Upload semua file kecuali `node_modules/` dan `client/`
3. Di server: `npm install --production`
4. Start server

## Troubleshooting

**React build tidak muncul?**
- Pastikan sudah run `npm run build`
- Check folder `public/react-build/` ada

**Timer system tidak bisa diakses?**
- Pastikan route `/timersistem` benar
- Check file HTML ada di `public/`

