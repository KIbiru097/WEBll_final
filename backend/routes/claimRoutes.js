const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const claimController = require('../controllers/claimController');
const { protect, authorize } = require('../middleware/auth');
const { uploadSingle } = require('../config/multer');
const { validate } = require('../middleware/validation');

// Validation rules
const createClaimValidation = [
    body('item_id').isInt().withMessage('Item ID is required'),
    body('item_type').isIn(['lost', 'found']).withMessage('Item type must be lost or found'),
    body('reason').notEmpty().withMessage('Reason is required'),
    body('brand').optional().isString(),
    body('color').optional().isString(),
    body('serial_number').optional().isString(),
    body('unique_marks').optional().isString()
];

const updateClaimValidation = [
    body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
    body('admin_notes').optional().isString()
];

// =============================================
// CLAIM ROUTES
// =============================================

// Submit a claim (Student only)
router.post(
    '/',
    protect,
    uploadSingle('proof_image'),
    createClaimValidation,
    validate,
    claimController.createClaim
);

// Get user's claims (Student) or all claims (Admin)
router.get('/', protect, claimController.getClaims);

// Get single claim
router.get('/:id', protect, claimController.getClaimById);

// Update claim status (Admin only)
router.put(
    '/:id',
    protect,
    authorize('admin'),
    uploadSingle('proof_image'),
    updateClaimValidation,
    validate,
    claimController.updateClaimStatus
);

// Delete claim (Admin only)
router.delete('/:id', protect, authorize('admin'), claimController.deleteClaim);

module.exports = router;
