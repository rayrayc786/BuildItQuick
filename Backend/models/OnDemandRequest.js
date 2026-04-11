const mongoose = require('mongoose');

const onDemandRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true }, // User's name
  phone: { type: String, required: true }, // User's phone
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  variantId: { type: String }, // Optional variant selection
  variantName: { type: String },
  quantity: { type: Number, required: true, default: 1 },
  requiredBy: { 
    type: String, 
    enum: ['Today', 'Tomorrow', 'Later'], 
    required: true,
    default: 'Today'
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Contacted', 'Fulfilled', 'Cancelled'], 
    default: 'Pending' 
  },
  address: { type: String } // Delivery address text
}, { timestamps: true });

module.exports = mongoose.model('OnDemandRequest', onDemandRequestSchema);
