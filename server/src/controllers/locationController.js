const { asyncHandler } = require('../middleware/errorHandler');
const locationService = require('../services/locationService');

const tree = asyncHandler(async (req, res) => {
  const data = await locationService.getTree();
  res.json({ data });
});

const byLevel = asyncHandler(async (req, res) => {
  const items = await locationService.getByLevel(parseInt(req.params.level, 10));
  res.json({ data: items });
});

const get = asyncHandler(async (req, res) => {
  const item = await locationService.getById(req.params.id);
  res.json(item);
});

const children = asyncHandler(async (req, res) => {
  const items = await locationService.getChildren(req.params.id);
  res.json({ data: items });
});

const create = asyncHandler(async (req, res) => {
  const created = await locationService.create(req.body, req);
  res.status(201).json(created);
});

const update = asyncHandler(async (req, res) => {
  const updated = await locationService.update(req.params.id, req.body, req);
  res.json(updated);
});

const deactivate = asyncHandler(async (req, res) => {
  const result = await locationService.deactivate(req.params.id, req);
  res.json(result);
});

module.exports = { tree, byLevel, get, children, create, update, deactivate };
