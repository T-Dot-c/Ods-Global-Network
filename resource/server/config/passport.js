const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { pool } = require("../config/db");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? "https://wanaw.et/api/auth/google/callback"
          : "http://localhost:5000/api/auth/google/callback",
      passReqToCallback: true, // Allow access to the original request
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("🔍 Google OAuth profile received:", {
          id: profile.id,
          displayName: profile.displayName,
          emails: profile.emails
        });
        
        const { id, displayName, emails } = profile;
        const email = emails && emails[0].value;

        if (!email) {
          console.error("❌ No email found in Google profile");
          throw new Error("No email found in Google profile");
        }
        
        console.log("🔍 Processing Google OAuth for email:", email);

        // Check if user exists by googleId or email
        const [existingUsers] = await pool.query(
          "SELECT * FROM users WHERE googleId = ? OR email = ?",
          [id, email]
        );

        let user = existingUsers[0];
        
        console.log("🔍 Existing user check:", {
          found: !!user,
          hasGoogleId: user?.googleId,
          email: user?.email
        });

        if (!user) {
          // Create new user with Google OAuth
          console.log("🆕 Creating new user via Google OAuth");
          const membershipId = `MEM${Math.random().toString(36).substring(2, 8).toUpperCase()}${Date.now().toString().slice(-6)}`;
          // Generate an 8-digit numeric referral code
          const min = 10000000;
          const max = 99999999;
          const referralCode = Math.floor(Math.random() * (max - min + 1) + min).toString();
          
          console.log("🔍 Generated IDs:", { membershipId, referralCode });
          
          const [result] = await pool.query(
            `INSERT INTO users (fullName, email, password, role, referralCode, referralClicks, membership, membershipId, googleId, referredBy)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [displayName, email, '', 'individual', referralCode, 0, 'Standard Member', membershipId, id, null]
          );
          
          console.log("✅ New user created with ID:", result.insertId);
          
          const [newUser] = await pool.query(
            "SELECT * FROM users WHERE id = ?",
            [result.insertId]
          );
          user = newUser[0];
        } else if (!user.googleId && user.email === email) {
          // User exists with email but no googleId - link them
          console.log("🔗 Linking existing user to Google account");
          await pool.query(
            "UPDATE users SET googleId = ? WHERE id = ?",
            [id, user.id]
          );
          user.googleId = id;
          console.log("✅ User linked to Google account");
        } else {
          console.log("✅ Existing Google user found");
        }

        return done(null, user);
      } catch (err) {
        console.error("Google OAuth error:", err);
        return done(err, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    done(null, rows[0] || null);
  } catch (err) {
    done(err, null);
  }
});

