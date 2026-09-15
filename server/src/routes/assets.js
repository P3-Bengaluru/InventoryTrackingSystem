const express = require('express');
const {
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
} = require('../controllers/assetController');

const router = express.Router();

router.get('/', list);
router.get('/stats', stats);
router.get('/mine', mine);
router.get('/:id', get);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/status', updateStatus);
router.post('/:id/retire', retire);
router.delete('/:id', remove);
router.get('/:id/history', history);
router.post('/:id/rotate-qr', rotateQr);

module.exports = router;
