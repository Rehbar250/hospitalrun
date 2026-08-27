const express = require('express');
const { authMiddleware, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/billing
router.get('/', async (req, res, next) => {
  try {
    const { status, patientId, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (patientId) where.patientId = parseInt(patientId);

    const finalLimit = Math.min(parseInt(limit), 100);
    const skip = (parseInt(page) - 1) * finalLimit;
    const [invoices, total] = await Promise.all([
      req.prisma.billing.findMany({
        where, skip, take: finalLimit,
        include: { patient: true, items: true },
        orderBy: { createdAt: 'desc' },
      }),
      req.prisma.billing.count({ where }),
    ]);

    res.json({ invoices, total, page: parseInt(page), totalPages: Math.ceil(total / finalLimit) });
  } catch (err) { next(err); }
});

// POST /api/billing
router.post('/', authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const lastBilling = await req.prisma.billing.findFirst({ orderBy: { id: 'desc' } });
    const nextId = lastBilling ? lastBilling.id + 1 : 1;
    const invoiceId = `INV-${String(nextId).padStart(4, '0')}`;

    const items = req.body.items || [];
    const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) * parseInt(item.quantity || 1)), 0);

    const billing = await req.prisma.billing.create({
      data: {
        invoiceId,
        patientId: parseInt(req.body.patientId),
        totalAmount,
        paymentMethod: req.body.paymentMethod,
        items: {
          create: items.map(item => ({
            description: item.description,
            amount: parseFloat(item.amount),
            quantity: parseInt(item.quantity || 1),
            type: item.type || 'OTHER',
          })),
        },
      },
      include: { patient: true, items: true },
    });
    res.status(201).json(billing);
  } catch (err) { next(err); }
});

// PUT /api/billing/:id
router.put('/:id', authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const data = {};
    if (req.body.status) data.status = req.body.status;
    if (req.body.paymentMethod) data.paymentMethod = req.body.paymentMethod;

    const billing = await req.prisma.billing.update({
      where: { id: parseInt(req.params.id) },
      data,
      include: { patient: true, items: true },
    });
    res.json(billing);
  } catch (err) { next(err); }
});

// PATCH /api/billing/:id/payment
router.patch('/:id/payment', authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const invoice = await req.prisma.billing.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    const newPaidAmount = parseFloat(invoice.paidAmount) + parseFloat(req.body.amount);
    const status = newPaidAmount >= parseFloat(invoice.totalAmount) ? 'PAID' : 'PARTIAL';

    const billing = await req.prisma.billing.update({
      where: { id: parseInt(req.params.id) },
      data: {
        paidAmount: newPaidAmount,
        status,
        paymentMethod: req.body.paymentMethod || invoice.paymentMethod,
      },
      include: { patient: true, items: true },
    });
    res.json(billing);
  } catch (err) { next(err); }
});

module.exports = router;
