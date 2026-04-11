const mongoose = require('mongoose');

const PincodeMasterSchema = new mongoose.Schema({
  pincode: { type: String, required: true, trim: true },
  officeName: { type: String, trim: true },
  district: { type: String, trim: true },
  state: { type: String, trim: true },
  divisionName: { type: String, trim: true },
  regionName: { type: String, trim: true },
  circleName: { type: String, trim: true }
}, { timestamps: true });

PincodeMasterSchema.index({ pincode: 1 });
PincodeMasterSchema.index({ district: 1 });
PincodeMasterSchema.index({ officeName: 1 });

module.exports = mongoose.model('PincodeMaster', PincodeMasterSchema);
