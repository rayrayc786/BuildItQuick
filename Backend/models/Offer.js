const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  discount: { type: String }, // Display text like "Rs. 1,000 Off"
  discountAmount: { type: Number, default: 0 }, // Actual numeric discount
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true },
  link: { type: String }, // Optional: where it redirects to
  
  // Rule fields
  offerType: { 
    type: String, 
    enum: ['standard', 'brand', 'category', 'product', 'accumulated'],
    default: 'standard'
  },
  minAmount: { type: Number, default: 0 },
  brandName: { type: String },
  categoryName: { type: String },
  freeDelivery: { type: Boolean, default: false },
  rewardItem: { type: String }, // e.g. "Paint starter kit", "Branded Chimney"
  validityDays: { type: Number }, // for accumulated offers

  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  subCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' }]
}, { timestamps: true });

module.exports = mongoose.model('Offer', OfferSchema);
