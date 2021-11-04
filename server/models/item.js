const mongoose = require('mongoose');
const uuid = require('uuid');

let ItemSchema = new mongoose.Schema({
    id: String,
    title: {type: String, default: ""},
    created: {type: Number, default: Date.now()},
    modified: {type: Number, default: Date.now()},
    path: {type: String, required: true},
    height: {type: Number, required: true},
    width: {type: Number, required: true},
    orientation: {type: Number, required: true},
    exif: {
        dateTimeOriginal: {type: String},
    },
});

ItemSchema.pre('save', function() {
    this.id = this.id || uuid.v4();
    this.modified = this.modified || this.created;
});

ItemSchema.statics.findOrCreate = async (query, data) => {
	data = (data) ? data : query;

	const item = await Item.findOne(query);

	return item || await new Item(data).save();
}

// Create a model from the schema and make it publicly available
const Item = mongoose.model('Item', ItemSchema);
module.exports = Item;
