const express = require('express');
const { authMiddleware, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);
router.use(authorize('ADMIN'));

// GET /api/audit-logs - Paginated, filterable audit logs
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 25,
      action,
      resourceType,
      userId,
      startDate,
      endDate,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (userId) where.userId = parseInt(userId);
    if (search) {
      where.OR = [
        { userName: { contains: search } },
        { resourceType: { contains: search } },
        { details: { contains: search } },
      ];
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      req.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      req.prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) { next(err); }
});

// GET /api/audit-logs/stats - Audit log statistics
router.get('/stats', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalLogs, todayLogs, actionCounts] = await Promise.all([
      req.prisma.auditLog.count(),
      req.prisma.auditLog.count({ where: { createdAt: { gte: today } } }),
      req.prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
      }),
    ]);

    res.json({
      totalLogs,
      todayLogs,
      actionCounts: actionCounts.reduce((acc, item) => {
        acc[item.action] = item._count.action;
        return acc;
      }, {}),
    });
  } catch (err) { next(err); }
});

module.exports = router;
