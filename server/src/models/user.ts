import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const saltRounds = 10;

interface User {
  id: string;
  username: string;
  password: string;
  token: string;
  refreshToken: string[];
  isAdmin: boolean;
}

interface UserMethods extends User {
  validatePassword(password: string): Promise<boolean>;
}

interface UserModel
  extends mongoose.Model<User, mongoose.Document, UserMethods> {
  hashPassword(password: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<User, UserModel, UserMethods>({
  id: { type: String, required: true, default: uuidv4 },
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
 * @returns {Promise<string>}
 */
userSchema.static('hashPassword', async function hasher(password: string) {
  return await bcrypt.hash(password, saltRounds);
});

/**
 * Validate password
 *
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.method('validatePassword', async function (password: string) {
  if (!password || !this.password) {
    return false;
  }

  return await bcrypt.compare(password, this.password);
});

// Create a model from the schema and make it publicly available
const User = mongoose.model<User, UserModel>('User', userSchema);

export default User;
