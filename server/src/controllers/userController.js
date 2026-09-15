const { asyncHandler } = require('../middleware/errorHandler');
const { paginate } = require('../utils/paginate');
const userService = require('../services/userService');

const list = asyncHandler(async (req, res) => {
  const query = userService.getAll(req.query);
  const result = await paginate(query, req);
  res.json(result);
});

const get = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id);
  res.json(user);
});

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.user.id);
  res.json(user);
});

const create = asyncHandler(async (req, res) => {
  const user = await userService.create(req.body, req);
  res.status(201).json(user);
});

const update = asyncHandler(async (req, res) => {
  const user = await userService.update(req.params.id, req.body, req);
  res.json(user);
});

const changeMyPassword = asyncHandler(async (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password) {
    return res.status(400).json({ error: 'Current and new passwords are required' });
  }
  if (new_password.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  const result = await userService.changePassword(req.user.id, old_password, new_password, req);
  res.json(result);
});

const adminResetPassword = asyncHandler(async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  const result = await userService.adminResetPassword(req.params.id, new_password, req);
  res.json(result);
});

const toggleActive = asyncHandler(async (req, res) => {
  const result = await userService.toggleActive(req.params.id, req);
  res.json(result);
});

const assignedAssets = asyncHandler(async (req, res) => {
  const assets = await userService.getAssignedAssets(req.params.id);
  res.json({ data: assets });
});

module.exports = {
  list,
  get,
  getMe,
  create,
  update,
  changeMyPassword,
  adminResetPassword,
  toggleActive,
  assignedAssets,
};
