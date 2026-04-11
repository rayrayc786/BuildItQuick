const OnDemandRequest = require('../models/OnDemandRequest');

exports.createRequest = async (req, res) => {
  try {
    const { 
      productId, 
      productName, 
      variantId, 
      variantName, 
      quantity, 
      requiredBy, 
      address 
    } = req.body;

    const newRequest = new OnDemandRequest({
      userId: req.user.id,
      name: req.user.fullName || 'User',
      phone: req.user.phoneNumber,
      productId,
      productName,
      variantId: variantId || null,
      variantName: variantName || null,
      quantity: Number(quantity) || 1,
      requiredBy,
      address: address || ''
    });

    await newRequest.save();

    // Notify Admin via Socket
    const io = req.app.get('socketio');
    if (io) {
      io.of('/admin').emit('new-on-demand-request', newRequest);
    }

    res.status(201).json({ success: true, message: 'Request submitted successfully', request: newRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await OnDemandRequest.find()
      .populate('userId', 'fullName phoneNumber')
      .populate('productId', 'productName imageUrl')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await OnDemandRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!request) return res.status(404).json({ error: 'Request not found' });

    // Notify User and Admin via Socket
    const io = req.app.get('socketio');
    if (io) {
      const payload = { 
        requestId: request._id, 
        userId: request.userId,
        status 
      };
      io.of('/customer').emit('on-demand-status-update', payload);
      io.of('/admin').emit('on-demand-status-update', payload);
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const requests = await OnDemandRequest.find({ userId: req.user.id })
      .populate('productId', 'name images imageUrl')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.revokeRequest = async (req, res) => {
  try {
    const request = await OnDemandRequest.findOne({ _id: req.params.id, userId: req.user.id });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    if (['Ordered', 'Delivered'].includes(request.status)) {
      return res.status(400).json({ error: 'Cannot revoke an inquiry that is already being processed' });
    }

    request.status = 'Cancelled';
    await request.save();

    // Notify Admin and Customer
    const io = req.app.get('socketio');
    if (io) {
      const payload = { 
        requestId: request._id, 
        userId: request.userId,
        status: 'Cancelled' 
      };
      io.of('/admin').emit('on-demand-status-update', payload);
      io.of('/customer').emit('on-demand-status-update', payload);
    }

    res.json({ message: 'Inquiry revoked successfully', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    await OnDemandRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
