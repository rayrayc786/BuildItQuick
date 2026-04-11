const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const UserRequest = require('../models/UserRequest');
const User = require('../models/User');
const auth = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

router.post('/', async (req, res) => {
  try {
    const { name, phone, imageBase64 } = req.body;
    let { userId } = req.body;

    if (!name || !phone || !imageBase64) {
      return res.status(400).json({ error: 'Name, phone, and image are required.' });
    }

    // Try to get userId from token if not provided in body
    if (!userId && req.headers.authorization) {
      try {
        const authHeader = req.headers.authorization;
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey_matall');
        userId = decoded.id || decoded._id;
      } catch (e) {
        console.warn('Invalid token provided in UserRequest POST');
      }
    }

    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let imageUrl = '';
    
    if (matches && matches.length === 3) {
      const ext = matches[1].split('/')[1] === 'png' ? 'png' : 'jpeg';
      const buffer = Buffer.from(matches[2], 'base64');
      const filename = `ur_${Date.now()}.${ext}`;
      const uploadPath = path.join(__dirname, '..', 'public', 'images', 'user-requests');
      
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      fs.writeFileSync(path.join(uploadPath, filename), buffer);
      imageUrl = `/images/user-requests/${filename}`;
    } else {
      imageUrl = imageBase64;
    }

    const newRequest = new UserRequest({ 
      userId: userId || null,
      name, 
      phone, 
      imageUrl 
    });
    await newRequest.save();

    const io = req.app.get('socketio');
    if (io) {
      io.of('/admin').emit('new-user-request', newRequest);
    }

    res.status(201).json({ success: true, request: newRequest });
  } catch (error) {
    console.error('Error creating user request:', error);
    res.status(500).json({ error: 'Server error parsing and saving image.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const requests = await UserRequest.find({ isDeletedByUser: { $ne: true } }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user requests' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const request = await UserRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Attempt to delete physical file if it exists
    if (request.imageUrl && request.imageUrl.startsWith('/images/user-requests/')) {
        const filePath = path.join(__dirname, '..', 'public', request.imageUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    await UserRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

router.get('/my-requests', auth(), async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const requests = await UserRequest.find({ 
      userId, 
      isDeletedByUser: false 
    }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your requests' });
  }
});

router.patch('/:id/revoke', auth(), async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const request = await UserRequest.findOne({ _id: req.params.id, userId });
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found or unauthorized' });
    }

    request.isDeletedByUser = true;
    request.status = 'Cancelled';
    await request.save();

    const io = req.app.get('socketio');
    if (io) {
      io.of('/admin').emit('user-request-revoked', { id: request._id, status: 'Cancelled' });
    }

    res.json({ success: true, message: 'Request revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke request' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const request = await UserRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
