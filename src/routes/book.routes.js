const router = require('express').Router();
const b = require('../controllers/book.controller');

router.get('/', b.getAll);
router.get('/:id', b.getById);
router.post('/', b.create);
router.put('/:id', b.update);
router.delete('/:id', b.remove);

module.exports = router;
