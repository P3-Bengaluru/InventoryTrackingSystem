const { asyncHandler } = require('../middleware/errorHandler');
const { paginate } = require('../utils/paginate');
const activityLogService = require('../services/activityLogService');

const list = asyncHandler(async (req, res) => {
  const query = await activityLogService.getAll(req.query);
  const result = await paginate(query, req);
  res.json(result);
});

const forEntity = asyncHandler(async (req, res) => {
  const logs = await activityLogService.getForEntity(req.params.entityType, req.params.entityId);
  res.json({ data: logs });
});

const createMaintenance = asyncHandler(async (req, res) => {
  const created = await activityLogService.createMaintenance(req.body, req);
  res.status(201).json(created);
});

module.exports = { list, forEntity, createMaintenance };
