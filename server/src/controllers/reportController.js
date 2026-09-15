const { asyncHandler } = require('../middleware/errorHandler');
const { paginate } = require('../utils/paginate');
const reportService = require('../services/reportService');

const assetRegister = asyncHandler(async (req, res) => {
  const query = await reportService.assetRegister(req.query);
  const result = await paginate(query, req);
  res.json(result);
});

const checkoutHistory = asyncHandler(async (req, res) => {
  const query = await reportService.checkoutHistory(req.query);
  const result = await paginate(query, req);
  res.json(result);
});

const activityLog = asyncHandler(async (req, res) => {
  const query = await reportService.activityLog(req.query);
  const result = await paginate(query, req);
  res.json(result);
});

const procurementReport = asyncHandler(async (req, res) => {
  const query = await reportService.procurementReport(req.query);
  const result = await paginate(query, req);
  res.json(result);
});

module.exports = { assetRegister, checkoutHistory, activityLog, procurementReport };
