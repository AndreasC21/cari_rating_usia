# Rating Badge Images

Folder ini berisi gambar-gambar untuk rating badge IGRS.

## File yang Ada

- `3plus.svg` - Rating badge untuk 3+
- `7plus.svg` - Rating badge untuk 7+
- `13plus.svg` - Rating badge untuk 13+
- `15plus.svg` - Rating badge untuk 15+
- `18plus.svg` - Rating badge untuk 18+

## Cara Mengganti Gambar

1. Simpan gambar rating Anda dengan nama sesuai di atas
2. Ganti ekstensi file jika perlu:
   - Jika menggunakan PNG: `3plus.png`, `7plus.png`, dll
   - Jika menggunakan JPG: `3plus.jpg`, `7plus.jpg`, dll

3. **Update file `detail.html`** di folder `public`

Cari bagian ini:
```javascript
const ratingImages = {
    '3+': '/images/ratings/3plus.svg',
    '7+': '/images/ratings/7plus.svg',
    '13+': '/images/ratings/13plus.svg',
    '15+': '/images/ratings/15plus.svg',
    '18+': '/images/ratings/18plus.svg'
};
```

Ganti `.svg` dengan ekstensi file Anda:
```javascript
const ratingImages = {
    '3+': '/images/ratings/3plus.png',
    '7+': '/images/ratings/7plus.png',
    '13+': '/images/ratings/13plus.png',
    '15+': '/images/ratings/15plus.png',
    '18+': '/images/ratings/18plus.png'
};
```

## Ukuran Rekomendasi

- Width: 200-400px
- Format: PNG, JPG, atau SVG
- Pastikan gambar memiliki proporsi persegi (1:1 atau sesuai badge)
