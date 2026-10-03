const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  action: { type: String, enum: ['add', 'pay'], required: true },
  amount: { type: Number, required: true },
  dateTime: { type: String, required: true }
});

const PersonSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['deen', 'iowe'], required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  isStarred: { type: Boolean, default: false },
  history: [HistorySchema]
});

module.exports = mongoose.model('Person', PersonSchema);
