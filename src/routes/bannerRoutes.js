const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/', bannerController.getAllBanners);

// Protected routes
router.use(protect);
router.post('/', bannerController.createBanner);
router.patch('/:id', bannerController.updateBanner);
router.delete('/:id', bannerController.deleteBanner);
router.patch('/reorder', bannerController.reorderBanners);

module.exports = router;