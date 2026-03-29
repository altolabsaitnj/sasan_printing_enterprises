const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const c = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

router.get('/', authenticate, c.getAll);
router.get('/low-stock', authenticate, c.getLowStock);
router.get('/barcode/:barcode', authenticate, c.getByBarcode);
router.post('/', authenticate, authorize('admin'), upload.single('image'), c.create);
router.put('/:id', authenticate, authorize('admin'), upload.single('image'), c.update);
router.delete('/:id', authenticate, authorize('admin'), c.remove);

module.exports = router;
