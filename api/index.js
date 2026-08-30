// Vercel Serverless Function entry point for HospitalRun Express API
const path = require('path');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:../server/prisma/dev.db';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'hospitalrun-super-secret-key-change-in-production';
}

const app = require('../server/src/index');

module.exports = app;
