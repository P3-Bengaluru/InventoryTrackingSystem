const { asyncHandler } = require('../middleware/errorHandler');
const dashboardService = require('../services/dashboardService');

const stats = asyncHandler(async (req, res) => {
  const data = await dashboardService.getStats();
  res.json(data);
});

const trend = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days || '30', 10);
  const data = await dashboardService.getTrend(days);
  res.json({ data });
});

const recent = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit || '20', 10);
  const data = await dashboardService.getRecentActivity(limit);
  res.json({ data });
});

module.exports = { stats, trend, recent };
