// routes/admin.blog.js
const express = require("express");
const { pool } = require("../config/db"); // MySQL2 promise pool
const { cloudUpload, uploadToCloudinaryMiddleware } = require("../middleware/cloudUpload"); // <-- Cloudinary multer

const router = express.Router();

// Helper to generate slugs
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-");
}

// Create a blog post (coverImage saved to Cloudinary)
router.post("/admin/posts", 
  cloudUpload.single("coverImage"),
  uploadToCloudinaryMiddleware,
  async (req, res) => {
    try {
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }

      // Cloudinary upload returns full URL
      const coverImage = req.file?.cloudinaryUrl || req.file?.path || null;

    const slug = slugify(title);

    const [result] = await pool.query(
      `INSERT INTO blog_posts (title, slug, content, cover_image, published, created_at) 
       VALUES (?, ?, ?, ?, 1, NOW())`,
      [title, slug, content, coverImage]
    );

    res.status(201).json({ msg: "Blog post created", postId: result.insertId, slug });
  } catch (err) {
    console.error("❌ Error creating blog post:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// List all published posts
router.get("/posts", async (req, res) => {
  try {
    const [posts] = await pool.query(
      `SELECT id, title, slug, excerpt, cover_image AS coverImage, created_at AS createdAt
       FROM blog_posts
       WHERE published = 1
       ORDER BY created_at DESC`
    );

    res.json(posts);
  } catch (err) {
    console.error("❌ Error fetching blog posts:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single post by slug
router.get("/posts/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
    const [posts] = await pool.query(
      `SELECT id, title, slug, excerpt, content, cover_image AS coverImage, author_id AS authorId, published, created_at AS createdAt, updated_at AS updatedAt
       FROM blog_posts
       WHERE slug = ?`,
      [slug]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(posts[0]);
  } catch (err) {
    console.error("❌ Error fetching blog post by slug:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;



