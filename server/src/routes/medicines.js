const express = require('express');
const { authMiddleware, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/medicines
router.get('/', async (req, res, next) => {
  try {
    const { search, category, lowStock } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = { contains: category, mode: 'insensitive' };
    if (lowStock === 'true') where.stock = { lte: 10 };

    const medicines = await req.prisma.medicine.findMany({ where, orderBy: { name: 'asc' } });
    res.json(medicines);
  } catch (err) { next(err); }
});

// POST /api/medicines
router.post('/', authorize('ADMIN', 'PHARMACIST'), async (req, res, next) => {
  try {
    const { name, manufacturer, category, price, stock, expiryDate, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Medicine name is required.' });

    const medicine = await req.prisma.medicine.create({
      data: {
        name,
        manufacturer: manufacturer || null,
        category: category || null,
        price: parseFloat(price || 0),
        stock: parseInt(stock || 0),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        description: description || null,
      },
    });
    res.status(201).json(medicine);
  } catch (err) { next(err); }
});

// PUT /api/medicines/:id
router.put('/:id', authorize('ADMIN', 'PHARMACIST'), async (req, res, next) => {
  try {
    const { name, manufacturer, category, price, stock, expiryDate, description } = req.body;
    const data = {};
    if (name) data.name = name;
    if (manufacturer !== undefined) data.manufacturer = manufacturer;
    if (category !== undefined) data.category = category;
    if (price !== undefined) data.price = parseFloat(price || 0);
    if (stock !== undefined) data.stock = parseInt(stock || 0);
    if (expiryDate !== undefined) data.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (description !== undefined) data.description = description;

    const medicine = await req.prisma.medicine.update({
      where: { id: parseInt(req.params.id) },
      data,
    });
    res.json(medicine);
  } catch (err) { next(err); }
});

module.exports = router;
