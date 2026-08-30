const jwt = require('jsonwebtoken');
const { ROLES } = require('./rbac');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function authorize(...roles) {
  const allowedRoles = roles.flat().map(r => String(r).toUpperCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    const userRole = (req.user.role || '').toUpperCase();
    if (allowedRoles.length && !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: `Insufficient permissions. Role '${req.user.role}' is not authorized to access this resource.`,
        requiredRoles: allowedRoles,
      });
    }
    next();
  };
}

module.exports = { authMiddleware, authorize, ROLES };

