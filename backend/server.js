require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");

const app = express();

console.log("Starting server...");

// Trust proxy
app.set("trust proxy", 1);

// Connect to database
connectDB();

// Basic middleware
app.use(cors());
app.use(express.json());

console.log("Basic middleware loaded");

// Health check first
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

console.log("Health endpoints loaded");

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Spin Wheel API Server",
    status: "Running",
  });
});

console.log("Root endpoint loaded");

// Load routes
console.log("Loading auth routes...");
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);
console.log("✅ Auth routes loaded");

console.log("Loading token routes...");
const tokenRoutes = require("./routes/tokens");
app.use("/api/tokens", tokenRoutes);
console.log("✅ Token routes loaded");

console.log("Loading wheel routes...");
const wheelRoutes = require("./routes/wheel");
app.use("/api/wheel", wheelRoutes);
console.log("✅ Wheel routes loaded");

console.log("Loading admin routes...");
const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);
console.log("✅ Admin routes loaded");

console.log("All routes loaded successfully");

// Create superadmin
const createSuperAdmin = async () => {
  try {
    const User = require("./models/User");
    const existingSuperAdmin = await User.findOne({ role: "superadmin" });

    if (!existingSuperAdmin) {
      const superAdmin = new User({
        username: process.env.SUPERADMIN_USERNAME || "superadmin",
        password: process.env.SUPERADMIN_PASSWORD || "defaultpassword",
        role: "superadmin",
      });

      await superAdmin.save();
      console.log("✅ SuperAdmin created");
    } else {
      console.log("✅ SuperAdmin exists");
    }
  } catch (error) {
    console.error("❌ SuperAdmin error:", error.message);
  }
};

// REMOVED: Error handling middleware
// REMOVED: 404 wildcard handler

const PORT = process.env.PORT || 5000;

console.log("Starting server on port", PORT);

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("🎯 Server started successfully");
  await createSuperAdmin();
});

module.exports = app;
