const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Brand = require('../models/Brand');
const Unit = require('../models/Unit');
const SubVariantTitle = require('../models/SubVariantTitle');
const DeliveryTime = require('../models/DeliveryTime');
const FooterLink = require('../models/FooterLink');
const Offer = require('../models/Offer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

exports.getDashboardStats = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('userId', 'fullName').sort({ createdAt: -1 });
    const totalOrders = orders.length;
    const gmv = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const activeDeliveries = orders.filter(o => ['picking', 'dispatched', 'Order on way'].includes(o.status)).length;
    const lateOrders = orders.filter(o => o.status === 'pending' && (new Date() - o.createdAt) > 3600000).length;

    const hourlyGMV = [{ time: '10:00', amount: 450 }, { time: '15:00', amount: gmv }];
    
    // New stats
    const activeOrders = orders.filter(o => !['Order Delivered', 'Cancelled'].includes(o.status)).length;
    const activeSuppliers = await Supplier.countDocuments({ isActive: true });
    const activeCategories = await Category.countDocuments({ isActive: true });
    
    // Mock delivery time for now, or calculate from delivered orders
    const avgDeliveryTime = '25 mins';

    // Group revenue by day for current week mock
    const revenueData = [
      { day: 'S', revenue: 10000 },
      { day: 'M', revenue: 11000 },
      { day: 'T', revenue: 12000 },
      { day: 'W', revenue: 13000 },
      { day: 'T', revenue: 16000 },
      { day: 'F', revenue: gmv > 0 ? gmv : 14000 },
      { day: 'S', revenue: 15000 },
    ];

    const ordersStatsData = [
      { week: 'Mar\'25 W1', orders: 25, fulfilled: 25, delayed: 5 },
      { week: 'Mar\'25 W2', orders: 32, fulfilled: 30, delayed: 2 },
      { week: 'Mar\'25 W3', orders: 16, fulfilled: 16, delayed: 5 },
      { week: 'Mar\'25 W4', orders: totalOrders > 0 ? totalOrders : 20, fulfilled: orders.filter(o=>o.status==='Order Delivered').length, delayed: lateOrders },
    ];

    // Format top 5 recent orders for the B2B Orders list
    const recentOrders = orders.slice(0, 5).map(o => {
      const name = o.userId && o.userId.fullName ? o.userId.fullName : 'Guest or Unknown';
      const codeArr = name.split(' ');
      const code = codeArr.length > 1 ? (codeArr[0][0] + codeArr[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
      
      return {
        id: o._id,
        name: name,
        date: new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        amount: '+ ' + o.totalAmount.toLocaleString('en-IN'),
        code: code,
        status: o.status
      };
    });

    res.json({ 
      gmv, activeDeliveries, lateOrders, totalOrders, hourlyGMV,
      activeOrders, activeSuppliers, activeCategories, avgDeliveryTime,
      revenueData, ordersStatsData, recentOrders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFleetStatus = async (req, res) => {
  try {
    res.json(await User.find({ role: 'Rider' }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.bulkUploadProducts = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded.');
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    const extracted = [], skipped = [], seenSkus = new Set();
    const masterData = { categories: new Set(), subCategories: new Map(), brands: new Set(), variantTitles: new Set(), deliveryTimes: new Set() };

    let availableImages = [];
    try {
      const imgDir = path.join(__dirname, '..', 'public', 'images');
      if (fs.existsSync(imgDir)) {
        availableImages = fs.readdirSync(imgDir);
      }
    } catch(err) {
      console.error('Error reading images directory', err);
    }

    data.forEach((item, index) => {
      const sku = String(item['Product Code'] || '').trim();
      seenSkus.add(sku);

      const cat = String(item['Category'] || '').trim();
      const subCat = String(item['Sub Category'] || '').trim();
      if (cat) {
        masterData.categories.add(cat);
        if (subCat) {
          if (!masterData.subCategories.has(cat)) masterData.subCategories.set(cat, new Set());
          masterData.subCategories.get(cat).add(subCat);
        }
      }
      if (item['Brand']) masterData.brands.add(String(item['Brand']).trim());
      if (item['Delivery Time']) masterData.deliveryTimes.add(String(item['Delivery Time']).trim());

      const subVariants = [];
      if (item['Size']) {
        masterData.variantTitles.add(String(item['Size']).trim());
        if (item['Sub Variant Value']) subVariants.push({ title: String(item['Size']), value: String(item['Sub Variant Value']) });
      }
      
      const titles = Object.keys(item).filter(k => k.startsWith('Sub Variant Title')).sort();
      const values = Object.keys(item).filter(k => k.startsWith('Sub Variant Value')).filter(k => k !== 'Sub Variant Value').sort();
      titles.forEach((t, i) => {
        if (item[t]) {
          masterData.variantTitles.add(String(item[t]).trim());
          if (values[i] && item[values[i]]) subVariants.push({ title: String(item[t]), value: String(item[values[i]]) });
        }
      });

      const imageKey = Object.keys(item).find(k => {
        const lk = k.trim().toLowerCase();
        return lk === 'images' || lk === 'image' || lk === 'product images' || lk.includes('images left');
      });
      const imageValue = imageKey && item[imageKey] ? String(item[imageKey]).trim() : '';
      const rawImageNames = imageValue.split(',').map(s => s.trim()).filter(Boolean);
      

      const images = rawImageNames.map(name => {
        if (name.indexOf('://') !== -1 || name.startsWith('data:')) return name;
        if (name.startsWith('/')) return name;
        
        const matchedImage = availableImages.find(f => {
          const fileNameWithoutExt = f.substring(0, f.lastIndexOf('.'));
          return f.toLowerCase().includes(name.toLowerCase()) || (fileNameWithoutExt && fileNameWithoutExt.toLowerCase() === name.toLowerCase());
        });
        
        if (matchedImage) {
          return `/images/${matchedImage}`;
        }
        return `/images/${name}`;
      });

      const mrpRaw = item['MRP \n(Incl GST)'] || item['MRP \r\n(Incl GST)'] || item['MRP'] || 0;
      const mrp = typeof mrpRaw === 'string' ? parseFloat(mrpRaw.replace(/,/g, '')) : parseFloat(mrpRaw);

      extracted.push({
        name: item['Product Name'] || 'Unnamed Product', sku, 
        category: cat, subCategory: subCat, brand: item['Brand'], size: item['Size'],
        productCode: sku, mrp: mrp || 0,
        salePrice: parseFloat(item['Sale Price']) || 0, price: parseFloat(item['Sale Price']) || 0,
        deliveryTime: item['Delivery Time'], subVariants, images, imageNames: rawImageNames,
        imageUrl: images.length > 0 ? images[0] : undefined, // Let default handle if truly empty, but we try harder now
        unitType: 'individual', unitLabel: 'unit', isActive: true
      });
    });

    // Sync Master Data
    await Promise.all(Array.from(masterData.categories).map(name => Category.updateOne({ name }, { $setOnInsert: { name, isActive: true } }, { upsert: true })));
    const catMap = new Map((await Category.find({ name: { $in: Array.from(masterData.categories) } })).map(c => [c.name, c._id]));
    
    const subCatOps = [];
    masterData.subCategories.forEach((subs, catName) => {
      const catId = catMap.get(catName);
      if (catId) subs.forEach(name => subCatOps.push(SubCategory.updateOne({ name, categoryId: catId }, { $setOnInsert: { name, categoryId: catId, isActive: true } }, { upsert: true })));
    });
    
    await Promise.all([
      ...subCatOps,
      ...Array.from(masterData.brands).map(name => Brand.updateOne({ name }, { $setOnInsert: { name, isActive: true } }, { upsert: true })),
      ...Array.from(masterData.variantTitles).map(name => SubVariantTitle.updateOne({ name }, { $setOnInsert: { name, isActive: true } }, { upsert: true })),
      ...Array.from(masterData.deliveryTimes).map(name => DeliveryTime.updateOne({ name }, { $setOnInsert: { name, isActive: true } }, { upsert: true }))
    ]);

    // Always insert new products as separate entries (allow duplicates as requested)
    const bulkOps = extracted.map(p => ({ insertOne: { document: p } }));
    const result = await Product.bulkWrite(bulkOps);
    res.json({ message: 'Upload complete', summary: { totalRows: data.length, extracted: extracted.length, skipped: skipped.length, matched: result.matchedCount, upserted: result.upsertedCount, inserted: result.insertedCount }, skippedDetails: skipped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createHandlers = (Model, name) => ({
  getAll: async (req, res) => { try { res.json(await Model.find({}).sort({ name: 1 })); } catch (err) { res.status(500).json({ error: err.message }); } },
  create: async (req, res) => { try { const d = new Model(req.body); await d.save(); res.status(201).json(d); } catch (err) { res.status(500).json({ error: err.message }); } },
  update: async (req, res) => { try { res.json(await Model.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (err) { res.status(500).json({ error: err.message }); } },
  delete: async (req, res) => { try { await Model.findByIdAndDelete(req.params.id); res.json({ message: `${name} deleted` }); } catch (err) { res.status(500).json({ error: err.message }); } }
});

const sh = createHandlers(Supplier, 'Supplier');
exports.getAllSuppliers = sh.getAll; exports.createSupplier = sh.create; exports.updateSupplier = sh.update; exports.deleteSupplier = sh.delete;

const uh = createHandlers(User, 'User');
exports.getAllUsers = uh.getAll;
exports.createUser = uh.create;
exports.updateUser = uh.update;
exports.deleteUser = uh.delete;
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.id }).populate('items.productId');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const ch = createHandlers(Category, 'Category');
exports.getAllCategories = ch.getAll; exports.createCategory = ch.create; exports.updateCategory = ch.update; exports.deleteCategory = ch.delete;

const sch = createHandlers(SubCategory, 'SubCategory');
exports.getAllSubCategories = async (req, res) => {
  try {
    let filter = {};
    if (req.query.categoryId) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.query.categoryId);
      if (isObjectId) {
        filter.categoryId = req.query.categoryId;
      } else {
        // Find category by name if it's not an ID
        const cat = await Category.findOne({ name: req.query.categoryId });
        if (cat) filter.categoryId = cat._id;
        else return res.json([]); // Not found
      }
    }
    res.json(await SubCategory.find(filter).populate('categoryId parentSubCategoryId').sort({ name: 1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createSubCategory = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.parentSubCategoryId || data.parentSubCategoryId === "") {
      data.parentSubCategoryId = null;
    }
    const d = new SubCategory(data);
    await d.save();
    res.status(201).json(d);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSubCategory = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.parentSubCategoryId || data.parentSubCategoryId === "") {
      data.parentSubCategoryId = null;
    }
    const d = await SubCategory.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(d);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSubCategory = sch.delete;

const bh = createHandlers(Brand, 'Brand');
exports.getAllBrands = bh.getAll; exports.createBrand = bh.create; exports.updateBrand = bh.update; exports.deleteBrand = bh.delete;

const uuh = createHandlers(Unit, 'Unit');
exports.getAllUnits = uuh.getAll; exports.createUnit = uuh.create; exports.updateUnit = uuh.update; exports.deleteUnit = uuh.delete;

const vth = createHandlers(SubVariantTitle, 'SubVariantTitle');
exports.getAllVariantTitles = vth.getAll; exports.createVariantTitle = vth.create; exports.updateVariantTitle = vth.update; exports.deleteVariantTitle = vth.delete;

const dth = createHandlers(DeliveryTime, 'DeliveryTime');
exports.getAllDeliveryTimes = dth.getAll; exports.createDeliveryTime = dth.create; exports.updateDeliveryTime = dth.update; exports.deleteDeliveryTime = dth.delete;

const oh = createHandlers(Offer, 'Offer');
exports.getAllOffers = oh.getAll; exports.createOffer = oh.create; exports.updateOffer = oh.update; exports.deleteOffer = oh.delete;

const flh = createHandlers(FooterLink, 'FooterLink');
exports.getAllFooterLinks = flh.getAll; exports.createFooterLink = flh.create; exports.updateFooterLink = flh.update; exports.deleteFooterLink = flh.delete;

exports.createProduct = async (req, res) => { try { const p = new Product(req.body); await p.save(); res.status(201).json(p); } catch (err) { res.status(500).json({ error: err.message }); } };
exports.updateProduct = async (req, res) => { try { res.json(await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (err) { res.status(500).json({ error: err.message }); } };
exports.deleteProduct = async (req, res) => { try { await Product.findByIdAndDelete(req.params.id); res.json({ message: 'Product deleted' }); } catch (err) { res.status(500).json({ error: err.message }); } };
exports.clearAllProducts = async (req, res) => { try { const r = await Product.deleteMany({}); res.json({ message: `Deleted ${r.deletedCount} products.` }); } catch (err) { res.status(500).json({ error: err.message }); } };

exports.uploadProductImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const filename = `${Date.now()}-${req.file.originalname}`;
    const filepath = path.join(__dirname, '..', 'public', 'images', filename);
    
    // Ensure the images directory exists
    const dir = path.join(__dirname, '..', 'public', 'images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(filepath, req.file.buffer);
    res.json({ imageUrl: `/images/${filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
