require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const labReportRoutes = require('./routes/labReports');
const medicineRoutes = require('./routes/medicines');
const prescriptionRoutes = require('./routes/prescriptions');
const billingRoutes = require('./routes/billing');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const auditLogRoutes = require('./routes/auditLog');
const clinicalIntelligenceRoutes = require('./routes/clinicalIntelligence');
const { auditLogger } = require('./middleware/auditLogger');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? corsOrigin : '*',
  credentials: true
}));
app.use(express.json());

// Make prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Audit logger (logs all POST/PUT/PATCH/DELETE after auth)
app.use(auditLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/lab-reports', labReportRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/clinical', clinicalIntelligenceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack || err.message);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProduction ? 'An unexpected error occurred. Please contact system administrator.' : (err.message || 'Internal Server Error'),
  });
});

// Start server only if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🏥 HospitalRun server running on http://localhost:${PORT}`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;

