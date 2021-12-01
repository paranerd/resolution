const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const uuid = require('uuid');

const saltRounds = 10;

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, default: uuid.v4 },
  username: String,
  password: String,
  token: String,
  refreshToken: [String],
  isAdmin: { type: Boolean, default: false },
});

/**
 * Generate hash
 *
 * @param {string} password
 * @returns {string}
 */
UserSchema.statics.hashPassword = async function hasher(password) {
  return bcrypt.hash(password, saltRounds);
};

/**
 * Validate password
 *
 * @param {string} password
 * @returns {boolean}
 */
UserSchema.methods.validatePassword = async function validator(password) {
  if (!password || !this.password) {
    return false;
  }

  return bcrypt.compare(password, this.password);
};

// Create a model from the schema and make it publicly available
const User = mongoose.model('User', UserSchema);
module.exports = User;
