require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

const app = express();

// Keamanan dan Optimasi Production
app.use(helmet({
  contentSecurityPolicy: false // Nonaktifkan CSP supaya gambar eksternal (steam/itunes/igrs) tetap muncul
}));
app.use(cors());
app.use(compression()); // Compress responses

// Koneksi MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI belum disetting di .env!');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Terhubung ke MongoDB Atlas'))
  .catch(err => console.error('❌ Gagal konek MongoDB:', err));

// Schema dan Model
const GameSchema = new mongoose.Schema({ id: { type: Number, unique: true } }, { strict: false, collection: 'games' });
const Game = mongoose.model('Game', GameSchema);

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API untuk search games
app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.json([]);
    }

      // Pencarian strict HANYA pada judul (name / title)
      const results = await Game.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { title: { $regex: query, $options: 'i' } }
        ]
      })
      .limit(20)
      .lean();

      res.json(results);
    } catch (error) {
      console.error('Error in search:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });
      
  // API untuk get semua games dengan pagination
  app.get('/api/games', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const skip = (page - 1) * limit;
      
      let query = {};
      if (req.query.rating) {
        // Karena rating berbentuk array of objects, kita cek 'ratings.name'
        query['ratings.name'] = req.query.rating;
      }
      
      const games = await Game.find(query).skip(skip).limit(limit).lean();
      const total = await Game.countDocuments(query);
      res.json({
        games,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      });
    } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

// API untuk get single game by ID
app.get('/api/game/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { id: parseInt(id) }] };
    } else {
      query = { id: parseInt(id) };
    }
    
    const game = await Game.findOne(query).lean();

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

// DEBUG: API untuk melihat struktur data game
app.get('/api/debug/first-game', async (req, res) => {
  try {
    const game = await Game.findOne({}).lean();
    if (!game) {
      return res.json({ message: 'No games found' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API untuk mencari asset gambar (Cover & Screenshot) dari iTunes & Steam
app.get('/api/game-assets', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.json({ success: false });

    const axios = require('axios');
    
    // Fungsi sanitasi huruf murni tanpa spasi atau tanda baca untuk perbandingan ekstrem
    const stripStr = (str) => String(str).toLowerCase().replace(/[^\w]/gi, '');
    const isMatch = (str1, str2) => {
      const s1 = stripStr(str1);
      const s2 = stripStr(str2);
      return s1.includes(s2) || s2.includes(s1);
    };

    // Bersihkan nama dari spasi berlebih
    let q = name.replace(/\s+/g, ' ').trim();

    // 1. Coba di iTunes Store (Dominan Game Mobile)
    try {
      const itunesRes = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=software&limit=3`, {timeout: 4000});
      if (itunesRes.data && itunesRes.data.results) {
        // Cari yang game & cocok (siapatau urutan ke 2/3)
        const result = itunesRes.data.results.find(r => r.primaryGenreName === 'Games' && isMatch(r.trackName, name));
        if (result) {
          console.log(`[Assets] Found '${name}' at iTunes`);
          return res.json({
            success: true,
            source: 'itunes',
            cover: result.artworkUrl512 || result.artworkUrl100,
            screenshots: result.screenshotUrls || []
          });
        }
      }
    } catch(e) { }

    // 2. Coba di Steam Store (Dominan Game PC)
    try {
      const steamRes = await axios.get(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=US`, {timeout: 4000});
      if (steamRes.data && steamRes.data.items) {
         const item = steamRes.data.items.find(i => isMatch(i.name, name));
         if (item) {
             console.log(`[Assets] Found '${name}' at Steam (${item.id})`);
             // Tarik API detail spesifik game steamnya untuk dapat cover dan screenshots
             const detailsRes = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${item.id}`, {timeout: 4000});
             if (detailsRes.data[item.id] && detailsRes.data[item.id].success) {
                 const data = detailsRes.data[item.id].data;
                 return res.json({
                    success: true,
                    source: 'steam',
                    cover: data.header_image,
                    screenshots: (data.screenshots || []).map(s => s.path_full).slice(0, 5)
                 });
             } else {
                 return res.json({
                    success: true,
                    source: 'steam',
                    cover: item.tiny_image, 
                    screenshots: []
                 });
             }
         }
      }
    } catch(e) { }

    return res.json({ success: false });
  } catch (error) {
    res.json({ success: false });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di mode production: http://localhost:${PORT}`);
});

