const mongoose = require('mongoose');
const uuid = require('uuid');

const ItemSchema = new mongoose.Schema({
  id: String,
  title: { type: String, default: '' },
  created: { type: Number, default: Date.now() },
  modified: { type: Number, default: Date.now() },
  path: { type: String, required: true },
  height: { type: Number, required: true },
  width: { type: Number, required: true },
  orientation: { type: Number, required: true },
  exif: {
    dateTimeOriginal: { type: String },
  },
});

const Item = mongoose.model('Item', ItemSchema);

ItemSchema.pre('save', () => {
  this.id = this.id || uuid.v4();
  this.modified = this.modified || this.created;
});

ItemSchema.statics.findOrCreate = async (query, data) => {
  const content = data || query;

  const item = await Item.findOne(query);

  return item || new Item(content).save();
};

module.exports = Item;
