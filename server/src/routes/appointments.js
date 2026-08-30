const express = require('express');
const { authMiddleware, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/appointments
router.get('/', async (req, res, next) => {
  try {
    const { status, doctorId, date, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (doctorId) where.doctorId = parseInt(doctorId);
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.dateTime = { gte: start, lt: end };
    }
    if (search) {
      const trimmed = search.trim();
      const parts = trimmed.split(/\s+/);
      
      if (parts.length > 1) {
        where.OR = [
          { appointmentId: { contains: trimmed } },
          {
            patient: {
              AND: [
                { firstName: { contains: parts[0] } },
                { lastName: { contains: parts[1] } },
              ],
            },
          },
          {
            patient: {
              AND: [
                { firstName: { contains: parts[1] } },
                { lastName: { contains: parts[0] } },
              ],
            },
          },
          {
            doctor: {
              AND: [
                { firstName: { contains: parts[0] } },
                { lastName: { contains: parts[1] } },
              ],
            },
          },
          {
            doctor: {
              AND: [
                { firstName: { contains: parts[1] } },
                { lastName: { contains: parts[0] } },
              ],
            },
          },
        ];
      } else {
        where.OR = [
          { appointmentId: { contains: trimmed } },
          { patient: { firstName: { contains: trimmed } } },
          { patient: { lastName: { contains: trimmed } } },
          { patient: { patientId: { contains: trimmed } } },
          { doctor: { firstName: { contains: trimmed } } },
          { doctor: { lastName: { contains: trimmed } } },
        ];
      }
    }

    const finalLimit = Math.min(parseInt(limit), 100);
    const skip = (parseInt(page) - 1) * finalLimit;
    const [appointments, total] = await Promise.all([
      req.prisma.appointment.findMany({
        where, skip, take: finalLimit,
        include: { patient: true, doctor: true },
        orderBy: { dateTime: 'desc' },
      }),
      req.prisma.appointment.count({ where }),
    ]);

    res.json({ appointments, total, page: parseInt(page), totalPages: Math.ceil(total / finalLimit) });
  } catch (err) { next(err); }
});

// GET /api/appointments/:id
router.get('/:id', async (req, res, next) => {
  try {
    const appointment = await req.prisma.appointment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { patient: true, doctor: true },
    });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });
    res.json(appointment);
  } catch (err) { next(err); }
});

// POST /api/appointments
router.post('/', authorize('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const lastApt = await req.prisma.appointment.findFirst({ orderBy: { id: 'desc' } });
    const nextId = lastApt ? lastApt.id + 1 : 1;
    const appointmentId = `APT-${String(nextId).padStart(4, '0')}`;
    const appointment = await req.prisma.appointment.create({
      data: {
        appointmentId,
        patientId: parseInt(req.body.patientId),
        doctorId: parseInt(req.body.doctorId),
        dateTime: new Date(req.body.dateTime),
        type: req.body.type || 'CHECKUP',
        notes: req.body.notes,
      },
      include: { patient: true, doctor: true },
    });
    res.status(201).json(appointment);
  } catch (err) { next(err); }
});

// PUT /api/appointments/:id
router.put('/:id', authorize('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const data = {};
    if (req.body.dateTime) data.dateTime = new Date(req.body.dateTime);
    if (req.body.status) data.status = req.body.status;
    if (req.body.type) data.type = req.body.type;
    if (req.body.notes !== undefined) data.notes = req.body.notes;
    if (req.body.doctorId) data.doctorId = parseInt(req.body.doctorId);

    const appointment = await req.prisma.appointment.update({
      where: { id: parseInt(req.params.id) },
      data,
      include: { patient: true, doctor: true },
    });
    res.json(appointment);
  } catch (err) { next(err); }
});

// PATCH /api/appointments/:id/status
router.patch('/:id/status', authorize('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const appointment = await req.prisma.appointment.update({
      where: { id: parseInt(req.params.id) },
      data: { status: req.body.status },
      include: { patient: true, doctor: true },
    });
    res.json(appointment);
  } catch (err) { next(err); }
});

// DELETE /api/appointments/:id
router.delete('/:id', authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    await req.prisma.appointment.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
