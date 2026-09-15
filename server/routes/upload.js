const express = require("express");
const { cloudUpload, uploadToCloudinaryMiddleware } = require("../middleware/cloudUpload");
const uploadLocal = require("../middleware/uploadLocal");

const router = express.Router();

// POST /api/upload - handles single image/video upload to Cloudinary
router.post("/", 
  cloudUpload.single("image"), // Upload to temp storage first
  uploadToCloudinaryMiddleware, // Upload to Cloudinary and clean up temp file
  (req, res) => {
    try {
      console.log("Uploaded file:", req.file);

      if (!req.file) {
        return res.status(400).json({ msg: "No file uploaded" });
      }

      // Return Cloudinary URL
      const imageUrl = req.file.cloudinaryUrl || req.file.path;

      res.status(200).json({
        success: true,
        imageUrl: imageUrl,
        filename: req.file.originalname,
        publicId: req.file.publicId,
        resourceType: req.file.resourceType,
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ msg: "Image upload failed", error: err.message });
    }
  }
);

// POST /api/upload/document - handles document/PDF uploads to local storage
router.post("/document", uploadLocal.single("document"), (req, res) => {
  try {
    console.log("Uploaded document:", req.file);

    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // Return local file URL
    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      fileUrl: fileUrl,
      filename: req.file.filename,
    });
  } catch (err) {
    console.error("Document upload error:", err);
    res.status(500).json({ msg: "Document upload failed", error: err.message });
  }
});

module.exports = router;
