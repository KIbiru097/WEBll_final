const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const pool = require('../config/db');

// =============================================
// ALL ADMIN ROUTES (Require Authentication + Admin Role)
// =============================================
router.use(protect);
router.use(authorize('admin'));

// =============================================
// DASHBOARD & STATISTICS
// =============================================

// Get dashboard stats
router.get('/dashboard', adminController.getDashboardStats);

// Get system statistics
router.get('/statistics', adminController.getStatistics);

// Get activity logs
router.get('/logs', adminController.getActivityLogs);

// =============================================
// USER MANAGEMENT
// =============================================

// Get all users with filters
router.get('/users', adminController.getAllUsers);

// Delete user
router.delete('/users/:id', adminController.deleteUser);

// =============================================
// PASSWORD HISTORY
// =============================================

// Get user password history (last 5 passwords)
router.get('/users/:userId/password-history', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId is a number
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const result = await pool.query(
      `SELECT id, created_at 
       FROM password_history 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId]
    );
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get password history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching password history'
    });
  }
});

// Get user password history count
router.get('/users/:userId/password-history/count', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId is a number
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM password_history WHERE user_id = $1',
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        count: parseInt(result.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Get password history count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching password history count'
    });
  }
});

// Clear user password history (Admin only)
router.delete('/users/:userId/password-history', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId is a number
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Delete password history
    const result = await pool.query(
      'DELETE FROM password_history WHERE user_id = $1',
      [userId]
    );
    
    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details) 
       VALUES ($1, $2, $3)`,
      [req.user.id, 'PASSWORD_HISTORY_CLEARED', `Cleared password history for user ${userId}`]
    );
    
    res.json({
      success: true,
      message: 'Password history cleared successfully',
      deleted: result.rowCount
    });
  } catch (error) {
    console.error('Clear password history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error clearing password history'
    });
  }
});

// =============================================
// LOST ITEMS MANAGEMENT (Admin)
// =============================================

// Get all lost items (with filters)
router.get('/lost-items', adminController.getAllLostItems);

// Update lost item status
router.put('/lost-items/:id', adminController.updateLostItem);

// Delete lost item
router.delete('/lost-items/:id', adminController.deleteLostItem);

// =============================================
// FOUND ITEMS MANAGEMENT (Admin)
// =============================================

// Get all found items (with filters)
router.get('/found-items', adminController.getAllFoundItems);

// Update found item status
router.put('/found-items/:id', adminController.updateFoundItem);

// Delete found item
router.delete('/found-items/:id', adminController.deleteFoundItem);

// =============================================
// CLAIMS MANAGEMENT (Admin)
// =============================================

// Get all claims (with filters)
router.get('/claims', adminController.getAllClaims);

// Update claim status (approve/reject)
router.put('/claims/:id', adminController.updateClaimStatus);

// Delete claim
router.delete('/claims/:id', adminController.deleteClaim);

// =============================================
// SYSTEM MANAGEMENT
// =============================================

// Get system health
router.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time');
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0].time,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

module.exports = router;