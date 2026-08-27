const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/notifications - Get user notifications
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      req.prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      req.prisma.notification.count({ where: { userId: req.user.id } }),
      req.prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);

    res.json({ notifications, total, unreadCount });
  } catch (err) { next(err); }
});

// GET /api/notifications/unread-count
router.get('/unread-count', async (req, res, next) => {
  try {
    const count = await req.prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });
    res.json({ count });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await req.prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: { isRead: true },
    });
    res.json(notification);
  } catch (err) { next(err); }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    await req.prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

// POST /api/notifications/generate - Generate system notifications
router.post('/generate', async (req, res, next) => {
  try {
    const notifications = [];

    // Low stock alerts
    const lowStockMeds = await req.prisma.medicine.findMany({
      where: { stock: { lte: 10 } },
    });
    for (const med of lowStockMeds) {
      const exists = await req.prisma.notification.findFirst({
        where: {
          userId: req.user.id,
          type: 'LOW_STOCK',
          message: { contains: med.name },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      if (!exists) {
        notifications.push({
          userId: req.user.id,
          title: 'Low Stock Alert',
          message: `${med.name} has only ${med.stock} units remaining`,
          type: 'LOW_STOCK',
          priority: med.stock === 0 ? 'URGENT' : 'HIGH',
          link: '/pharmacy',
        });
      }
    }

    // Pending lab reports
    const pendingLabs = await req.prisma.labReport.count({
      where: { status: 'PENDING' },
    });
    if (pendingLabs > 0) {
      const exists = await req.prisma.notification.findFirst({
        where: {
          userId: req.user.id,
          type: 'LAB_RESULT',
          createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
        },
      });
      if (!exists) {
        notifications.push({
          userId: req.user.id,
          title: 'Pending Lab Reports',
          message: `${pendingLabs} lab report(s) awaiting results`,
          type: 'LAB_RESULT',
          priority: 'NORMAL',
          link: '/lab-reports',
        });
      }
    }

    // Pending bills
    const pendingBills = await req.prisma.billing.count({
      where: { status: 'PENDING' },
    });
    if (pendingBills > 0) {
      const exists = await req.prisma.notification.findFirst({
        where: {
          userId: req.user.id,
          type: 'BILLING_DUE',
          createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
        },
      });
      if (!exists) {
        notifications.push({
          userId: req.user.id,
          title: 'Pending Bills',
          message: `${pendingBills} bill(s) awaiting payment`,
          type: 'BILLING_DUE',
          priority: 'NORMAL',
          link: '/billing',
        });
      }
    }

    if (notifications.length > 0) {
      await req.prisma.notification.createMany({ data: notifications });
    }

    res.json({ generated: notifications.length });
  } catch (err) { next(err); }
});

module.exports = router;
