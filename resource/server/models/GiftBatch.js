const mongoose = require("mongoose");

const giftBatchSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    buyerEmail: { type: String, required: true },
    tx_ref: { type: String, required: true, unique: true },
    gifts: [
      {
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
        occasionId: { type: mongoose.Schema.Types.ObjectId, ref: "Occasion", default: null },
        amount: Number,
        recipient: {
          name: String,
          email: String,
          phone: String,
          whatsapp: String,
        },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GiftBatch", giftBatchSchema);
