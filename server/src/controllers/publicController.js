const { asyncHandler } = require('../middleware/errorHandler');

// Minimal public controller — extend as needed (QR endpoints, public asset view, etc.)
const index = asyncHandler(async (req, res) => {
  res.json({ message: 'Public API is available' });
});

module.exports = { index };
