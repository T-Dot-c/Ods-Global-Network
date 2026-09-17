const HotelAvailability = require("../models/HotelAvailability");
const Service = require("../models/Service");
const User = require("../models/User"); // optional, for notifications

// POST /hotel/check-availability
exports.checkAvailability = async (req, res) => {
  try {
    const { serviceId, checkInDate, checkOutDate, guests, roomPref, userId } = req.body;

    // userId is optional now
    if (!serviceId || !checkInDate || !checkOutDate) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ msg: "Service not found" });

    const inDate = new Date(checkInDate);
    const outDate = new Date(checkOutDate);
    if (outDate <= inDate) {
      return res.status(400).json({ msg: "Check-out must be after check-in" });
    }

    // Check existing approved bookings
    const overlapping = await HotelAvailability.find({
      serviceId,
      status: "approved",
      $or: [
        { checkInDate: { $lt: outDate }, checkOutDate: { $gt: inDate } },
      ],
    });

    const totalRooms = service.subcategory?.includes("Room") ? 10 : 1;
    const availableRooms = Math.max(totalRooms - overlapping.length, 0);

    // Create a pending request
    const newRequest = await HotelAvailability.create({
      serviceId,
      userId: userId || null, // allow null for guests
      checkInDate: inDate,
      checkOutDate: outDate,
      guests: guests || 1,
      roomPref: roomPref || "Any",
      status: "pending",
    });

    console.log(`Notify provider for request ID: ${newRequest._id}`);

    res.json({
      msg: "Request sent to provider for approval",
      request: newRequest,
      availableRooms,
      status: availableRooms > 0 ? "Available" : "Booked", // optional convenience
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error checking availability" });
  }
};
