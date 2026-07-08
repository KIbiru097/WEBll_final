const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

// Load environment variables
dotenv.config();

// Import database connection
const pool = require("./config/db");

// Import routes
const authRoutes = require("./routes/authRoutes");
const lostItemRoutes = require("./routes/lostItemRoutes");
const foundItemRoutes = require("./routes/foundItemRoutes");
const claimRoutes = require("./routes/claimRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================
// MIDDLEWARE
// =============================================

// CORS middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    next();
});

// =============================================
// TEST ROUTES
// =============================================

// Root route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Lost & Found API is running",
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth",
            lostItems: "/api/lost-items",
            foundItems: "/api/found-items",
            claims: "/api/claims",
            admin: "/api/admin"
        }
    });
});

// Health check route
app.get("/api/health", async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as time');
        res.json({
            success: true,
            status: "OK",
            message: "Server is running",
            database: "Connected",
            timestamp: result.rows[0].time,
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: "ERROR",
            message: "Server is running but database connection failed",
            error: error.message
        });
    }
});

// =============================================
// API ROUTES
// =============================================

// Authentication routes
app.use("/api/auth", authRoutes);

// Lost item routes
app.use("/api/lost-items", lostItemRoutes);

// Found item routes
app.use("/api/found-items", foundItemRoutes);

// Claim routes
app.use("/api/claims", claimRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);

// =============================================
// ERROR HANDLING
// =============================================

// 404 Not Found handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.code === 'FILE_TOO_LARGE') {
        return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 5MB'
        });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
            success: false,
            message: 'Too many files uploaded'
        });
    }
    
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }
    
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// =============================================
// START SERVER
// =============================================

app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`\n📋 Available Endpoints:`);
    console.log(`   GET    /                           - API Information`);
    console.log(`   GET    /api/health                 - Health Check`);
    console.log(`\n🔐 Auth Routes:`);
    console.log(`   POST   /api/auth/register          - Register User`);
    console.log(`   POST   /api/auth/login             - Login User`);
    console.log(`   POST   /api/auth/forgot-password   - Forgot Password`);
    console.log(`   POST   /api/auth/reset-password    - Reset Password`);
    console.log(`   GET    /api/auth/profile           - Get Profile (Auth Required)`);
    console.log(`   PUT    /api/auth/profile           - Update Profile (Auth Required)`);
    console.log(`   PUT    /api/auth/change-password   - Change Password (Auth Required)`);
    console.log(`\n📦 Lost Items Routes:`);
    console.log(`   GET    /api/lost-items             - Get All Lost Items`);
    console.log(`   GET    /api/lost-items/:id         - Get Lost Item By ID`);
    console.log(`   POST   /api/lost-items             - Create Lost Item (Auth Required)`);
    console.log(`   PUT    /api/lost-items/:id         - Update Lost Item (Auth Required)`);
    console.log(`   DELETE /api/lost-items/:id         - Delete Lost Item (Auth Required)`);
    console.log(`\n📦 Found Items Routes:`);
    console.log(`   GET    /api/found-items            - Get All Found Items`);
    console.log(`   GET    /api/found-items/:id        - Get Found Item By ID`);
    console.log(`   POST   /api/found-items            - Create Found Item (Auth Required)`);
    console.log(`   PUT    /api/found-items/:id        - Update Found Item (Auth Required)`);
    console.log(`   DELETE /api/found-items/:id        - Delete Found Item (Auth Required)`);
    console.log(`\n📝 Claims Routes:`);
    console.log(`   POST   /api/claims                 - Submit Claim (Auth Required)`);
    console.log(`   GET    /api/claims                 - Get Claims (Auth Required)`);
    console.log(`   GET    /api/claims/:id             - Get Claim By ID (Auth Required)`);
    console.log(`   PUT    /api/claims/:id             - Update Claim (Admin Required)`);
    console.log(`\n👑 Admin Routes:`);
    console.log(`   GET    /api/admin/dashboard        - Dashboard Stats (Admin Required)`);
    console.log(`   GET    /api/admin/users            - Get All Users (Admin Required)`);
    console.log(`   DELETE /api/admin/users/:id        - Delete User (Admin Required)`);
    console.log(`   GET    /api/admin/statistics       - System Statistics (Admin Required)`);
    console.log(`   GET    /api/admin/logs             - Activity Logs (Admin Required)`);
    console.log(`\n📧 Email Configuration:`);
    console.log(`   Email Service: Gmail`);
    console.log(`   Email User: ${process.env.EMAIL_USER}`);
    console.log(`\n✅ Server ready!`);
});

// =============================================
// HANDLE UNCAUGHT EXCEPTIONS
// =============================================

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});

module.exports = app;