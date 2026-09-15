const checkRole = (allowedRoles = []) => (req, res, next) => {
  console.log("req.user:", req.user); // <--- add this
  if (!req.user) {
    return res.status(401).json({ msg: "User not authenticated" });
  }

  const userRole = req.user.role?.toLowerCase();
  const roles = allowedRoles.map(r => r.toLowerCase());

  // Always allow super_admin
  if (userRole === "super_admin") {
    return next();
  }

  if (!roles.includes(userRole)) {
    return res.status(403).json({ msg: "Access denied. Insufficient role." });
  }

  next();
};

module.exports = checkRole;

