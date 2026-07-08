const { body, param, query, validationResult } = require('express-validator');

// =============================================
// AUTH VALIDATION RULES
// =============================================

// Register validation - ✅ FIXED: removed role, min 8 chars
const validateRegister = [
    body('full_name')
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters')
        .trim(),
    
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters') // ✅ FIXED
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
    
    body('phone')
        .optional()
        .isString().withMessage('Phone must be a string')
        .trim()
    // ✅ REMOVED: role validation (controller forces 'student')
];

// Login validation
const validateLogin = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required')
];

// Forgot password validation - ✅ ADDED
const validateForgotPassword = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail()
];

// Update profile validation
const validateUpdateProfile = [
    body('full_name')
        .optional()
        .notEmpty().withMessage('Full name cannot be empty')
        .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters')
        .trim(),
    
    body('phone')
        .optional()
        .isString().withMessage('Phone must be a string')
        .trim(),
    
    body('profile_pic')
        .optional()
        .isString().withMessage('Profile picture must be a string')
];

// Change password validation - ✅ FIXED: min 8 chars
const validateChangePassword = [
    body('current_password')
        .notEmpty().withMessage('Current password is required'),
    
    body('new_password')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters') // ✅ FIXED
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number')
];

// Reset password validation - ✅ FIXED: min 8 chars
const validateResetPassword = [
    body('token')
        .notEmpty().withMessage('Token is required'),
    
    body('new_password')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters') // ✅ FIXED
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number')
];

// =============================================
// LOST ITEM VALIDATION RULES
// =============================================

// Create lost item validation
const validateLostItem = [
    body('item_name')
        .notEmpty().withMessage('Item name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Item name must be between 2 and 100 characters')
        .trim(),
    
    body('category')
        .notEmpty().withMessage('Category is required')
        .isLength({ min: 2, max: 50 }).withMessage('Category must be between 2 and 50 characters')
        .trim(),
    
    body('description')
        .optional()
        .isString().withMessage('Description must be a string')
        .trim(),
    
    body('location_lost')
        .notEmpty().withMessage('Location is required')
        .isLength({ min: 2, max: 255 }).withMessage('Location must be between 2 and 255 characters')
        .trim(),
    
    body('date_lost')
        .notEmpty().withMessage('Date lost is required')
        .isISO8601().withMessage('Please provide a valid date (YYYY-MM-DD)')
        .toDate(),
    
    body('status')
        .optional()
        .isIn(['open', 'claimed', 'returned']).withMessage('Status must be open, claimed, or returned')
];

// Update lost item validation
const validateUpdateLostItem = [
    param('id')
        .isInt().withMessage('Invalid item ID'),
    
    body('item_name')
        .optional()
        .notEmpty().withMessage('Item name cannot be empty')
        .isLength({ min: 2, max: 100 }).withMessage('Item name must be between 2 and 100 characters')
        .trim(),
    
    body('category')
        .optional()
        .notEmpty().withMessage('Category cannot be empty')
        .isLength({ min: 2, max: 50 }).withMessage('Category must be between 2 and 50 characters')
        .trim(),
    
    body('description')
        .optional()
        .isString().withMessage('Description must be a string')
        .trim(),
    
    body('location_lost')
        .optional()
        .notEmpty().withMessage('Location cannot be empty')
        .isLength({ min: 2, max: 255 }).withMessage('Location must be between 2 and 255 characters')
        .trim(),
    
    body('date_lost')
        .optional()
        .isISO8601().withMessage('Please provide a valid date (YYYY-MM-DD)')
        .toDate(),
    
    body('status')
        .optional()
        .isIn(['open', 'claimed', 'returned']).withMessage('Status must be open, claimed, or returned')
];

// =============================================
// FOUND ITEM VALIDATION RULES
// =============================================

// Create found item validation
const validateFoundItem = [
    body('item_name')
        .notEmpty().withMessage('Item name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Item name must be between 2 and 100 characters')
        .trim(),
    
    body('category')
        .notEmpty().withMessage('Category is required')
        .isLength({ min: 2, max: 50 }).withMessage('Category must be between 2 and 50 characters')
        .trim(),
    
    body('description')
        .optional()
        .isString().withMessage('Description must be a string')
        .trim(),
    
    body('location_found')
        .notEmpty().withMessage('Location is required')
        .isLength({ min: 2, max: 255 }).withMessage('Location must be between 2 and 255 characters')
        .trim(),
    
    body('date_found')
        .notEmpty().withMessage('Date found is required')
        .isISO8601().withMessage('Please provide a valid date (YYYY-MM-DD)')
        .toDate(),
    
    body('status')
        .optional()
        .isIn(['available', 'claimed', 'returned']).withMessage('Status must be available, claimed, or returned')
];

// Update found item validation
const validateUpdateFoundItem = [
    param('id')
        .isInt().withMessage('Invalid item ID'),
    
    body('item_name')
        .optional()
        .notEmpty().withMessage('Item name cannot be empty')
        .isLength({ min: 2, max: 100 }).withMessage('Item name must be between 2 and 100 characters')
        .trim(),
    
    body('category')
        .optional()
        .notEmpty().withMessage('Category cannot be empty')
        .isLength({ min: 2, max: 50 }).withMessage('Category must be between 2 and 50 characters')
        .trim(),
    
    body('description')
        .optional()
        .isString().withMessage('Description must be a string')
        .trim(),
    
    body('location_found')
        .optional()
        .notEmpty().withMessage('Location cannot be empty')
        .isLength({ min: 2, max: 255 }).withMessage('Location must be between 2 and 255 characters')
        .trim(),
    
    body('date_found')
        .optional()
        .isISO8601().withMessage('Please provide a valid date (YYYY-MM-DD)')
        .toDate(),
    
    body('status')
        .optional()
        .isIn(['available', 'claimed', 'returned']).withMessage('Status must be available, claimed, or returned')
];

// =============================================
// CLAIM VALIDATION RULES
// =============================================

// Create claim validation
const validateClaim = [
    body('item_id')
        .notEmpty().withMessage('Item ID is required')
        .isInt().withMessage('Item ID must be a number'),
    
    body('item_type')
        .notEmpty().withMessage('Item type is required')
        .isIn(['lost', 'found']).withMessage('Item type must be lost or found'),
    
    body('reason')
        .notEmpty().withMessage('Reason is required')
        .isLength({ min: 10, max: 1000 }).withMessage('Reason must be between 10 and 1000 characters')
        .trim(),
    
    body('brand')
        .optional()
        .isString().withMessage('Brand must be a string')
        .isLength({ max: 100 }).withMessage('Brand cannot exceed 100 characters')
        .trim(),
    
    body('color')
        .optional()
        .isString().withMessage('Color must be a string')
        .isLength({ max: 50 }).withMessage('Color cannot exceed 50 characters')
        .trim(),
    
    body('serial_number')
        .optional()
        .isString().withMessage('Serial number must be a string')
        .isLength({ max: 100 }).withMessage('Serial number cannot exceed 100 characters')
        .trim(),
    
    body('unique_marks')
        .optional()
        .isString().withMessage('Unique marks must be a string')
        .isLength({ max: 500 }).withMessage('Unique marks cannot exceed 500 characters')
        .trim()
];

// Update claim validation (Admin only)
const validateUpdateClaim = [
    param('id')
        .isInt().withMessage('Invalid claim ID'),
    
    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['pending', 'approved', 'rejected']).withMessage('Status must be pending, approved, or rejected'),
    
    body('admin_notes')
        .optional()
        .isString().withMessage('Admin notes must be a string')
        .isLength({ max: 500 }).withMessage('Admin notes cannot exceed 500 characters')
        .trim()
];

// =============================================
// ADMIN VALIDATION RULES
// =============================================

// Get users validation
const validateGetUsers = [
    query('role')
        .optional()
        .isIn(['student', 'admin']).withMessage('Role must be student or admin'),
    
    query('search')
        .optional()
        .isString().withMessage('Search must be a string')
        .trim(),
    
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive number')
        .toInt(),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
        .toInt()
];

// Delete user validation
const validateDeleteUser = [
    param('id')
        .isInt().withMessage('Invalid user ID')
];

// =============================================
// SEARCH VALIDATION
// =============================================

// Search items validation
const validateSearch = [
    query('search')
        .optional()
        .isString().withMessage('Search must be a string')
        .trim(),
    
    query('category')
        .optional()
        .isString().withMessage('Category must be a string')
        .trim(),
    
    query('location')
        .optional()
        .isString().withMessage('Location must be a string')
        .trim(),
    
    query('status')
        .optional()
        .isString().withMessage('Status must be a string')
        .trim(),
    
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive number')
        .toInt(),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
        .toInt()
];

// =============================================
// VALIDATION RESULT HANDLER
// =============================================

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({
        field: err.path,
        message: err.msg
    }));
    
    return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: extractedErrors
    });
};

// =============================================
// EXPORT ALL VALIDATIONS
// =============================================

module.exports = {
    // Auth validations
    validateRegister,
    validateLogin,
    validateForgotPassword, // ✅ ADDED
    validateUpdateProfile,
    validateChangePassword,
    validateResetPassword, // ✅ ADDED
    
    // Lost item validations
    validateLostItem,
    validateUpdateLostItem,
    
    // Found item validations
    validateFoundItem,
    validateUpdateFoundItem,
    
    // Claim validations
    validateClaim,
    validateUpdateClaim,
    
    // Admin validations
    validateGetUsers,
    validateDeleteUser,
    
    // Search validation
    validateSearch,
    
    // Validation result handler
    validate
};