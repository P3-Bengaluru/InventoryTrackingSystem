const express = require('express');
const {
  list,
  get,
  create,
  update,
  changeMyPassword,
  adminResetPassword,
  toggleActive,
  assignedAssets,
} = require('../controllers/userController');

const router = express.Router();

router.get('/', list);
router.get('/:id', get);
router.post('/', create);
router.put('/:id', update);
router.post('/:id/reset-password', adminResetPassword);
router.post('/:id/toggle-active', toggleActive);
router.post('/me/change-password', changeMyPassword);
router.get('/:id/assigned-assets', assignedAssets);

module.exports = router;
