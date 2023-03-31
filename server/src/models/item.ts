import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

interface Item extends mongoose.Document {
  id: string;
  type: string;
  hash: string;
  filename: string;
  created: number;
  path: string;
  thumbnailPath: string;
  height: number;
  width: number;
  duration: number;
}

interface ItemModel extends mongoose.Model<Item> {
  findOrCreate(
    query: Record<string, unknown>,
    data: Record<string, unknown>
  ): Promise<Item>;
  updateOrCreate(
    query: Record<string, unknown>,
    data: Record<string, unknown>
  ): Promise<Item>;
}

const itemSchema = new mongoose.Schema<Item, ItemModel>({
  id: { type: String, required: true, default: uuidv4 },
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
 * @param {Record<string, unknown>} query
 * @param {Record<string, unknown>} data
 * @returns {Item}
 */
itemSchema.statics.findOrCreate = async (
  query: Record<string, unknown>,
  data: Record<string, unknown>
): Promise<Item> => {
  const content = data ?? query;

  const item = await Item.findOne(query);

  return item || new Item(content).save();
};

/**
 * Create item or update existing one.
 * Not using findOneAndUpdate() for lack of validation.
 *
 * @param {Record<string, unknown>} query
 * @param {Record<string, unknown>} data
 * @returns {Item}
 */
itemSchema.statics.updateOrCreate = async (
  query: Record<string, unknown>,
  data: Record<string, unknown>
): Promise<Item> => {
  const content = { ...data, ...query };

  const item = await Item.findOne(query);

  if (!item) {
    return new Item(content).save();
  }

  Object.assign(item, data);

  return item.save();
};

const Item = mongoose.model<Item, ItemModel>('Item', itemSchema);

export default Item;
