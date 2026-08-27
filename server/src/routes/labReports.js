const express = require('express');
const { authMiddleware, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/lab-reports
router.get('/', async (req, res, next) => {
  try {
    const { status, patientId, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (patientId) where.patientId = parseInt(patientId);

    const finalLimit = Math.min(parseInt(limit), 100);
    const skip = (parseInt(page) - 1) * finalLimit;
    const [reports, total] = await Promise.all([
      req.prisma.labReport.findMany({
        where, skip, take: finalLimit,
        include: { patient: true, doctor: true },
        orderBy: { createdAt: 'desc' },
      }),
      req.prisma.labReport.count({ where }),
    ]);

    res.json({ reports, total, page: parseInt(page), totalPages: Math.ceil(total / finalLimit) });
  } catch (err) { next(err); }
});

// POST /api/lab-reports
router.post('/', authorize('ADMIN', 'DOCTOR'), async (req, res, next) => {
  try {
    const lastReport = await req.prisma.labReport.findFirst({ orderBy: { id: 'desc' } });
    const nextId = lastReport ? lastReport.id + 1 : 1;
    const reportId = `LAB-${String(nextId).padStart(4, '0')}`;
    const report = await req.prisma.labReport.create({
      data: {
        reportId,
        patientId: parseInt(req.body.patientId),
        doctorId: parseInt(req.body.doctorId),
        testName: req.body.testName,
        testDescription: req.body.testDescription,
        testDate: req.body.testDate ? new Date(req.body.testDate) : new Date(),
      },
      include: { patient: true, doctor: true },
    });
    res.status(201).json(report);
  } catch (err) { next(err); }
});

// PUT /api/lab-reports/:id
router.put('/:id', authorize('ADMIN', 'LAB_TECH'), async (req, res, next) => {
  try {
    const data = {};
    if (req.body.result !== undefined) data.result = req.body.result;
    if (req.body.status) data.status = req.body.status;
    if (req.body.testName) data.testName = req.body.testName;
    if (req.body.testDescription !== undefined) data.testDescription = req.body.testDescription;

    const report = await req.prisma.labReport.update({
      where: { id: parseInt(req.params.id) },
      data,
      include: { patient: true, doctor: true },
    });
    res.json(report);
  } catch (err) { next(err); }
});

module.exports = router;
