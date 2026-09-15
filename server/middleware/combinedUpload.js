// middleware/combinedUpload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ---------------- Unified local storage for all file types ----------------
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_.-]/g, "")}`;
    cb(null, safeName);
  },
});

// ---------------- File filter for all types ----------------
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png", 
    "image/jpg",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

// ---------------- Parametrized middleware ----------------
const combinedUpload = (fieldsConfig) => {
  const multerFields = fieldsConfig.map((f) => ({ 
    name: f.name, 
    maxCount: f.maxCount 
  }));

  return multer({
    storage: localStorage,
    fileFilter,
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB limit
    }
  }).fields(multerFields);
};

module.exports = combinedUpload;
