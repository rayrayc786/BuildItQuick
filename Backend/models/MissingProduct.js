const mongoose = require('mongoose');

const missingProductSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, default: 'Unknown User' },
  userPhone: { type: String },
  userEmail: { type: String },
  searchTerm: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Reviewed', 'Added'], 
    default: 'Pending' 
  }
}, { timestamps: true });

module.exports = mongoose.model('MissingProduct', missingProductSchema);
