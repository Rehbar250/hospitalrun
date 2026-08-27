const express = require('express');
const { authMiddleware, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/prescriptions
router.get('/', async (req, res, next) => {
  try {
    const { patientId, doctorId } = req.query;
    const where = {};
    if (patientId) where.patientId = parseInt(patientId);
    if (doctorId) where.doctorId = parseInt(doctorId);

    const prescriptions = await req.prisma.prescription.findMany({
      where,
      include: { patient: true, doctor: true, items: { include: { medicine: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(prescriptions);
  } catch (err) { next(err); }
});

// POST /api/prescriptions
router.post('/', authorize('ADMIN', 'DOCTOR'), async (req, res, next) => {
  try {
    const lastPrx = await req.prisma.prescription.findFirst({ orderBy: { id: 'desc' } });
    const nextId = lastPrx ? lastPrx.id + 1 : 1;
    const prescriptionId = `PRX-${String(nextId).padStart(4, '0')}`;

    const prescription = await req.prisma.prescription.create({
      data: {
        prescriptionId,
        patientId: parseInt(req.body.patientId),
        doctorId: parseInt(req.body.doctorId),
        diagnosis: req.body.diagnosis,
        notes: req.body.notes,
        items: {
          create: (req.body.items || []).map(item => ({
            medicineId: parseInt(item.medicineId),
            dosage: item.dosage,
            frequency: item.frequency,
            duration: parseInt(item.duration),
            instructions: item.instructions,
          })),
        },
      },
      include: { patient: true, doctor: true, items: { include: { medicine: true } } },
    });

    // Update medicine stock
    for (const item of req.body.items || []) {
      await req.prisma.medicine.update({
        where: { id: parseInt(item.medicineId) },
        data: { stock: { decrement: parseInt(item.duration) } },
      });
    }

    res.status(201).json(prescription);
  } catch (err) { next(err); }
});

module.exports = router;
