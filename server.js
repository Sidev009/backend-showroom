const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

/* ================= CORS ================= */
const corsOptions = {
origin: [
"https://anekamobil.netlify.app",
"http://localhost:5173",
"http://localhost:3000",
"http://localhost:8080"
],
credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= DATABASE ================= */
const pool = mysql.createPool({
host: process.env.DB_HOST,
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_NAME,
port: process.env.DB_PORT || 3306,
waitForConnections: true,
connectionLimit: 10,
queueLimit: 0,
enableKeepAlive: true,
keepAliveInitialDelay: 0
});

/* ===== PROMISE QUERY WRAPPER ===== */
const query = (sql, params = []) =>
new Promise((resolve, reject) => {
pool.query(sql, params, (err, result) => {
if (err) {
console.log("MYSQL ERROR:", err);
reject(err);
} else {
resolve(result);
}
});
});

/* ================= MULTER ================= */
const storage = multer.diskStorage({
destination: (req, file, cb) => cb(null, "uploads/"),
filename: (req, file, cb) => {
const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
cb(null, unique + path.extname(file.originalname));
}
});

const upload = multer({ storage });

/* ================= ROOT ================= */
app.get("/", (req, res) => {
res.json({
message: "Backend Showroom API running",
endpoints: [
"/cars",
"/cars/",
"/articles",
"/tiktok",
"/api/banners"
]
});
});

/* ================= GET CARS ================= */
app.get("/cars", async (req, res) => {
try {

const cars = await query(
  "SELECT * FROM cars ORDER BY id DESC"
);

if (!cars.length) return res.json([]);

const images = await query(
  "SELECT * FROM car_images"
);

const result = cars.map(car => ({
  ...car,
  images: images
    .filter(img => img.car_id === car.id)
    .map(img => `/uploads/${img.image_path}`)
}));

res.json(result);

} catch (err) {
res.status(500).json({ error: err.message });
}
});

/* ================= GET CAR DETAIL ================= */
app.get("/cars/", async (req, res) => {
try {

const car = await query(
  "SELECT * FROM cars WHERE id = ?",
  [req.params.id]
);

if (!car.length)
  return res.status(404).json({ error: "Not found" });

const images = await query(
  "SELECT * FROM car_images WHERE car_id = ?",
  [req.params.id]
);

res.json({
  ...car[0],
  images: images.map(img => `/uploads/${img.image_path}`)
});

} catch (err) {
res.status(500).json({ error: err.message });
}
});

/* ================= CREATE CAR ================= */
app.post("/cars", upload.array("images", 20), async (req, res) => {
try {

const { name, brand, year, price } = req.body;

const result = await query(
  "INSERT INTO cars (name,brand,year,price) VALUES (?,?,?,?)",
  [name, brand, year, price]
);

const carId = result.insertId;

if (req.files?.length) {

  const values = req.files.map(file => [
    carId,
    file.filename
  ]);

  await query(
    "INSERT INTO car_images (car_id,image_path) VALUES ?",
    [values]
  );
}

res.json({
  message: "Mobil berhasil ditambahkan",
  id: carId
});

} catch (err) {
res.status(500).json({ error: err.message });
}
});

/* ================= DELETE CAR ================= */
app.delete("/cars/", async (req, res) => {
try {

await query(
  "DELETE FROM cars WHERE id=?",
  [req.params.id]
);

res.json({ message: "Mobil dihapus" });

} catch (err) {
res.status(500).json({ error: err.message });
}
});

/* ================= ARTICLES ================= */
app.get("/articles", async (req, res) => {
try {

const articles = await query(
  "SELECT * FROM articles ORDER BY id DESC"
);

res.json(articles);

} catch (err) {
res.status(500).json({ error: err.message });
}
});

app.post("/articles", upload.single("thumbnail"), async (req, res) => {
try {

const { title, link, category } = req.body;

const thumbnail = req.file
  ? req.file.filename
  : null;

const result = await query(
  "INSERT INTO articles (title,file_path,thumbnail,category) VALUES (?,?,?,?)",
  [title, link || "", thumbnail, category || "Tips"]
);

res.json({ id: result.insertId });

} catch (err) {
res.status(500).json({ error: err.message });
}
});

/* ================= TIKTOK ================= */
app.get("/tiktok", async (req, res) => {
try {

const videos = await query(
  "SELECT * FROM tiktok_videos ORDER BY id DESC"
);

res.json(videos);

} catch (err) {
res.status(500).json({ error: err.message });
}
});

app.post("/tiktok", async (req, res) => {
try {

const { title, url } = req.body;

const result = await query(
  "INSERT INTO tiktok_videos (title,url) VALUES (?,?)",
  [title || "Video TikTok", url]
);

res.json({ id: result.insertId });

} catch (err) {
res.status(500).json({ error: err.message });
}
});

/* ================= BANNERS ================= */
app.get("/api/banners", async (req, res) => {
try {

const today = new Date()
  .toISOString()
  .split("T")[0];

const banners = await query(
  `SELECT * FROM promo_banners
   WHERE is_active = true
   AND (start_date IS NULL OR start_date <= ?)
   AND (end_date IS NULL OR end_date >= ?)
   ORDER BY id DESC`,
  [today, today]
);

res.json(banners);

} catch (err) {
res.status(500).json({ error: err.message });
}
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