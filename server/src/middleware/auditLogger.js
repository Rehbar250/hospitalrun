const jwt = require('jsonwebtoken');

/**
 * Audit Logger Middleware
 * Automatically logs all POST, PUT, PATCH, DELETE operations
 * Must be placed after authMiddleware so req.user is available
 */
function auditLogger(req, res, next) {
  // Only log mutating operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Skip auth routes (login/register) to avoid logging passwords
  if (req.originalUrl.includes('/api/auth/login') || req.originalUrl.includes('/api/auth/register')) {
    return next();
  }

  // Skip notification generation and read-all (too noisy)
  if (req.originalUrl.includes('/api/notifications/generate') || req.originalUrl.includes('/api/notifications/read-all')) {
    return next();
  }

  // Store original json method to intercept response
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    // Only log successful operations (2xx status codes)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const userId = req.user?.id;
      const userName = req.user?.name || 'Unknown';

      if (userId && req.prisma) {
        // Determine action from HTTP method
        let action = 'UPDATE';
        if (req.method === 'POST') action = 'CREATE';
        if (req.method === 'DELETE') action = 'DELETE';

        // Extract resource type from URL
        const urlParts = req.originalUrl.split('/').filter(Boolean);
        // /api/patients/1 -> resourceType = 'Patient'
        const resourceTypeMap = {
          patients: 'Patient',
          doctors: 'Doctor',
          appointments: 'Appointment',
          'lab-reports': 'LabReport',
          medicines: 'Medicine',
          prescriptions: 'Prescription',
          billing: 'Billing',
          settings: 'Settings',
          notifications: 'Notification',
        };

        const resourceKey = urlParts[1]; // after 'api'
        const resourceType = resourceTypeMap[resourceKey] || resourceKey;
        const resourceId = urlParts[2] && !isNaN(urlParts[2]) ? urlParts[2] : null;

        // Determine detail message
        let details = `${action} ${resourceType}`;
        if (resourceId) details += ` #${resourceId}`;
        if (req.method === 'PATCH' && req.originalUrl.includes('/status')) {
          details = `Status change on ${resourceType} #${resourceId} to ${req.body?.status || 'unknown'}`;
        }

        // Fire and forget - don't block the response
        req.prisma.auditLog.create({
          data: {
            userId,
            userName,
            action,
            resourceType,
            resourceId: resourceId ? String(resourceId) : null,
            details,
            ipAddress: req.ip || req.connection?.remoteAddress,
          },
        }).catch(err => {
          console.error('Audit log error:', err.message);
        });
      }
    }

    return originalJson(data);
  };

  next();
}

module.exports = { auditLogger };
