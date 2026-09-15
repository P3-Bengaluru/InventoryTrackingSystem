const { asyncHandler } = require('../middleware/errorHandler');
const categoryService = require('../services/categoryService');

const tree = asyncHandler(async (req, res) => {
  const data = await categoryService.getTree();
  res.json({ data });
});

const get = asyncHandler(async (req, res) => {
  const item = await categoryService.getById(req.params.id);
  res.json(item);
});

const children = asyncHandler(async (req, res) => {
  const items = await categoryService.getChildren(req.params.id);
  res.json({ data: items });
});

const create = asyncHandler(async (req, res) => {
  const created = await categoryService.create(req.body, req);
  res.status(201).json(created);
});

const update = asyncHandler(async (req, res) => {
  const updated = await categoryService.update(req.params.id, req.body, req);
  res.json(updated);
});

const deactivate = asyncHandler(async (req, res) => {
  const result = await categoryService.deactivate(req.params.id, req);
  res.json(result);
});

module.exports = { tree, get, children, create, update, deactivate };
