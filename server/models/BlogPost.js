const pool = require("../config/db"); // your MySQL connection

const createBlogPost = async (post) => {
  const { title, slug, excerpt, content, coverImage, authorId, published } = post;
  const [result] = await pool.query(
    `INSERT INTO blog_posts 
      (title, slug, excerpt, content, cover_image, author_id, published, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [title, slug, excerpt, content, coverImage, authorId, published ? 1 : 0]
  );
  return result.insertId;
};

module.exports = { createBlogPost };


