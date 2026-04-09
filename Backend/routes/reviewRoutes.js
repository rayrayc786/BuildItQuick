const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');

// Public/User routes
router.get('/product/:productId', reviewController.getProductReviews);
router.post('/', auth(['End User', 'Admin', 'Supplier', 'Rider']), reviewController.submitReview);

// Admin routes
router.get('/admin', auth(['Admin']), reviewController.getAllReviews);
router.put('/admin/:id/status', auth(['Admin']), reviewController.updateReviewStatus);
router.delete('/admin/:id', auth(['Admin']), reviewController.deleteReview);

module.exports = router;
