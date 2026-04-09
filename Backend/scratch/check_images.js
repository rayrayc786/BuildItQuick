const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');

async function checkImages() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');
  
  const products = await Product.find({}).limit(1);
  products.forEach(p => {
    console.log('Sample Product:', JSON.stringify(p, null, 2));
  });
  
  const count = await Product.countDocuments({
    $or: [
      { imageUrl: /unsplash/ },
      { imageUrl: null },
      { imageUrl: '' }
    ]
  });
  console.log(`Total products with placeholder/no image: ${count}`);

  process.exit(0);
}

checkImages();
