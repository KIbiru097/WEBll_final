const express = require('express');
const router = express.Router();
const foundItemController = require('../controllers/foundItemController');
const { protect } = require('../middleware/auth');
const { uploadSingle } = require('../config/multer');
const { validateFoundItem, validateUpdateFoundItem, validateSearch, validate } = require('../middleware/validation');

router.get('/', validateSearch, validate, foundItemController.getAllFoundItems);
router.get('/:id', foundItemController.getFoundItemById);
router.post('/', protect, uploadSingle('image'), validateFoundItem, validate, foundItemController.createFoundItem);
router.put('/:id', protect, uploadSingle('image'), validateUpdateFoundItem, validate, foundItemController.updateFoundItem);
router.delete('/:id', protect, foundItemController.deleteFoundItem);

module.exports = router;
