const express = require('express');
const { authMiddleware, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/patients
router.get('/', async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const finalLimit = Math.min(parseInt(limit), 100);
    const skip = (parseInt(page) - 1) * finalLimit;
    const trimmed = (search || '').trim();
    let where = {};
    if (trimmed) {
      const parts = trimmed.split(/\s+/);
      if (parts.length > 1) {
        where = {
          OR: [
            {
              AND: [
                { firstName: { contains: parts[0] } },
                { lastName: { contains: parts[1] } },
              ],
            },
            {
              AND: [
                { firstName: { contains: parts[1] } },
                { lastName: { contains: parts[0] } },
              ],
            },
            { firstName: { contains: trimmed } },
            { lastName: { contains: trimmed } },
            { patientId: { contains: trimmed } },
            { phone: { contains: trimmed } },
          ],
        };
      } else {
        where = {
          OR: [
            { firstName: { contains: trimmed } },
            { lastName: { contains: trimmed } },
            { patientId: { contains: trimmed } },
            { phone: { contains: trimmed } },
          ],
        };
      }
    }

    const [patients, total] = await Promise.all([
      req.prisma.patient.findMany({ where, skip, take: finalLimit, orderBy: { createdAt: 'desc' } }),
      req.prisma.patient.count({ where }),
    ]);

    res.json({ patients, total, page: parseInt(page), totalPages: Math.ceil(total / finalLimit) });
  } catch (err) { next(err); }
});

// GET /api/patients/:id
router.get('/:id', async (req, res, next) => {
  try {
    const patient = await req.prisma.patient.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        appointments: { include: { doctor: true }, orderBy: { dateTime: 'desc' }, take: 10 },
        labReports: { orderBy: { createdAt: 'desc' }, take: 10 },
        prescriptions: { include: { items: { include: { medicine: true } } }, orderBy: { createdAt: 'desc' }, take: 10 },
        billings: { orderBy: { createdAt: 'desc' }, take: 10 },
        vitals: { orderBy: { createdAt: 'desc' }, take: 15 }
      },
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found.' });
    res.json(patient);
  } catch (err) { next(err); }
});

// POST /api/patients
router.post('/', authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, phone, email, address, bloodGroup, allergies, medicalHistory } = req.body;
    if (!firstName || !lastName || !dateOfBirth || !gender || !phone) {
      return res.status(400).json({ error: 'Missing required patient fields.' });
    }
    const lastPatient = await req.prisma.patient.findFirst({ orderBy: { id: 'desc' } });
    const nextId = lastPatient ? lastPatient.id + 1 : 1;
    const patientId = `PAT-${String(nextId).padStart(4, '0')}`;
    const patient = await req.prisma.patient.create({
      data: {
        patientId,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        phone,
        email: email || null,
        address: address || null,
        bloodGroup: bloodGroup || null,
        allergies: allergies || null,
        medicalHistory: medicalHistory || null,
      },
    });
    res.status(201).json(patient);
  } catch (err) { next(err); }
});

// PUT /api/patients/:id
router.put('/:id', authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, phone, email, address, bloodGroup, allergies, medicalHistory } = req.body;
    const data = {};
    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (dateOfBirth) data.dateOfBirth = new Date(dateOfBirth);
    if (gender) data.gender = gender;
    if (phone) data.phone = phone;
    if (email !== undefined) data.email = email;
    if (address !== undefined) data.address = address;
    if (bloodGroup !== undefined) data.bloodGroup = bloodGroup;
    if (allergies !== undefined) data.allergies = allergies;
    if (medicalHistory !== undefined) data.medicalHistory = medicalHistory;

    const patient = await req.prisma.patient.update({
      where: { id: parseInt(req.params.id) },
      data,
    });
    res.json(patient);
  } catch (err) { next(err); }
});

// DELETE /api/patients/:id
router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    await req.prisma.patient.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Patient deleted successfully.' });
  } catch (err) { next(err); }
});

// GET /api/patients/:id/vitals
router.get('/:id/vitals', async (req, res, next) => {
  try {
    const vitals = await req.prisma.vitals.findMany({
      where: { patientId: parseInt(req.params.id) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(vitals);
  } catch (err) { next(err); }
});

// POST /api/patients/:id/vitals
router.post('/:id/vitals', authorize('ADMIN', 'DOCTOR', 'NURSE'), async (req, res, next) => {
  try {
    const { temperature, bloodPress, pulseRate, spo2, weight } = req.body;
    if (temperature == null || !bloodPress || pulseRate == null || spo2 == null) {
      return res.status(400).json({ error: 'Missing required vitals fields (temperature, bloodPress, pulseRate, spo2).' });
    }
    const vitalRecord = await req.prisma.vitals.create({
      data: {
        patientId: parseInt(req.params.id),
        temperature: parseFloat(temperature),
        bloodPress,
        pulseRate: parseInt(pulseRate),
        spo2: parseInt(spo2),
        weight: weight ? parseFloat(weight) : null,
        recordedBy: req.user.name || 'Staff'
      }
    });
    res.status(201).json(vitalRecord);
  } catch (err) { next(err); }
});

module.exports = router;
