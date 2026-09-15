const { asyncHandler } = require('../middleware/errorHandler');
const { paginate } = require('../utils/paginate');
const supplierService = require('../services/supplierService');

const list = asyncHandler(async (req, res) => {
  const query = await supplierService.getAll(req.query);
  const result = await paginate(query, req);
  res.json(result);
});

const get = asyncHandler(async (req, res) => {
  const item = await supplierService.getById(req.params.id);
  res.json(item);
});

const create = asyncHandler(async (req, res) => {
  const created = await supplierService.create(req.body, req);
  res.status(201).json(created);
});

const update = asyncHandler(async (req, res) => {
  const updated = await supplierService.update(req.params.id, req.body, req);
  res.json(updated);
});

const deactivate = asyncHandler(async (req, res) => {
  const result = await supplierService.deactivate(req.params.id, req);
  res.json(result);
});

module.exports = { list, get, create, update, deactivate };
