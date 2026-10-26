const mongoose = require('mongoose');
const ProductSchema = new mongoose.Schema({
  datasetId: { type: Number, unique: true, sparse: true, index: true },
  name: { type: String, required: true, trim: true },
  normalizedName: { type: String, required: true, index: true },
  brand: { type: String, default: '' },
  category: { type: String, required: true, index: true },
  description: { type: String, default: '' },
  price: { type: Number, default: null }, currency: { type: String, default: 'INR' },
  priceUnit: { type: String, default: '' }, priceIsEstimate: { type: Boolean, default: false },
  image: { type: String, default: '' }, source: { type: String, enum: ['dataset','api','user'], default: 'dataset', index: true },
  externalId: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
ProductSchema.index({ normalizedName: 1, category: 1 });
module.exports = mongoose.model('Product', ProductSchema);
