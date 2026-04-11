# 🎮 Game Search Frontend - Database IGRS

Frontend sederhana untuk mencari game dari database MongoDB yang sudah dibuat dengan scraper.

## 📋 Fitur

- **Mode Search 🔍**: Cari games berdasarkan nama, deskripsi, atau field lainnya
- **Mode Browse 📚**: Lihat semua games dengan pagination
- **Responsive Design**: Berfungsi baik di desktop dan mobile
- **Real-time Results**: Hasil pencarian ditampilkan dengan cepat

## 🚀 Cara Menggunakan

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Pastikan MongoDB Berjalan
```bash
# MongoDB harus berjalan di localhost:27017 dengan database: uji_usia
```

### 3. Jalankan Server
```bash
node server.js
```

Output yang diharapkan:
```
✅ Terhubung ke MongoDB Lokal (Database: uji_usia)
🚀 Server berjalan di http://localhost:3000
```

### 4. Buka Browser
```
http://localhost:3000
```

## 📁 Struktur File

```
nganu igrs/
├── server.js           # Backend Node.js + Express
├── scrap_igrs.js       # Scraper (sudah ada)
├── package.json        # Dependencies
└── public/
    └── index.html      # Frontend
```

## 🔍 API Endpoints

### Search Games
```
GET /api/search?query=nama_game
```
Contoh:
```
http://localhost:3000/api/search?query=minecraft
```

### Get All Games (dengan pagination)
```
GET /api/games?page=1
```
Response:
```json
{
  "games": [...],
  "total": 150,
  "pages": 8,
  "currentPage": 1
}
```

## 💡 Tips

- **Auto-search saat ketik**: Uncomment line di `handleSearch()` pada `index.html` untuk enable
- **Custom styling**: Edit bagian `<style>` pada `index.html`
- **Tambah field**: Modifikasi query di `server.js` pada bagian `$or:` untuk search fields lain

## 🔧 Troubleshooting

### Error: "Gagal konek ke MongoDB"
- Pastikan MongoDB service berjalan
- Cek koneksi string di `server.js` dan `scrap_igrs.js`

### Port 3000 sudah terpakai
- Ubah `PORT` di `server.js`:
```javascript
const PORT = 3001; // atau port lain
```

### Search tidak mengembalikan hasil
- Pastikan ada data di database (jalankan `scrap_igrs.js` dahulu)
- Cek field names di MongoDB (gunakan MongoDB Compass)

## 📝 Catatan

- Server otomatis serve file `index.html` saat akses `/`
- Search case-insensitive dan menggunakan regex for flexibility
- Limit hasil search ke 20 items per default
