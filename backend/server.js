const express = require("express");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Define Port
const PORT = process.env.PORT || 5000;

// Start Server
app.listen(PORT, () => {
    console.log("=================================");
    console.log("🚀 Server Started Successfully");
    console.log("=================================");
    console.log(`📍 Running on: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log("=================================");
});

// Export App
module.exports = app;