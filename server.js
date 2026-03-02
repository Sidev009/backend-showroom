const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// ... (semua endpoint kamu tetap sama) ...

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("=================================");
  console.log("API endpoints ready:");
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
  console.log("  POST /api/admin/banners");
  console.log("  PUT  /api/admin/banners/:id");
  console.log("  DELETE /api/admin/banners/:id");
  console.log("=================================");
});