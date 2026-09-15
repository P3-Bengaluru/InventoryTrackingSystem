const { asyncHandler } = require('../middleware/errorHandler');
const { paginate } = require('../utils/paginate');
const customerService = require('../services/customerService');

const list = asyncHandler(async (req, res) => {
  const query = await customerService.getAll(req.query);
  const result = await paginate(query, req);
  res.json(result);
});

const get = asyncHandler(async (req, res) => {
  const item = await customerService.getById(req.params.id);
  res.json(item);
});

const getAssets = asyncHandler(async (req, res) => {
  const assets = await customerService.getAssets(req.params.id);
  res.json({ data: assets });
});

const create = asyncHandler(async (req, res) => {
  const created = await customerService.create(req.body, req);
  res.status(201).json(created);
});

const update = asyncHandler(async (req, res) => {
  const updated = await customerService.update(req.params.id, req.body, req);
  res.json(updated);
});

const deactivate = asyncHandler(async (req, res) => {
  const result = await customerService.deactivate(req.params.id, req);
  res.json(result);
});

module.exports = { list, get, getAssets, create, update, deactivate };
