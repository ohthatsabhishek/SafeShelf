const mongoose = require('mongoose');
const UserDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  inventory: { type: [mongoose.Schema.Types.Mixed], default: [] },
  shoppingList: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { timestamps: true, minimize: false });
module.exports = mongoose.model('UserData', UserDataSchema);
