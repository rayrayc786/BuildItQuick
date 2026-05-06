const { calculateOrderTotals } = require('../services/orderService');
const Product = require('../models/Product');
const Settings = require('../models/Settings');
const Offer = require('../models/Offer');
const Order = require('../models/Order');

/**
 * Calculate cart summary using backend logic
 * This ensures consistency between web/mobile and checkout.
 */
exports.calculateCartSummary = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    // 1. Hydrate products
    const hydratedItems = await Promise.all(items.map(async (item) => {
      const product = await Product.findById(item.productId || item.product);
      if (!product) return null;

      // Determine the price based on variant or base product
      let unitPrice = product.price;
      let taxRate = product.gst || 18;

      if (item.selectedVariant) {
        const variant = product.variants.find(v => v.name === item.selectedVariant);
        if (variant && variant.pricing) {
          unitPrice = variant.pricing.salePrice || variant.pricing.mrp || product.price;
          taxRate = variant.pricing.gst || product.gst || 18;
        }
      }

      return {
        ...item,
        product,
        unitPrice,
        taxRate
      };
    }));

    // Filter out nulls (invalid products)
    const validItems = hydratedItems.filter(item => item !== null);

    // 2. Fetch settings and offers
    const settings = await Settings.findOne();
    const offers = await Offer.find({ isActive: true });

    // 3. Check if first order (if user is logged in)
    let isFirstOrder = false;
    if (req.user && req.user.id) {
      const pastOrdersCount = await Order.countDocuments({ 
        userId: req.user.id, 
        status: { $nin: ['Cancelled'] } 
      });
      isFirstOrder = (pastOrdersCount === 0);
    }

    // 4. Calculate totals
    const summary = calculateOrderTotals(validItems, settings, offers, { isFirstOrder });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Cart Calculation Error:', error);
    res.status(500).json({ message: 'Internal server error during cart calculation' });
  }
};
