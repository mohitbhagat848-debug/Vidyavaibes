const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT token for a user
 * @param {string} userId - The MongoDB user _id
 * @returns {string} signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = generateToken;
