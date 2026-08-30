/**
 * Comprehensive RBAC Test Suite for HospitalRun
 * Validates endpoint authorization across all 6 roles
 */

const http = require('http');

const PORT = 5000;
const HOST = 'localhost';

const ROLES_TEST = [
  { role: 'ADMIN', email: 'admin@hospitalrun.io', password: 'admin123' },
  { role: 'DOCTOR', email: 'dr.sharma@hospitalrun.io', password: 'doctor123' },
  { role: 'NURSE', email: 'nurse@hospitalrun.io', password: 'nurse123' },
  { role: 'RECEPTIONIST', email: 'receptionist@hospitalrun.io', password: 'reception123' },
  { role: 'PHARMACIST', email: 'pharmacist@hospitalrun.io', password: 'pharma123' },
  { role: 'LAB_TECH', email: 'labtech@hospitalrun.io', password: 'labtech123' },
];

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      host: HOST,
      port: PORT,
      path,
      method,
      headers,
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);
    if (body) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Comprehensive RBAC Authorization Tests...\n');

  // 1. Authenticate all roles
  const tokens = {};
  for (const r of ROLES_TEST) {
    const res = await makeRequest('POST', '/api/auth/login', { email: r.email, password: r.password });
    if (res.status !== 200 || !res.data.token) {
      console.error(`❌ Failed to login as ${r.role}:`, res.data);
      process.exit(1);
    }
    tokens[r.role] = res.data.token;
    console.log(`🔑 Logged in as ${r.role.padEnd(12)} -> User: ${res.data.user.name}`);
  }
  console.log('\n--- Running Matrix Verification ---\n');

  const tests = [
    {
      module: 'Dashboard Analytics',
      method: 'GET',
      path: '/api/dashboard/stats',
      body: null,
      expected: { ADMIN: 200, DOCTOR: 200, NURSE: 200, RECEPTIONIST: 200, PHARMACIST: 200, LAB_TECH: 200 },
    },
    {
      module: 'Patient Directory (View)',
      method: 'GET',
      path: '/api/patients',
      body: null,
      expected: { ADMIN: 200, DOCTOR: 200, NURSE: 200, RECEPTIONIST: 200, PHARMACIST: 200, LAB_TECH: 200 },
    },
    {
      module: 'Patient Intake & Registration',
      method: 'POST',
      path: '/api/patients',
      body: { firstName: 'Test', lastName: 'Patient', dateOfBirth: '1990-01-01', gender: 'MALE', phone: '9999999999' },
      expected: { ADMIN: 201, DOCTOR: 403, NURSE: 403, RECEPTIONIST: 201, PHARMACIST: 403, LAB_TECH: 403 },
    },
    {
      module: 'Vitals Recording',
      method: 'POST',
      path: '/api/patients/1/vitals',
      body: { temperature: 37.0, bloodPress: '120/80', pulseRate: 72, spo2: 98, weight: 65 },
      expected: { ADMIN: 201, DOCTOR: 201, NURSE: 201, RECEPTIONIST: 403, PHARMACIST: 403, LAB_TECH: 403 },
    },
    {
      module: 'AI Clinical Decision Support',
      method: 'POST',
      path: '/api/clinical/check-prescription',
      body: { patientId: 1, medicineNames: ['Paracetamol', 'Amoxicillin'] },
      expected: { ADMIN: 200, DOCTOR: 200, NURSE: 403, RECEPTIONIST: 403, PHARMACIST: 403, LAB_TECH: 403 },
    },
    {
      module: 'Appointment Scheduling',
      method: 'POST',
      path: '/api/appointments',
      body: { patientId: 1, doctorId: 1, dateTime: new Date().toISOString(), type: 'CHECKUP' },
      expected: { ADMIN: 201, DOCTOR: 201, NURSE: 201, RECEPTIONIST: 201, PHARMACIST: 403, LAB_TECH: 403 },
    },
    {
      module: 'Pharmacy & Medicine Stock',
      method: 'POST',
      path: '/api/medicines',
      body: { name: `TestMed_${Date.now()}`, price: 50, stock: 100 },
      expected: { ADMIN: 201, DOCTOR: 403, NURSE: 403, RECEPTIONIST: 403, PHARMACIST: 201, LAB_TECH: 403 },
    },
    {
      module: 'Laboratory Test Results Entry',
      method: 'PUT',
      path: '/api/lab-reports/1',
      body: { status: 'COMPLETED', result: 'Verified normal range' },
      expected: { ADMIN: 200, DOCTOR: 403, NURSE: 403, RECEPTIONIST: 403, PHARMACIST: 403, LAB_TECH: 200 },
    },
    {
      module: 'Billing, Invoicing & Payments',
      method: 'POST',
      path: '/api/billing',
      body: { patientId: 1, paymentMethod: 'CASH', items: [{ description: 'Test', amount: 100, quantity: 1, type: 'OTHER' }] },
      expected: { ADMIN: 201, DOCTOR: 403, NURSE: 403, RECEPTIONIST: 201, PHARMACIST: 403, LAB_TECH: 403 },
    },
    {
      module: 'Security Audit Logs',
      method: 'GET',
      path: '/api/audit-logs',
      body: null,
      expected: { ADMIN: 200, DOCTOR: 403, NURSE: 403, RECEPTIONIST: 403, PHARMACIST: 403, LAB_TECH: 403 },
    },
    {
      module: 'System Settings',
      method: 'GET',
      path: '/api/settings/system',
      body: null,
      expected: { ADMIN: 200, DOCTOR: 403, NURSE: 403, RECEPTIONIST: 403, PHARMACIST: 403, LAB_TECH: 403 },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    console.log(`📌 Testing [${t.module}] (${t.method} ${t.path})`);
    for (const r of ROLES_TEST) {
      const exp = t.expected[r.role];
      const res = await makeRequest(t.method, t.path, t.body, tokens[r.role]);
      const isMatch = res.status === exp;
      if (isMatch) {
        passed++;
        console.log(`   ✅ ${r.role.padEnd(12)} -> HTTP ${res.status} (Expected ${exp})`);
      } else {
        failed++;
        console.error(`   ❌ ${r.role.padEnd(12)} -> HTTP ${res.status} (Expected ${exp}) Details:`, res.data);
      }
    }
    console.log('');
  }

  console.log(`========================================`);
  console.log(`📊 RBAC Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
