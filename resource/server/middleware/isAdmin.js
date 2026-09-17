// server/middleware/isAdmin.js
module.exports = (req, res, next) => {
  if (!req.user || !["admin", "super_admin"].includes(req.user.role)) {
    return res.status(403).json({ msg: "Admins only" });
  }
  next();
};

