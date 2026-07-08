// routes/lostItemRoutes.js
const express = require('express');
const router = express.Router();
const lostItemController = require('../controllers/lostItemController');
const { protect } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const { validateLostItem, validateUpdateLostItem, validateSearch, validate } = require('../middleware/validation');

router.get('/', validateSearch, validate, lostItemController.getAllLostItems);
router.get('/:id', lostItemController.getLostItemById);

// Create lost item with image upload and validation
router.post(
    '/', 
    protect, 
    uploadSingle('image'), 
    validateLostItem, 
    validate, 
    lostItemController.createLostItem
);

router.put(
    '/:id',
    protect,
    uploadSingle('image'),
    validateUpdateLostItem,
    validate,
    lostItemController.updateLostItem
);

router.delete('/:id', protect, lostItemController.deleteLostItem);

module.exports = router;
