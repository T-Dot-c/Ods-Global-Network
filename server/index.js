const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");
const { initSocket, emitToUser } = require("./socket/socketServer");
const {
  ensureUserNotificationsTable,
  setNotificationEmitter,
} = require("./services/userNotificationService");
const passport = require("passport");
const session = require("express-session");
const path = require("path");

const notificationRoutes = require('./routes/notificationRoutes');
const womenInitiativeRoutes = require("./routes/womenInitiativeRoutes");



dotenv.config();

const app = express();
connectDB();

// Startup checks
const { checkAndCreateReviewsTable } = require("./utils/checkReviewsTable");
const { sanitizeServiceTags } = require("./utils/sanitizeServiceTags");
const ensureUserVerificationColumns = require("./utils/ensureUserVerificationColumns");
const addDiasporaSubscriptionColumns = require("./utils/addDiasporaSubscriptionColumns");
const ensureDiplomaticCommunityTable = require("./utils/ensureDiplomaticCommunityTable");
const { ensureServiceRequestTables } = require("./controllers/serviceRequestController");
const ensureAgentSupport = require("./utils/ensureAgentSupport");

checkAndCreateReviewsTable().catch(err => {
  console.error("❌ Failed to setup reviews table:", err);
});

sanitizeServiceTags().catch(err => {
  console.error("❌ Failed to sanitize service tags:", err);
});

ensureUserVerificationColumns().catch(err => {
  console.error("❌ Failed to setup user verification columns:", err);
});

addDiasporaSubscriptionColumns().catch(err => {
  console.error("❌ Failed to setup diaspora subscription columns:", err);
});

ensureDiplomaticCommunityTable().catch(err => {
  console.error("❌ Failed to setup diplomatic community table:", err);
});

ensureServiceRequestTables().catch(err => {
  console.error("❌ Failed to setup service request tables:", err);
});

ensureAgentSupport().catch((err) => {
  console.error("❌ Failed to setup agent support:", err);
});

ensureUserNotificationsTable().catch((err) => {
  console.error("❌ Failed to setup user_notifications table:", err);
});

// ✅ Trust proxy to get real protocol (https) when behind reverse proxy
app.set('trust proxy', true);

// ✅ Allowed frontend origins (local + Netlify)
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:30001",
  "https://wanawhealthandwellness.netlify.app",
  "http://196.189.61.159",
  "http://wanaw.et",
  "https://wanaw.et",
  "http://www.wanaw.et",
  "https://www.wanaw.et",
];


// ✅ CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        // Allow undefined origin (like <img> tag requests)
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


// ✅ Parse JSON request bodies
app.use(express.json());

// ✅ Session middleware (must come BEFORE passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // true in production
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

// ✅ Passport setup (initialize and session)
require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());




// Handle CORS preflight for uploads
app.options('/uploads/:filename', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(204).send();
});

// Explicit route handler for uploads to ensure proper headers and CORS
// This must come BEFORE express.static middleware to take precedence
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  // Check if file exists
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return res.status(404).json({ msg: 'File not found' });
  }
  
  // Set proper content type based on file extension
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  } else if (ext === '.doc') {
    res.setHeader('Content-Type', 'application/msword');
  } else if (ext === '.docx') {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  } else if (ext === '.xls') {
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
  } else if (ext === '.xlsx') {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }
  
  // Set CORS headers to allow access from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  
  // Log for debugging in production
  console.log(`✅ Serving file: ${filename} (${ext})`);
  
  // Serve the file
  res.sendFile(filePath);
});

// Serve local uploads as fallback (for cases not handled by explicit route)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}));

// ✅ Route mounting
app.use("/api/auth", require("./routes/auth"));

const partnerRoutes = require("./routes/partnerRoutes");
app.use("/api", partnerRoutes);

app.use("/api/gifts", require("./routes/gift"));
app.use("/api", require("./routes/admin.blog"));

app.use("/api/support", require("./routes/support"));
app.use("/api/programs", require("./routes/programs"));
app.use("/api/membership", require("./routes/membership"));
// Routes
app.use("/api/women-initiatives", womenInitiativeRoutes);

app.use("/api/payment", require("./routes/payment"));
app.use('/api/notifications', notificationRoutes);
app.use("/api/upload", require("./routes/upload"));
app.use("/api/users", require("./routes/userRoute"));
const serviceRoutes = require("./routes/service");     // ✅ This is correct
app.use("/api/services", serviceRoutes);

const adminStatsRoutes = require("./routes/adminStats");
app.use("/api/admin", adminStatsRoutes);

const communityRoutes = require("./routes/communityRoutes");
app.use("/api/community", communityRoutes);

const premiumCommunityRoutes = require("./routes/premiumCommunityRoutes");
app.use("/api/premium-community", premiumCommunityRoutes);

const jobRoutes = require('./routes/jobRoutes');
app.use('/api/jobs', jobRoutes);

const applicationRoutes = require('./routes/applicationRoutes');

app.use('/api/applications', applicationRoutes);

const kidneyPatientRoutes = require("./routes/kidneyPatientRoutes");
app.use("/api/kidney-patients", kidneyPatientRoutes);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));



const supportCommunityRoutes = require("./routes/supportCommunityRoutes");
app.use("/api/support-community", supportCommunityRoutes);

const diplomaticCommunityRoutes = require("./routes/diplomaticCommunityRoutes");
app.use("/api/diplomatic-community", diplomaticCommunityRoutes);

const providerRoutes = require("./routes/providerRoute");
app.use("/api/provider", providerRoutes);
app.use("/api/agents", require("./routes/agentRoute"));

const diasporaRoutes = require("./routes/diasporaRoute");
app.use("/api/diaspora", diasporaRoutes);

// Diaspora premium community membership (used by /community/diaspora)
app.use("/api/diaspora-members", require("./routes/diasporaMembers"));

const subscribeRoute = require("./routes/subscribe");
app.use("/api/subscribe", subscribeRoute);

const hotelRoutes = require("./routes/hotel");
app.use("/hotel", hotelRoutes);


app.use("/api/purchase", require("./routes/purchase"));

// Reviews routes - MUST be before catch-all routes
try {
  const reviewRoutes = require("./routes/review");
  
  // Add logging middleware to debug route issues
  app.use("/api/reviews", (req, res, next) => {
    console.log(`📝 Reviews API ${req.method} ${req.path} - Headers:`, {
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'Present' : 'Missing'
    });
    next();
  });
  
  app.use("/api/reviews", reviewRoutes);
  console.log("✅ Review routes registered successfully at /api/reviews");
  console.log("✅ Available routes: GET /api/reviews/test, POST /api/reviews, GET /api/reviews/service/:serviceId");
} catch (err) {
  console.error("❌ Failed to load review routes:", err);
  console.error("❌ Error stack:", err.stack);
  // Don't crash the server, just log the error
}

// ✅ Chatbot routes
const chatRoutes = require("./routes/chatRoutes");
app.use("/api/chat", chatRoutes);
app.use("/api", require("./routes/serviceRequestRoutes"));

// Serve static files and handle SPA routing in production
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "../client/dist");

  // Serve React static files with proper caching headers
  app.use(express.static(clientBuildPath, {
    maxAge: '1y', // Cache static assets for 1 year
    etag: true,
    lastModified: true
  }));

  // Handle SPA routing - serve index.html for all non-API and non-uploads routes
  // Make sure /uploads is explicitly excluded from SPA routing
  app.get(/^(?!\/api|\/uploads|\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv)).*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
} else {
  // Development mode - serve a simple message
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Wanaw Health and Wellness API Server',
      mode: 'development',
      frontend: 'http://localhost:5173'
    });
  });
}




// ✅ Start the server (HTTP + Socket.IO)
const PORT = process.env.PORT || 5000;
setNotificationEmitter(emitToUser);
const server = http.createServer(app);
initSocket(server, { allowedOrigins });
server.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${PORT} (WebSocket enabled)`)
);


