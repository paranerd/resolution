const mongoose = require('mongoose');
const uuid = require('uuid');

let Item;

const ItemSchema = new mongoose.Schema({
  id: { type: String, required: true, default: uuid.v4 },
  type: { type: String, required: true },
  hash: { type: String, required: true },
  filename: { type: String, required: true },
  created: { type: Number, default: Date.now },
  path: { type: String, required: true },
  thumbnailPath: { type: String },
  height: { type: Number, required: true },
  width: { type: Number, required: true },
  duration: { type: Number },
});

/**
 * Return Item; create if not exists.
 *
 * @param {*} query
 * @param {*} data
 * @returns {Item}
 */
ItemSchema.statics.findOrCreate = async (query, data) => {
  const content = data || query;

  const item = await Item.findOne(query);

  return item || new Item(content).save();
};

/**
 * Create item or update existing one.
 * Not using findOneAndUpdate() for lack of validation.
 *
 * @param {*} query
 * @param {*} data
 * @returns {Item}
 */
ItemSchema.statics.updateOrCreate = async (query, data) => {
  const content = { ...data, ...query };

  const item = await Item.findOne(query);

  if (!item) {
    return new Item(content).save();
  }

  Object.assign(item, data);

  return item.save();
};

Item = mongoose.model('Item', ItemSchema);
module.exports = Item;
