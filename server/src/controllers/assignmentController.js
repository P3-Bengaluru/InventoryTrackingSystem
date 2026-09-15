const { asyncHandler } = require('../middleware/errorHandler');
const { paginate } = require('../utils/paginate');
const assignmentService = require('../services/assignmentService');

const list = asyncHandler(async (req, res) => {
  const filters = { ...req.query };
  if (req.user.role === 'engineer') {
    filters.user_id = req.user.id;
  }
  const query = assignmentService.getAll(filters);
  const result = await paginate(query, req);
  res.json(result);
});

const get = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.getById(req.params.id);
  res.json(assignment);
});

const create = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.create(req.body, req);
  res.status(201).json(assignment);
});

const approve = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.approve(req.params.id, req);
  res.json(assignment);
});

const reject = asyncHandler(async (req, res) => {
  const { rejection_reason } = req.body;
  const assignment = await assignmentService.reject(req.params.id, rejection_reason, req);
  res.json(assignment);
});

const checkIn = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.checkIn(req.params.id, req.body, req);
  res.json(assignment);
});

module.exports = { list, get, create, approve, reject, checkIn };
