const User = require('../models/user');
const auth = require('../middleware/auth');

/**
 * Set up admin user.
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
async function setup(req, res) {
  // Read request body
  const { username, password1, password2 } = req.body;

  if (!password1 || password1 !== password2) {
    res.status(400).json({ msg: 'Passwords do not match' });
    return;
  }

  // Check if already set up
  const userCount = await User.countDocuments();

  if (userCount) {
    res.status(400).json({ msg: 'Already set up' });
  }

  try {
    // Create user
    const user = await new User({
      username,
      password: await User.hashPassword(password1),
      isAdmin: true,
    });

    // Save user
    await user.save();

    // Generate an access token
    const token = auth.generateToken({
      username: user.username,
      isAdmin: user.isAdmin,
    });
    const refreshToken = auth.generateRefreshToken({
      username: user.username,
      refresh: true,
    });

    // Return to client
    res.json({
      username: user.username,
      isAdmin: user.isAdmin,
      token,
      refreshToken,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: 'An error occurred' });
  }
}

/**
 * Login user.
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
async function login(req, res) {
  // Read username and password from request body
  const { username, password } = req.body;

  // Find user
  const user = await User.findOne({ username });

  // Check for existance and password
  if (user && (await user.validatePassword(password))) {
    // Generate new tokens
    const token = auth.generateToken({
      username: user.username,
      isAdmin: user.isAdmin,
    });
    const refreshToken = auth.generateRefreshToken({
      username: user.username,
      refresh: true,
    });

    user.refreshToken.push(refreshToken);
    await user.save();

    res.json({
      username: user.username,
      isAdmin: user.isAdmin,
      token,
      refreshToken,
    });
  } else {
    res.status(403).json({ msg: 'Invalid username or password' });
  }
}

/**
 * Logout by removing refresh token from user.
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
async function logout(req, res) {
  if (!req.tokenDecoded || !req.tokenDecoded.refresh) {
    res.status(401).json({ msg: 'Unauthorized' });
    return;
  }

  const user = await User.findOne({ refreshToken: req.token });

  if (user) {
    await user.updateOne({ $pullAll: { refreshToken: [req.token] } });
    await user.save();

    res.json({});
  } else {
    // User not found
    res.status(403).json({ msg: 'Invalid request' });
  }
}

/**
 * Renew refresh token.
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
async function refresh(req, res) {
  if (!req.tokenDecoded || !req.tokenDecoded.refresh) {
    res.status(401).json({ msg: 'Unauthorized' });
    return;
  }

  const user = await User.findOne({ refreshToken: req.token });

  if (user) {
    // Generate new tokens
    const token = auth.generateToken({
      username: user.username,
      isAdmin: user.isAdmin,
    });
    const refreshToken = auth.generateRefreshToken({
      username: user.username,
      refresh: true,
    });

    await user.updateOne({ $pullAll: { refreshToken: [req.token] } });
    user.refreshToken.push(refreshToken);

    await user.save();

    res.json({
      username: user.username,
      isAdmin: user.isAdmin,
      token,
      refreshToken,
    });
  } else {
    // User not found
    res.status(403).json({ msg: 'Invalid request' });
  }
}

module.exports = {
  setup,
  login,
  logout,
  refresh,
};
