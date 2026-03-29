const router = require('express').Router();
const c = require('../controllers/settingController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, c.getAll);
router.put('/', authenticate, authorize('admin'), c.update);

module.exports = router;
