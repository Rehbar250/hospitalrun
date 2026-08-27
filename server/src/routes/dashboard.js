const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/dashboard/stats
router.get('/stats', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      pendingLabReports,
      lowStockMedicines,
      pendingBills,
      recentPatients,
      recentAppointments,
      revenueData,
    ] = await Promise.all([
      req.prisma.patient.count(),
      req.prisma.doctor.count({ where: { status: 'ACTIVE' } }),
      req.prisma.appointment.count(),
      req.prisma.appointment.count({ where: { dateTime: { gte: today, lt: tomorrow } } }),
      req.prisma.labReport.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
      req.prisma.medicine.count({ where: { stock: { lte: 10 } } }),
      req.prisma.billing.count({ where: { status: { in: ['PENDING', 'PARTIAL'] } } }),
      req.prisma.patient.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      req.prisma.appointment.findMany({
        where: { dateTime: { gte: today } },
        include: { patient: true, doctor: true },
        orderBy: { dateTime: 'asc' },
        take: 8,
      }),
      req.prisma.billing.aggregate({
        _sum: { paidAmount: true },
        where: { status: { in: ['PAID', 'PARTIAL'] } },
      }),
    ]);

    res.json({
      stats: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        todayAppointments,
        pendingLabReports,
        lowStockMedicines,
        pendingBills,
        totalRevenue: revenueData._sum.paidAmount || 0,
      },
      recentPatients,
      recentAppointments,
    });
  } catch (err) { next(err); }
});

module.exports = router;
