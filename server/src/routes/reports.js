const router = require('express').Router();
const c = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/summary', c.getSummary);
router.get('/daily', c.getDailySales);
router.get('/top-products', c.getTopProducts);
router.get('/payment-breakdown', c.getPaymentBreakdown);

module.exports = router;
