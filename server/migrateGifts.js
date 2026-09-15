const mongoose = require("mongoose");
const Gift = require("./models/Gift"); // adjust path if needed

// Connect to your DB
mongoose.connect("mongodb://localhost:27017/yourDBname", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const migrateGifts = async () => {
  try {
    const gifts = await Gift.find({}); // get all gifts

    for (let gift of gifts) {
      if (gift.service && typeof gift.service === "string") {
        gift.service = mongoose.Types.ObjectId(gift.service);
        await gift.save();
        console.log(`✅ Migrated gift ${gift._id}`);
      }
    }

    console.log("✅ Migration completed!");
    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Migration error:", err);
    mongoose.disconnect();
  }
};

migrateGifts();
