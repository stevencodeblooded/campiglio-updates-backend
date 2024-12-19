const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    login,
    signup,
    getDashboardStats
} = require('../controllers/adminController');
const {
    createVenue,
    updateVenue,
    deleteVenue
} = require('../controllers/venueController');

// Create a new router
const router = express.Router();

// Define routes without any middleware
router.route('/signup')
    .post(signup);

router.route('/login')
    .post(login);

// Protected routes
router.route('/dashboard-stats')
    .get(protect, getDashboardStats);

router.route('/venues')
    .post(protect, restrictTo('admin', 'super-admin'), createVenue);

router.route('/venues/:id')
    .patch(protect, restrictTo('admin', 'super-admin'), updateVenue)
    .delete(protect, restrictTo('admin', 'super-admin'), deleteVenue);

module.exports = router;