const express = require('express');
const router = express.Router();
const onDemandController = require('../controllers/onDemandController');
const auth = require('../middleware/auth');

// Public/User routes
router.post('/', auth(), onDemandController.createRequest);
router.get('/my-requests', auth(), onDemandController.getMyRequests);
router.patch('/:id/revoke', auth(), onDemandController.revokeRequest);

// Admin routes
router.get('/', auth(['Admin']), onDemandController.getAllRequests);
router.patch('/:id/status', auth(['Admin']), onDemandController.updateStatus);
router.delete('/:id', auth(['Admin']), onDemandController.deleteRequest);

module.exports = router;
