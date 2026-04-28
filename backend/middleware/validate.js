const { validationResult } = require('express-validator');

/**
 * Middleware: validate
 * Runs after express-validator checks and returns errors if any
 * Usage: add this after your validator array in route definitions
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

// Export as both named and default so routes can use either:
// const { validate } = require('../middleware/validate')
// const validate = require('../middleware/validate')
module.exports = { validate };
module.exports.default = validate;
