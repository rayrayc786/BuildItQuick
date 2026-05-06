const mongoose = require('mongoose');
require('dotenv').config();
const dns = require('dns');
// Set DNS servers to bypass potential local resolution issues
dns.setServers(['8.8.8.8', '8.8.4.4']);
const Offer = require('../models/Offer');

const offers = [
  {
    title: "Wooden Material Mega Discount",
    description: "Purchase of Rs. 1,50,000 or more from Wooden Material leads to Rs. 1,000 off and Free Delivery",
    discount: "Rs. 1,000 Off",
    discountAmount: 1000,
    offerType: 'category',
    categoryName: 'Wooden Material',
    minAmount: 150000,
    freeDelivery: true,
    isActive: true
  },
  {
    title: "Hettich Brand Offer",
    description: "Purchase of Hettich Products worth Rs. 50,000 or above leads to Rs. 1,000 off and Free Delivery",
    discount: "Rs. 1,000 Off",
    discountAmount: 1000,
    offerType: 'brand',
    brandName: 'Hettich',
    minAmount: 50000,
    freeDelivery: true,
    isActive: true
  },
  {
    title: "Ebco Brand Offer",
    description: "Purchase of Ebco Products worth Rs. 60,000 or above leads to Rs. 1,500 off and Free Delivery",
    discount: "Rs. 1,500 Off",
    discountAmount: 1500,
    offerType: 'brand',
    brandName: 'Ebco',
    minAmount: 60000,
    freeDelivery: true,
    isActive: true
  },
  {
    title: "INOX Brand Offer",
    description: "Purchase of INOX Products worth Rs. 55,000 or above leads to Rs. 2,000 off and Free Delivery",
    discount: "Rs. 2,000 Off",
    discountAmount: 2000,
    offerType: 'brand',
    brandName: 'INOX',
    minAmount: 55000,
    freeDelivery: true,
    isActive: true
  },
  {
    title: "Paint Starter Kit Free",
    description: "Purchase of 5 ltr (or more) Paint Bucket get a paint starter kit free.",
    discount: "Free Starter Kit",
    offerType: 'product',
    rewardItem: 'Paint starter kit',
    isActive: true
    // Special logic for "5 ltr or more" will be hardcoded for now or we can use a more complex rule
  },
  {
    title: "Polycab Brand Offer",
    description: "Purchase of Polycab products worth Rs. 50,000 or more leads to Rs. 1,300 off and delivery free",
    discount: "Rs. 1,300 Off",
    discountAmount: 1300,
    offerType: 'brand',
    brandName: 'Polycab',
    minAmount: 50000,
    freeDelivery: true,
    isActive: true
  },
  {
    title: "Loyalty Reward: Chimney & Hob Free",
    description: "On purchase of Rs. 5,00,000 or more within 45 days get a Branded Chimney and a Branded 4 Burner Hob free.",
    discount: "Free Chimney & Hob",
    offerType: 'accumulated',
    minAmount: 500000,
    validityDays: 45,
    rewardItem: 'Branded Chimney & 4 Burner Hob',
    isActive: true
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Offer.deleteMany({ offerType: { $in: ['brand', 'category', 'product', 'accumulated'] } });
    console.log('Cleared existing rule-based offers');

    await Offer.insertMany(offers);
    console.log('Inserted new offers');

    mongoose.connection.close();
  } catch (err) {
    console.error('Seed error:', err);
  }
}

seed();
