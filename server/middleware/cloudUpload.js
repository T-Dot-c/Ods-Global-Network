const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { uploadToCloudinary } = require("../config/cloudinary");

// Temporary local storage for images/videos before uploading to Cloudinary
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/temp");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
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

const cloudUpload = multer({
  storage: tempStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg", 
      "image/png", 
      "image/jpg", 
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/webm"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed"));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Middleware to upload to Cloudinary after multer processing
const uploadToCloudinaryMiddleware = async (req, res, next) => {
  try {
    // If single file upload
    if (req.file) {
      const filePath = req.file.path;
      const folder = req.body.folder || 'wanaw/services'; // Default folder for services
      
      const cloudinaryResult = await uploadToCloudinary(filePath, folder);
      
      // Store Cloudinary URL in req.file.cloudinaryUrl
      req.file.cloudinaryUrl = cloudinaryResult.url;
      req.file.publicId = cloudinaryResult.public_id;
      req.file.resourceType = cloudinaryResult.resource_type;
      
      // Delete temporary local file
      fs.unlinkSync(filePath);
      
      // Update file.path to Cloudinary URL for backward compatibility
      req.file.path = cloudinaryResult.url;
    }
    
    // If multiple files upload
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const filePath = file.path;
        const folder = req.body.folder || 'wanaw/services';
        
        const cloudinaryResult = await uploadToCloudinary(filePath, folder);
        
        file.cloudinaryUrl = cloudinaryResult.url;
        file.publicId = cloudinaryResult.public_id;
        file.resourceType = cloudinaryResult.resource_type;
        
        // Delete temporary local file
        fs.unlinkSync(filePath);
        
        // Update file.path to Cloudinary URL
        file.path = cloudinaryResult.url;
      }
    }
    
    next();
  } catch (error) {
    console.error("❌ Cloudinary upload middleware error:", error);
    
    // Clean up temporary files on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    return res.status(500).json({ 
      msg: "Failed to upload to Cloudinary", 
      error: error.message 
    });
  }
};

module.exports = { cloudUpload, uploadToCloudinaryMiddleware };
