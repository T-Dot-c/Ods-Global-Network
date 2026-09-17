const mongoose = require("mongoose");

const hotelAvailabilitySchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // new
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  guests: { type: Number, default: 1 },
  roomPref: { type: String, default: "Any" },
  status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" }, // new
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("HotelAvailability", hotelAvailabilitySchema);

