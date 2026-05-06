const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

const { optionalAuth } = require('../middleware/auth');
// All calculations are POST because they depend on the cart state sent from client
router.post('/calculate', optionalAuth, cartController.calculateCartSummary);

module.exports = router;
