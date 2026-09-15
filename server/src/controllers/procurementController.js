const { asyncHandler } = require('../middleware/errorHandler');
const { paginate } = require('../utils/paginate');
const procurementService = require('../services/procurementService');

const search = asyncHandler(async (req, res) => {
  const results = await procurementService.searchInventory(req.body || {});
  res.json(results);
});

const list = asyncHandler(async (req, res) => {
  const query = await procurementService.getAll(req.query, req.user);
  const result = await paginate(query, req);
  res.json(result);
});

const get = asyncHandler(async (req, res) => {
  const item = await procurementService.getById(req.params.id);
  res.json(item);
});

const create = asyncHandler(async (req, res) => {
  const created = await procurementService.create(req.body, req);
  res.status(201).json(created);
});

const submit = asyncHandler(async (req, res) => {
  const updated = await procurementService.submit(req.params.id, req);
  res.json(updated);
});

const action = asyncHandler(async (req, res) => {
  const updated = await procurementService.action(req.params.id, req.body, req);
  res.json(updated);
});

const markOrdered = asyncHandler(async (req, res) => {
  const updated = await procurementService.markOrdered(req.params.id, req.body, req);
  res.json(updated);
});

const markReceived = asyncHandler(async (req, res) => {
  const updated = await procurementService.markReceived(req.params.id, req.body, req);
  res.json(updated);
});

module.exports = { search, list, get, create, submit, action, markOrdered, markReceived };
