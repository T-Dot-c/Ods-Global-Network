const mongoose = require("mongoose");
const Program = require("../models/Program");
const cors = require("cors");
const dotenv = require("dotenv");
require("dotenv").config();
const connectDB = require("../config/db");

// Connect to your MongoDB
connectDB();

const seedPrograms = [
  {

    title: "Wellness",
    category: "Wellness",
    image: "/images/wellness.jpg",
    services: [
      "GYM", "Swimming Pool", "Moroccan Bath", "Massage Therapy",
      "Neck & Shoulder Massage", "Yoga", "Steam", "Body Masks"
    ],
  },
  {
    title: "Medical",
    category: "Medical",
    image: "/images/medical.jpg",
    services: [
      "Doctors Consultation", "Pharmacy", "Diagnostic Imaging", "Nutritionist",
      "Psychologist & Counseling", "Laboratory", "Physiotherapy"
    ],
  },
  {
    title: "Aesthetician",
    category: "Aesthetician",
    image: "/images/aesthetic.jpg",
    services: ["Tattoo Removal", "Scar Removal", "Laser Hair Removal", "Hair Transplant"],
  },
  {
    title: "Hotel Rooms",
    category: "Hotel",
    image: "/images/hotel.jpg",
    services: ["Standard Room", "Deluxe Room", "Royal Suite", "Presidential Suite"],
  },
];

async function seedDB() {
  try {
    await connectDB(); // ⬅️ WAIT for DB to connect
    await Program.deleteMany();
    await Program.insertMany(seedPrograms);
    console.log("✅ Programs seeded successfully.");
  } catch (err) {
    console.error("❌ Error seeding programs:", err);
  } finally {
    mongoose.connection.close();
  }
}

seedDB();




