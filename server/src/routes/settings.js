const express = require('express');
const bcrypt = require('bcryptjs');
const { authMiddleware, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/settings/profile - Get current user profile
router.get('/profile', async (req, res, next) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// PUT /api/settings/profile - Update profile
router.put('/profile', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    // Check email uniqueness (excluding current user)
    const existing = await req.prisma.user.findFirst({
      where: { email, NOT: { id: req.user.id } },
    });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const updated = await req.prisma.user.update({
      where: { id: req.user.id },
      data: { name, email },
      select: { id: true, name: true, email: true, role: true },
    });

    // Log audit
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        userName: req.user.name || name,
        action: 'UPDATE',
        resourceType: 'User',
        resourceId: String(req.user.id),
        details: 'Profile updated',
      },
    });

    res.json(updated);
  } catch (err) { next(err); }
});

// PUT /api/settings/password - Change password
router.put('/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await req.prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await req.prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed },
    });

    // Log audit
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        userName: user.name,
        action: 'PASSWORD_CHANGE',
        resourceType: 'User',
        resourceId: String(req.user.id),
        details: 'Password changed',
      },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (err) { next(err); }
});

// GET /api/settings/system - Get system settings (admin only)
router.get('/system', authorize('ADMIN'), async (req, res, next) => {
  try {
    const settings = await req.prisma.settings.findMany({
      orderBy: { category: 'asc' },
    });
    // Convert to key-value map
    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });
    res.json(settingsMap);
  } catch (err) { next(err); }
});

// PUT /api/settings/system - Update system settings (admin only)
router.put('/system', authorize('ADMIN'), async (req, res, next) => {
  try {
    const updates = req.body; // { key: value, ... }
    for (const [key, value] of Object.entries(updates)) {
      await req.prisma.settings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value), category: 'SYSTEM' },
      });
    }

    // Log audit
    await req.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        userName: req.user.name || 'Admin',
        action: 'UPDATE',
        resourceType: 'Settings',
        details: `Updated settings: ${Object.keys(updates).join(', ')}`,
      },
    });

    res.json({ message: 'Settings updated' });
  } catch (err) { next(err); }
});

module.exports = router;
