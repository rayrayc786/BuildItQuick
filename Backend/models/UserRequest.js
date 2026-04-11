const mongoose = require('mongoose');

const userRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  imageUrl: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'User Contacted', 'Query Resolved', 'Converted to Order', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },
  isDeletedByUser: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('UserRequest', userRequestSchema);
