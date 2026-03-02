const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ========== ROUTE UNTUK ADMINER (TAMBAHKAN INI) ==========
app.get("/adminer.php", (req, res) => {
  res.sendFile(path.join(__dirname, "adminer.php"));
});

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "fadil#009",
  database: "aneka_mobil",
});

db.connect((err) => {
  if (err) {
    console.log("Database error:", err);
  } else {
    console.log("MySQL Connected");
  }
});

/* ================== MULTER CONFIG ================== */
// Konfigurasi untuk upload file (digunakan untuk cars dan articles)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Buat nama file unik dengan timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Untuk artikel, beri prefix 'article-'
    if (req.path.includes('/articles')) {
      cb(null, 'article-' + uniqueSuffix + path.extname(file.originalname));
    } else if (req.path.includes('/banners')) {
      cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
    } else {
      cb(null, Date.now() + "-" + file.originalname);
    }
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Maks 10MB
  fileFilter: (req, file, cb) => {
    // Untuk artikel dan banner, hanya izinkan gambar
    if (req.path.includes('/articles') || req.path.includes('/banners')) {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('File harus berupa gambar!'));
      }
    } else {
      // Untuk cars, izinkan semua file (gambar)
      cb(null, true);
    }
  }
});

/* ================== GET ALL CARS ================== */

app.get("/cars", (req, res) => {
  db.query("SELECT * FROM cars ORDER BY id DESC", (err, cars) => {
    if (err) {
      console.log("ERROR GET CARS:", err);
      return res.status(500).json({ error: err.message });
    }

    if (!cars || cars.length === 0) {
      return res.json([]);
    }

    db.query("SELECT * FROM car_images", (err2, images) => {
      if (err2) {
        console.log("ERROR GET IMAGES:", err2);
        return res.status(500).json({ error: err2.message });
      }

      try {
        const result = cars.map((car) => ({
          ...car,
          images: images
            .filter((img) => img.car_id === car.id)
            .map((img) => `/uploads/${img.image_path}`),
        }));

        res.json(result);
      } catch (error) {
        console.log("ERROR PROCESSING DATA:", error);
        res.status(500).json({ error: error.message });
      }
    });
  });
});

/* ================== GET DETAIL ================== */

app.get("/cars/:id", (req, res) => {
  const carId = req.params.id;

  db.query("SELECT * FROM cars WHERE id = ?", [carId], (err, car) => {
    if (err) {
      console.log("ERROR GET CAR DETAIL:", err);
      return res.status(500).json({ error: err.message });
    }
    
    if (car.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    db.query(
      "SELECT * FROM car_images WHERE car_id = ?",
      [carId],
      (err2, images) => {
        if (err2) {
          console.log("ERROR GET CAR IMAGES:", err2);
          return res.status(500).json({ error: err2.message });
        }

        const result = {
          ...car[0],
          images: images.map((img) => `/uploads/${img.image_path}`),
        };

        res.json(result);
      }
    );
  });
});

/* ================== CREATE CAR ================== */

app.post("/cars", upload.array("images", 20), (req, res) => {
  const { name, brand, year, price, credit_price, km, fuel, transmission, description } = req.body;
  
  console.log("=== CREATE CAR ===");
  console.log("Data received:", { name, brand, year, price, credit_price, km, fuel, transmission });
  console.log("Files received:", req.files ? req.files.length : 0);

  // Validasi data wajib
  if (!name || !brand || !year || !price) {
    return res.status(400).json({ error: "Data wajib tidak lengkap" });
  }

  // Ambil gambar pertama sebagai thumbnail/image utama
  let thumbnail = null;
  if (req.files && req.files.length > 0) {
    thumbnail = req.files[0].filename;
  }

  const sql = `
    INSERT INTO cars 
    (name, brand, year, price, credit_price, km, fuel, transmission, image, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // Konversi credit_price ke number, jika kosong atau null set 0
  const finalCreditPrice = credit_price && credit_price !== "" ? Number(credit_price) : 0;
  
  // Konversi km ke number
  const finalKm = km && km !== "" ? Number(km) : 0;
  
  // Konversi price ke number
  const finalPrice = Number(price);

  db.query(
    sql,
    [name, brand, year, finalPrice, finalCreditPrice, finalKm, fuel, transmission, thumbnail, description || ""],
    (err, result) => {
      if (err) {
        console.log("CREATE ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      const carId = result.insertId;
      console.log("Car created with ID:", carId);

      // Simpan semua gambar ke car_images
      if (req.files && req.files.length > 0) {
        const values = req.files.map((file) => [
          carId,
          file.filename,
        ]);

        db.query(
          "INSERT INTO car_images (car_id, image_path) VALUES ?",
          [values],
          (err2) => {
            if (err2) {
              console.log("IMAGE INSERT ERROR:", err2);
              return res.status(500).json({ error: err2.message });
            }
            console.log("Images saved for car ID:", carId);
            res.json({ 
              message: "Mobil berhasil ditambahkan",
              carId: carId 
            });
          }
        );
      } else {
        res.json({ 
          message: "Mobil berhasil ditambahkan tanpa gambar",
          carId: carId 
        });
      }
    }
  );
});

/* ================== UPDATE CAR ================== */

app.put("/cars/:id", upload.array("images", 20), (req, res) => {
  const carId = req.params.id;
  const { name, brand, year, price, credit_price, km, fuel, transmission, description } = req.body;

  console.log("=== UPDATE CAR ===");
  console.log("Car ID:", carId);
  console.log("Data received:", { name, brand, year, price, credit_price, km, fuel, transmission });
  console.log("Files received:", req.files ? req.files.length : 0);

  // Validasi data wajib
  if (!name || !brand || !year || !price) {
    return res.status(400).json({ error: "Data wajib tidak lengkap" });
  }

  // Konversi credit_price ke number, jika kosong atau null set 0
  const finalCreditPrice = credit_price && credit_price !== "" ? Number(credit_price) : 0;
  
  // Konversi km ke number
  const finalKm = km && km !== "" ? Number(km) : 0;
  
  // Konversi price ke number
  const finalPrice = Number(price);

  // Update data mobil
  const sql = `
    UPDATE cars 
    SET name=?, brand=?, year=?, price=?, credit_price=?, km=?, fuel=?, transmission=?, description=?
    WHERE id=?
  `;

  db.query(
    sql,
    [name, brand, year, finalPrice, finalCreditPrice, finalKm, fuel, transmission, description || "", carId],
    (err, result) => {
      if (err) {
        console.log("UPDATE ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      console.log("Car updated successfully, ID:", carId);
      console.log("Credit price set to:", finalCreditPrice);

      // Jika ada gambar baru yang diupload
      if (req.files && req.files.length > 0) {
        const values = req.files.map((file) => [
          carId,
          file.filename,
        ]);

        db.query(
          "INSERT INTO car_images (car_id, image_path) VALUES ?",
          [values],
          (err2) => {
            if (err2) {
              console.log("IMAGE INSERT ERROR:", err2);
              return res.status(500).json({ error: err2.message });
            }
            console.log("New images saved for car ID:", carId);
            res.json({ 
              message: "Mobil berhasil diupdate dengan gambar baru",
              credit_price: finalCreditPrice 
            });
          }
        );
      } else {
        res.json({ 
          message: "Mobil berhasil diupdate tanpa gambar baru",
          credit_price: finalCreditPrice 
        });
      }
    }
  );
});

/* ================== DELETE CAR ================== */

app.delete("/cars/:id", (req, res) => {
  const carId = req.params.id;
  
  console.log("=== DELETE CAR ===");
  console.log("Car ID:", carId);

  db.query("DELETE FROM cars WHERE id = ?", [carId], (err, result) => {
    if (err) {
      console.log("DELETE ERROR:", err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log("Car deleted successfully, ID:", carId);
    res.json({ message: "Mobil berhasil dihapus" });
  });
});

/* ================== CREATE ARTICLE ================== */

app.post("/articles", upload.single("thumbnail"), (req, res) => {
  const { title, link, category } = req.body;
  const thumbnail = req.file ? req.file.filename : null;

  console.log("=== CREATE ARTICLE ===");
  console.log("Data received:", { title, link, category, thumbnail });

  if (!title) {
    return res.status(400).json({ error: "Judul artikel harus diisi" });
  }

  db.query(
    "INSERT INTO articles (title, file_path, thumbnail, category) VALUES (?, ?, ?, ?)",
    [title, link || "", thumbnail, category || "Tips"],
    (err, result) => {
      if (err) {
        console.log("Insert error:", err);
        return res.status(500).json({ error: err.message });
      }
      console.log("Article created with ID:", result.insertId);
      res.json({ 
        message: "Artikel berhasil ditambahkan",
        id: result.insertId,
        thumbnail: thumbnail
      });
    }
  );
});

/* ================== GET ALL ARTICLES ================== */

app.get("/articles", (req, res) => {
  db.query("SELECT * FROM articles ORDER BY id DESC", (err, result) => {
    if (err) {
      console.log("ERROR GET ARTICLES:", err);
      return res.status(500).json({ error: err.message });
    }

    const data = result.map((a) => ({
      ...a,
      file_url: `/uploads/${a.file_path}`,
      thumbnail_url: a.thumbnail ? `/uploads/${a.thumbnail}` : null,
    }));

    res.json(data);
  });
});

/* ================== UPDATE ARTICLE ================== */

app.put("/articles/:id", upload.single("thumbnail"), (req, res) => {
  const { id } = req.params;
  const { title, link, category } = req.body;
  const thumbnail = req.file ? req.file.filename : null;

  console.log("=== UPDATE ARTICLE ===");
  console.log("Article ID:", id);
  console.log("Data received:", { title, link, category, thumbnail });

  if (!title) {
    return res.status(400).json({ error: "Judul artikel harus diisi" });
  }

  // Jika upload thumbnail baru
  if (thumbnail) {
    const sql = "UPDATE articles SET title=?, file_path=?, thumbnail=?, category=? WHERE id=?";
    db.query(sql, [title, link || "", thumbnail, category || "Tips", id], (err, result) => {
      if (err) {
        console.log("UPDATE ERROR:", err);
        return res.status(500).json({ error: err.message });
      }
      console.log("Article updated with new thumbnail, ID:", id);
      res.json({ message: "Artikel berhasil diupdate" });
    });
  } else {
    // Update tanpa thumbnail
    const sql = "UPDATE articles SET title=?, file_path=?, category=? WHERE id=?";
    db.query(sql, [title, link || "", category || "Tips", id], (err, result) => {
      if (err) {
        console.log("UPDATE ERROR:", err);
        return res.status(500).json({ error: err.message });
      }
      console.log("Article updated without thumbnail, ID:", id);
      res.json({ message: "Artikel berhasil diupdate" });
    });
  }
});

/* ================== DELETE ARTICLE ================== */

app.delete("/articles/:id", (req, res) => {
  const articleId = req.params.id;
  
  console.log("=== DELETE ARTICLE ===");
  console.log("Article ID:", articleId);

  db.query("DELETE FROM articles WHERE id = ?", [articleId], (err) => {
    if (err) {
      console.log("DELETE ERROR:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Artikel dihapus" });
  });
});

/* ================== CREATE TIKTOK ================== */

app.post("/tiktok", async (req, res) => {
  const { title, url } = req.body;

  console.log("=== CREATE TIKTOK ===");
  console.log("Data received:", { title, url });

  if (!url) {
    return res.status(400).json({ error: "URL TikTok harus diisi" });
  }

  // Validasi URL TikTok
  if (!url.includes("tiktok.com")) {
    return res.status(400).json({ error: "URL harus dari TikTok" });
  }

  let thumbnailUrl = null;
  
  // Coba ambil thumbnail dari oEmbed TikTok
  try {
    console.log("Mencoba mengambil thumbnail dari TikTok API...");
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const oembedResponse = await fetch(oembedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (oembedResponse.ok) {
      const oembedData = await oembedResponse.json();
      thumbnailUrl = oembedData.thumbnail_url || null;
      console.log("Thumbnail berhasil diambil:", thumbnailUrl);
    } else {
      console.log("Gagal mengambil thumbnail, status:", oembedResponse.status);
    }
  } catch (oembedError) {
    console.log("TikTok oEmbed error:", oembedError.message);
  }

  // Simpan ke database
  const sql = "INSERT INTO tiktok_videos (title, url, thumbnail_url) VALUES (?, ?, ?)";
  
  db.query(sql, [title || "Video TikTok", url, thumbnailUrl], (err, result) => {
    if (err) {
      console.log("INSERT TIKTOK ERROR:", err);
      return res.status(500).json({ error: err.message });
    }

    console.log("TikTok saved with ID:", result.insertId);
    
    // Kembalikan data yang baru disimpan
    res.json({ 
      message: "Video berhasil ditambahkan",
      id: result.insertId,
      title: title || "Video TikTok",
      url: url,
      thumbnail_url: thumbnailUrl
    });
  });
});

/* ================== GET ALL TIKTOK ================== */

app.get("/tiktok", (req, res) => {
  console.log("=== GET ALL TIKTOK ===");
  
  db.query("SELECT * FROM tiktok_videos ORDER BY id DESC", async (err, result) => {
    if (err) {
      console.log("ERROR GET TIKTOK:", err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log(`Found ${result.length} TikTok videos`);
    
    // Proses setiap video
    const videos = await Promise.all(result.map(async (video) => {
      // Jika thumbnail belum ada, coba ambil
      if (!video.thumbnail_url) {
        try {
          const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(video.url)}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const oembedResponse = await fetch(oembedUrl, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          
          clearTimeout(timeoutId);
          
          if (oembedResponse.ok) {
            const oembedData = await oembedResponse.json();
            const thumbnailUrl = oembedData.thumbnail_url || null;
            
            if (thumbnailUrl) {
              // Update database
              db.query(
                "UPDATE tiktok_videos SET thumbnail_url = ? WHERE id = ?",
                [thumbnailUrl, video.id]
              );
              video.thumbnail_url = thumbnailUrl;
            }
          }
        } catch (error) {
          console.log(`Failed to fetch thumbnail for video ${video.id}:`, error.message);
        }
      }
      
      return {
        id: video.id.toString(),
        title: video.title || "",
        url: video.url || "",
        thumbnail_url: video.thumbnail_url || null,
        created_at: video.created_at
      };
    }));
    
    console.log("Sending videos with thumbnails");
    res.json(videos);
  });
});

/* ================== GET TIKTOK BY ID ================== */

app.get("/tiktok/:id", (req, res) => {
  const { id } = req.params;
  
  console.log("=== GET TIKTOK BY ID ===", id);
  
  db.query("SELECT * FROM tiktok_videos WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.log("ERROR GET TIKTOK BY ID:", err);
      return res.status(500).json({ error: err.message });
    }
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Video not found" });
    }
    
    const video = {
      id: result[0].id.toString(),
      title: result[0].title || "",
      url: result[0].url || "",
      thumbnail_url: result[0].thumbnail_url || null,
      created_at: result[0].created_at
    };
    
    res.json(video);
  });
});

/* ================== UPDATE TIKTOK ================== */

app.put("/tiktok/:id", async (req, res) => {
  const { id } = req.params;
  const { title, url } = req.body;

  console.log("=== UPDATE TIKTOK ===");
  console.log("TikTok ID:", id);
  console.log("Data received:", { title, url });

  if (!url) {
    return res.status(400).json({ error: "URL TikTok harus diisi" });
  }

  // Validasi URL TikTok
  if (!url.includes("tiktok.com")) {
    return res.status(400).json({ error: "URL harus dari TikTok" });
  }

  let thumbnailUrl = null;
  
  // Coba ambil thumbnail dari oEmbed TikTok
  try {
    console.log("Mencoba mengambil thumbnail dari TikTok API...");
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const oembedResponse = await fetch(oembedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (oembedResponse.ok) {
      const oembedData = await oembedResponse.json();
      thumbnailUrl = oembedData.thumbnail_url || null;
      console.log("Thumbnail berhasil diambil:", thumbnailUrl);
    } else {
      console.log("Gagal mengambil thumbnail, status:", oembedResponse.status);
    }
  } catch (oembedError) {
    console.log("TikTok oEmbed error:", oembedError.message);
    // Lanjutkan tanpa thumbnail
  }

  // Update ke database
  const sql = "UPDATE tiktok_videos SET title=?, url=?, thumbnail_url=? WHERE id=?";
  
  db.query(sql, [title || "Video TikTok", url, thumbnailUrl, id], (err, result) => {
    if (err) {
      console.log("UPDATE TIKTOK ERROR:", err);
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Video tidak ditemukan" });
    }

    console.log("TikTok updated successfully, ID:", id);
    res.json({ 
      message: "Video TikTok berhasil diupdate",
      thumbnail_url: thumbnailUrl 
    });
  });
});

/* ================== DELETE TIKTOK ================== */

app.delete("/tiktok/:id", (req, res) => {
  const tiktokId = req.params.id;
  
  console.log("=== DELETE TIKTOK ===");
  console.log("TikTok ID:", tiktokId);

  db.query("DELETE FROM tiktok_videos WHERE id = ?", [tiktokId], (err) => {
    if (err) {
      console.log("DELETE ERROR:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Video dihapus" });
  });
});

/* ================== PROMO BANNERS API ================== */

// GET all banners (untuk admin)
app.get("/api/admin/banners", (req, res) => {
  db.query("SELECT * FROM promo_banners ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// GET active banners (untuk frontend)
app.get("/api/banners", (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  db.query(
    "SELECT * FROM promo_banners WHERE is_active = true AND (start_date IS NULL OR start_date <= ?) AND (end_date IS NULL OR end_date >= ?) ORDER BY id DESC",
    [today, today],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    }
  );
});

// POST create banner
app.post("/api/admin/banners", upload.single("image"), (req, res) => {
  const { title, link_url, position, start_date, end_date } = req.body;
  const image_path = req.file ? req.file.filename : null;

  if (!image_path) {
    return res.status(400).json({ error: "Gambar banner wajib diisi" });
  }

  const sql = `INSERT INTO promo_banners 
    (title, image_path, link_url, position, start_date, end_date, is_active) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.query(
    sql,
    [title || "", image_path, link_url || null, position || "home", start_date || null, end_date || null, true],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Banner berhasil ditambahkan", id: result.insertId });
    }
  );
});

// PUT update banner
app.put("/api/admin/banners/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { title, link_url, position, start_date, end_date, is_active } = req.body;
  const image_path = req.file ? req.file.filename : null;

  let sql, params;
  
  if (image_path) {
    sql = `UPDATE promo_banners SET title=?, image_path=?, link_url=?, position=?, start_date=?, end_date=?, is_active=? WHERE id=?`;
    params = [title || "", image_path, link_url || null, position || "home", start_date || null, end_date || null, is_active === 'true' ? 1 : 0, id];
  } else {
    sql = `UPDATE promo_banners SET title=?, link_url=?, position=?, start_date=?, end_date=?, is_active=? WHERE id=?`;
    params = [title || "", link_url || null, position || "home", start_date || null, end_date || null, is_active === 'true' ? 1 : 0, id];
  }

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Banner berhasil diupdate" });
  });
});

// DELETE banner
app.delete("/api/admin/banners/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM promo_banners WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Banner berhasil dihapus" });
  });
});

// Track click (opsional, kalau banner ada link)
app.post("/api/banners/:id/click", (req, res) => {
  const { id } = req.params;
  db.query("UPDATE promo_banners SET clicks = clicks + 1 WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

/* ================== START SERVER ================== */

app.listen(5000, () => {
  console.log("Server running on port 5000");
  console.log("=================================");
  console.log("API endpoints ready:");
  console.log("  CARS:");
  console.log("    GET  /cars");
  console.log("    GET  /cars/:id");
  console.log("    POST /cars (upload images)");
  console.log("    PUT  /cars/:id (upload images)");
  console.log("    DELETE /cars/:id");
  console.log("  ARTICLES:");
  console.log("    GET  /articles");
  console.log("    POST /articles (upload thumbnail)");
  console.log("    PUT  /articles/:id (upload thumbnail)");
  console.log("    DELETE /articles/:id");
  console.log("  TIKTOK:");
  console.log("    GET  /tiktok");
  console.log("    GET  /tiktok/:id");
  console.log("    POST /tiktok");
  console.log("    PUT  /tiktok/:id");
  console.log("    DELETE /tiktok/:id");
  console.log("  BANNERS:");
  console.log("    GET  /api/banners");
  console.log("    GET  /api/admin/banners");
  console.log("    POST /api/admin/banners (upload image)");
  console.log("    PUT  /api/admin/banners/:id (upload image)");
  console.log("    DELETE /api/admin/banners/:id");
  console.log("  ADMINER:");
  console.log("    GET  /adminer.php");
  console.log("=================================");
});