const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// =============================================
// VALIDATION RULES
// =============================================

const registerValidation = [
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'), // ✅ FIXED
    body('phone').optional().isString()
];

const loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

const changePasswordValidation = [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters') // ✅ FIXED
];

const updateProfileValidation = [
    body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
    body('phone').optional().isString()
];

const resetPasswordValidation = [
    body('token').notEmpty().withMessage('Token is required'),
    body('new_password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters') // ✅ FIXED
];

const forgotPasswordValidation = [
    body('email').isEmail().withMessage('Please provide a valid email') // ✅ ADDED
];

// =============================================
// PUBLIC ROUTES
// =============================================

// Register
router.post('/register', registerValidation, validate, authController.register);

// Login
router.post('/login', loginValidation, validate, authController.login);

// Forgot Password - ✅ FIXED with validation
router.post('/forgot-password', forgotPasswordValidation, validate, authController.forgotPassword);

// Reset Password
router.post('/reset-password', resetPasswordValidation, validate, authController.resetPassword);

// Verify Reset Token
router.get('/verify-reset-token/:token', authController.verifyResetToken);

// =============================================
// PROTECTED ROUTES (Require Authentication)
// =============================================

// Get Profile
router.get('/profile', protect, authController.getProfile);

// Update Profile
router.put('/profile', protect, updateProfileValidation, validate, authController.updateProfile);

// Change Password
router.put('/change-password', protect, changePasswordValidation, validate, authController.changePassword);

// Logout
router.post('/logout', protect, authController.logout);

// Delete Account
router.delete('/account', protect, authController.deleteAccount);

// Get User Stats
router.get('/stats', protect, authController.getUserStats);

module.exports = router;