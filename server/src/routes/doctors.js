const express = require('express');
const { authMiddleware, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/doctors
router.get('/', async (req, res, next) => {
  try {
    const { search, status, specialization } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { doctorId: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (specialization) where.specialization = { contains: specialization, mode: 'insensitive' };

    const doctors = await req.prisma.doctor.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(doctors);
  } catch (err) { next(err); }
});

// GET /api/doctors/:id
router.get('/:id', async (req, res, next) => {
  try {
    const doctor = await req.prisma.doctor.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { appointments: { include: { patient: true }, orderBy: { dateTime: 'desc' }, take: 10 } },
    });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found.' });
    res.json(doctor);
  } catch (err) { next(err); }
});

// POST /api/doctors
router.post('/', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { firstName, lastName, specialization, phone, email, qualification, consultationFee, status } = req.body;
    if (!firstName || !lastName || !specialization || !phone || !email) {
      return res.status(400).json({ error: 'Missing required doctor fields.' });
    }
    const lastDoc = await req.prisma.doctor.findFirst({ orderBy: { id: 'desc' } });
    const nextId = lastDoc ? lastDoc.id + 1 : 1;
    const doctorId = `DOC-${String(nextId).padStart(4, '0')}`;
    const doctor = await req.prisma.doctor.create({
      data: {
        doctorId,
        firstName,
        lastName,
        specialization,
        phone,
        email,
        qualification: qualification || null,
        consultationFee: parseFloat(consultationFee || 0),
        status: status || 'ACTIVE',
      },
    });
    res.status(201).json(doctor);
  } catch (err) { next(err); }
});

// PUT /api/doctors/:id
router.put('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { firstName, lastName, specialization, phone, email, qualification, consultationFee, status } = req.body;
    const data = {};
    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (specialization) data.specialization = specialization;
    if (phone) data.phone = phone;
    if (email) data.email = email;
    if (qualification !== undefined) data.qualification = qualification;
    if (consultationFee !== undefined) data.consultationFee = parseFloat(consultationFee || 0);
    if (status) data.status = status;

    const doctor = await req.prisma.doctor.update({
      where: { id: parseInt(req.params.id) },
      data,
    });
    res.json(doctor);
  } catch (err) { next(err); }
});

module.exports = router;
