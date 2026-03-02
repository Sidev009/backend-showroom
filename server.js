const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

// ===== KONFIGURASI CORS YANG DIPERBAIKI =====
const corsOptions = {
  origin: [
    'https://anekamobil.netlify.app', // Domain Netlify kamu
    'http://localhost:5173',                // Untuk development lokal (Vite)
    'http://localhost:8080',                 // Untuk development lokal (jika pakai port 8080)
    'http://localhost:3000'                  // Untuk development lokal (jika pakai port 3000)
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
// ============================================

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ========== ROUTE UNTUK TEST ==========
app.get("/", (req, res) => {
  res.json({ 
    message: "Backend Showroom API is running",
    status: "online",
    endpoints: {
      cars: "/cars",
      carsDetail: "/cars/:id",
      articles: "/articles",
      tiktok: "/tiktok",
      banners: "/api/banners"
    }
  });
});

// ========== ROUTE UNTUK ADMINER ==========
app.get("/adminer.php", (req, res) => {
  res.sendFile(path.join(__dirname, "adminer.php"));
});

// ========== KONEKSI DATABASE DENGAN ENV ==========
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "fadil#009",
  database: process.env.DB_NAME || "aneka_mobil",
  port: process.env.DB_PORT || 3306
});

db.connect((err) => {
  if (err) {
    console.log("Database error:", err);
  } else {
    console.log("MySQL Connected");
  }
});

/* ================== MULTER CONFIG ================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (req.path.includes('/articles') || req.path.includes('/banners')) {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('File harus berupa gambar!'));
      }
    } else {
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
  
  if (!name || !brand || !year || !price) {
    return res.status(400).json({ error: "Data wajib tidak lengkap" });
  }

  let thumbnail = null;
  if (req.files && req.files.length > 0) {
    thumbnail = req.files[0].filename;
  }

  const sql = `
    INSERT INTO cars 
    (name, brand, year, price, credit_price, km, fuel, transmission, image, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const finalCreditPrice = credit_price && credit_price !== "" ? Number(credit_price) : 0;
  const finalKm = km && km !== "" ? Number(km) : 0;
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
            res.json({ message: "Mobil berhasil ditambahkan", carId });
          }
        );
      } else {
        res.json({ message: "Mobil berhasil ditambahkan tanpa gambar", carId });
      }
    }
  );
});

/* ================== UPDATE CAR ================== */
app.put("/cars/:id", upload.array("images", 20), (req, res) => {
  const carId = req.params.id;
  const { name, brand, year, price, credit_price, km, fuel, transmission, description } = req.body;

  if (!name || !brand || !year || !price) {
    return res.status(400).json({ error: "Data wajib tidak lengkap" });
  }

  const finalCreditPrice = credit_price && credit_price !== "" ? Number(credit_price) : 0;
  const finalKm = km && km !== "" ? Number(km) : 0;
  const finalPrice = Number(price);

  const sql = `
    UPDATE cars 
    SET name=?, brand=?, year=?, price=?, credit_price=?, km=?, fuel=?, transmission=?, description=?
    WHERE id=?
  `;

  db.query(
    sql,
    [name, brand, year, finalPrice, finalCreditPrice, finalKm, fuel, transmission, description || "", carId],
    (err) => {
      if (err) {
        console.log("UPDATE ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

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
            res.json({ message: "Mobil berhasil diupdate dengan gambar baru" });
          }
        );
      } else {
        res.json({ message: "Mobil berhasil diupdate tanpa gambar baru" });
      }
    }
  );
});

/* ================== DELETE CAR ================== */
app.delete("/cars/:id", (req, res) => {
  const carId = req.params.id;
  db.query("DELETE FROM cars WHERE id = ?", [carId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Mobil berhasil dihapus" });
  });
});

/* ================== CREATE ARTICLE ================== */
app.post("/articles", upload.single("thumbnail"), (req, res) => {
  const { title, link, category } = req.body;
  const thumbnail = req.file ? req.file.filename : null;

  if (!title) return res.status(400).json({ error: "Judul artikel harus diisi" });

  db.query(
    "INSERT INTO articles (title, file_path, thumbnail, category) VALUES (?, ?, ?, ?)",
    [title, link || "", thumbnail, category || "Tips"],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Artikel berhasil ditambahkan", id: result.insertId });
    }
  );
});

/* ================== GET ALL ARTICLES ================== */
app.get("/articles", (req, res) => {
  db.query("SELECT * FROM articles ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

/* ================== UPDATE ARTICLE ================== */
app.put("/articles/:id", upload.single("thumbnail"), (req, res) => {
  const { id } = req.params;
  const { title, link, category } = req.body;
  const thumbnail = req.file ? req.file.filename : null;

  if (!title) return res.status(400).json({ error: "Judul artikel harus diisi" });

  if (thumbnail) {
    db.query(
      "UPDATE articles SET title=?, file_path=?, thumbnail=?, category=? WHERE id=?",
      [title, link || "", thumbnail, category || "Tips", id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Artikel berhasil diupdate" });
      }
    );
  } else {
    db.query(
      "UPDATE articles SET title=?, file_path=?, category=? WHERE id=?",
      [title, link || "", category || "Tips", id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Artikel berhasil diupdate" });
      }
    );
  }
});

/* ================== DELETE ARTICLE ================== */
app.delete("/articles/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM articles WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Artikel dihapus" });
  });
});

/* ================== CREATE TIKTOK ================== */
app.post("/tiktok", async (req, res) => {
  const { title, url } = req.body;

  if (!url || !url.includes("tiktok.com")) {
    return res.status(400).json({ error: "URL TikTok tidak valid" });
  }

  let thumbnailUrl = null;
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    const oembedResponse = await fetch(oembedUrl, { signal: controller.signal });
    if (oembedResponse.ok) {
      const oembedData = await oembedResponse.json();
      thumbnailUrl = oembedData.thumbnail_url;
    }
  } catch (error) {
    console.log("TikTok thumbnail error:", error.message);
  }

  db.query(
    "INSERT INTO tiktok_videos (title, url, thumbnail_url) VALUES (?, ?, ?)",
    [title || "Video TikTok", url, thumbnailUrl],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Video berhasil ditambahkan", id: result.insertId });
    }
  );
});

/* ================== GET ALL TIKTOK ================== */
app.get("/tiktok", (req, res) => {
  db.query("SELECT * FROM tiktok_videos ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

/* ================== GET TIKTOK BY ID ================== */
app.get("/tiktok/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM tiktok_videos WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result[0]);
  });
});

/* ================== UPDATE TIKTOK ================== */
app.put("/tiktok/:id", async (req, res) => {
  const { id } = req.params;
  const { title, url } = req.body;

  let thumbnailUrl = null;
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const oembedResponse = await fetch(oembedUrl);
    if (oembedResponse.ok) {
      const oembedData = await oembedResponse.json();
      thumbnailUrl = oembedData.thumbnail_url;
    }
  } catch (error) {
    console.log("TikTok thumbnail error:", error.message);
  }

  db.query(
    "UPDATE tiktok_videos SET title=?, url=?, thumbnail_url=? WHERE id=?",
    [title || "Video TikTok", url, thumbnailUrl, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Video berhasil diupdate" });
    }
  );
});

/* ================== DELETE TIKTOK ================== */
app.delete("/tiktok/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM tiktok_videos WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Video dihapus" });
  });
});

/* ================== PROMO BANNERS API ================== */
app.get("/api/admin/banners", (req, res) => {
  db.query("SELECT * FROM promo_banners ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

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

app.post("/api/admin/banners", upload.single("image"), (req, res) => {
  const { title, link_url, position, start_date, end_date } = req.body;
  const image_path = req.file ? req.file.filename : null;

  if (!image_path) {
    return res.status(400).json({ error: "Gambar banner wajib diisi" });
  }

  db.query(
    `INSERT INTO promo_banners (title, image_path, link_url, position, start_date, end_date, is_active) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title || "", image_path, link_url || null, position || "home", start_date || null, end_date || null, true],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Banner berhasil ditambahkan", id: result.insertId });
    }
  );
});

app.put("/api/admin/banners/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { title, link_url, position, start_date, end_date, is_active } = req.body;
  const image_path = req.file ? req.file.filename : null;

  if (image_path) {
    db.query(
      "UPDATE promo_banners SET title=?, image_path=?, link_url=?, position=?, start_date=?, end_date=?, is_active=? WHERE id=?",
      [title || "", image_path, link_url || null, position || "home", start_date || null, end_date || null, is_active === 'true' ? 1 : 0, id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Banner berhasil diupdate" });
      }
    );
  } else {
    db.query(
      "UPDATE promo_banners SET title=?, link_url=?, position=?, start_date=?, end_date=?, is_active=? WHERE id=?",
      [title || "", link_url || null, position || "home", start_date || null, end_date || null, is_active === 'true' ? 1 : 0, id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Banner berhasil diupdate" });
      }
    );
  }
});

app.delete("/api/admin/banners/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM promo_banners WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Banner berhasil dihapus" });
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log("=================================");
  console.log("API endpoints ready:");
  console.log("  GET  /");
  console.log("  GET  /cars");
  console.log("  GET  /cars/:id");
  console.log("  POST /cars");
  console.log("  PUT  /cars/:id");
  console.log("  DELETE /cars/:id");
  console.log("  GET  /articles");
  console.log("  POST /articles");
  console.log("  PUT  /articles/:id");
  console.log("  DELETE /articles/:id");
  console.log("  GET  /tiktok");
  console.log("  GET  /tiktok/:id");
  console.log("  POST /tiktok");
  console.log("  PUT  /tiktok/:id");
  console.log("  DELETE /tiktok/:id");
  console.log("  GET  /api/banners");
  console.log("  GET  /api/admin/banners");
  console.log("=================================");
});