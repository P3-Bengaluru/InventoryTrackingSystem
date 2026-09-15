const { asyncHandler } = require('../middleware/errorHandler');
const { paginate } = require('../utils/paginate');
const assetService = require('../services/assetService');

const list = asyncHandler(async (req, res) => {
  const query = assetService.getAll(req.query);
  const result = await paginate(query, req);
  res.json(result);
});

const stats = asyncHandler(async (req, res) => {
  const stats = await assetService.getStats();
  res.json(stats);
});

const mine = asyncHandler(async (req, res) => {
  const assets = await assetService.getMine(req.user.id);
  res.json({ data: assets });
});

const get = asyncHandler(async (req, res) => {
  const asset = await assetService.getById(req.params.id);
  res.json(asset);
});

const create = asyncHandler(async (req, res) => {
  const asset = await assetService.create(req.body, req);
  res.status(201).json(asset);
});

const update = asyncHandler(async (req, res) => {
  const asset = await assetService.update(req.params.id, req.body, req);
  res.json(asset);
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const asset = await assetService.updateStatus(req.params.id, status, req);
  res.json(asset);
});

const retire = asyncHandler(async (req, res) => {
  const asset = await assetService.retire(req.params.id, req);
  res.json(asset);
});

const remove = asyncHandler(async (req, res) => {
  const result = await assetService.softDelete(req.params.id, req);
  res.json(result);
});

const history = asyncHandler(async (req, res) => {
  const logs = await assetService.getHistory(req.params.id);
  res.json({ data: logs });
});

const rotateQr = asyncHandler(async (req, res) => {
  const result = await assetService.rotateQrToken(req.params.id, req);
  res.json(result);
});

module.exports = {
  list,
  stats,
  mine,
  get,
  create,
  update,
  updateStatus,
  retire,
  remove,
  history,
  rotateQr,
};
