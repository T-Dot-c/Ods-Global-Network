const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

let io = null;

function getIO() {
  return io;
}

function emitToUser(userId, event, payload) {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
}

function initSocket(httpServer, { allowedOrigins = [] } = {}) {
  let Server;
  try {
    ({ Server } = require("socket.io"));
  } catch (error) {
    console.warn(
      "socket.io is not installed. Realtime features are disabled until dependencies are installed."
    );
    return null;
  }
  const originChecker = (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  };

  io = new Server(httpServer, {
    cors: {
      origin: originChecker,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const raw =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization || "").replace(/^Bearer\s+/i, "");
      if (!raw) {
        return next(new Error("Unauthorized"));
      }
      const decoded = jwt.verify(raw, process.env.JWT_SECRET);
      const [rows] = await pool.query(
        "SELECT id, fullName, email, role, membership FROM users WHERE id = ?",
        [decoded.id]
      );
      if (!rows?.length) {
        return next(new Error("Unauthorized"));
      }
      socket.user = rows[0];
      return next();
    } catch (e) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const uid = socket.user?.id;
    if (uid) {
      socket.join(`user:${uid}`);
    }
    socket.emit("connected", { userId: uid });
  });

  return io;
}

module.exports = {
  initSocket,
  getIO,
  emitToUser,
};
