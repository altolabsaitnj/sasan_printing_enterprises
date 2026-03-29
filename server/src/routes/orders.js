const router = require('express').Router();
const c = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.post('/', c.create);
router.get('/', c.getAll);
router.get('/:id', c.getOne);

module.exports = router;
