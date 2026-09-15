const { asyncHandler } = require('../middleware/errorHandler');
const settingsService = require('../services/settingsService');

const list = asyncHandler(async (req, res) => {
  const data = await settingsService.getAll();
  res.json({ data });
});

const publicList = asyncHandler(async (req, res) => {
  const data = await settingsService.getPublic();
  res.json({ data });
});

const get = asyncHandler(async (req, res) => {
  const value = await settingsService.get(req.params.key);
  res.json({ value });
});

const update = asyncHandler(async (req, res) => {
  const updated = await settingsService.update(req.params.key, req.body.value, req.user.id);
  res.json(updated);
});

module.exports = { list, publicList, get, update };
