const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default users for all 6 HospitalRun RBAC roles
  const usersToSeed = [
    { email: 'admin@hospitalrun.io', password: 'admin123', name: 'Dr. Sarah Connor (Admin)', role: 'ADMIN' },
    { email: 'dr.sharma@hospitalrun.io', password: 'doctor123', name: 'Dr. Rajesh Sharma', role: 'DOCTOR' },
    { email: 'nurse@hospitalrun.io', password: 'nurse123', name: 'Nurse Ananya Roy', role: 'NURSE' },
    { email: 'receptionist@hospitalrun.io', password: 'reception123', name: 'Pooja Verma (Desk)', role: 'RECEPTIONIST' },
    { email: 'pharmacist@hospitalrun.io', password: 'pharma123', name: 'Rohan Mehta (PharmD)', role: 'PHARMACIST' },
    { email: 'labtech@hospitalrun.io', password: 'labtech123', name: 'Vikram Joshi (Lab Tech)', role: 'LAB_TECH' },
  ];

  for (const u of usersToSeed) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, name: u.name, password: hashedPassword },
      create: {
        email: u.email,
        password: hashedPassword,
        name: u.name,
        role: u.role,
      },
    });
  }
  console.log(`✅ Seeded ${usersToSeed.length} users across all RBAC roles (ADMIN, DOCTOR, NURSE, RECEPTIONIST, PHARMACIST, LAB_TECH)`);

  // Create doctors
  const doctors = await Promise.all([
    prisma.doctor.upsert({
      where: { email: 'dr.sharma@hospitalrun.io' },
      update: {},
      create: {
        doctorId: 'DOC-0001',
        firstName: 'Rajesh',
        lastName: 'Sharma',
        specialization: 'Cardiology',
        phone: '+91-9876543210',
        email: 'dr.sharma@hospitalrun.io',
        qualification: 'MBBS, MD (Cardiology)',
        consultationFee: 800,
        status: 'ACTIVE',
      },
    }),
    prisma.doctor.upsert({
      where: { email: 'dr.patel@hospitalrun.io' },
      update: {},
      create: {
        doctorId: 'DOC-0002',
        firstName: 'Priya',
        lastName: 'Patel',
        specialization: 'Pediatrics',
        phone: '+91-9876543211',
        email: 'dr.patel@hospitalrun.io',
        qualification: 'MBBS, DCH',
        consultationFee: 600,
        status: 'ACTIVE',
      },
    }),
    prisma.doctor.upsert({
      where: { email: 'dr.kumar@hospitalrun.io' },
      update: {},
      create: {
        doctorId: 'DOC-0003',
        firstName: 'Anil',
        lastName: 'Kumar',
        specialization: 'Orthopedics',
        phone: '+91-9876543212',
        email: 'dr.kumar@hospitalrun.io',
        qualification: 'MBBS, MS (Ortho)',
        consultationFee: 1000,
        status: 'ACTIVE',
      },
    }),
    prisma.doctor.upsert({
      where: { email: 'dr.gupta@hospitalrun.io' },
      update: {},
      create: {
        doctorId: 'DOC-0004',
        firstName: 'Neha',
        lastName: 'Gupta',
        specialization: 'Dermatology',
        phone: '+91-9876543213',
        email: 'dr.gupta@hospitalrun.io',
        qualification: 'MBBS, MD (Dermatology)',
        consultationFee: 700,
        status: 'ACTIVE',
      },
    }),
    prisma.doctor.upsert({
      where: { email: 'dr.singh@hospitalrun.io' },
      update: {},
      create: {
        doctorId: 'DOC-0005',
        firstName: 'Vikram',
        lastName: 'Singh',
        specialization: 'General Medicine',
        phone: '+91-9876543214',
        email: 'dr.singh@hospitalrun.io',
        qualification: 'MBBS, MD',
        consultationFee: 500,
        status: 'ON_LEAVE',
      },
    }),
  ]);
  console.log(`✅ ${doctors.length} doctors created`);

  // Create patients
  const patients = await Promise.all([
    prisma.patient.upsert({
      where: { patientId: 'PAT-0001' },
      update: {},
      create: {
        patientId: 'PAT-0001',
        firstName: 'Amit',
        lastName: 'Verma',
        dateOfBirth: new Date('1985-03-15'),
        gender: 'MALE',
        phone: '+91-9988776655',
        email: 'amit.verma@email.com',
        address: '123 MG Road, Delhi',
        bloodGroup: 'B+',
        allergies: 'Penicillin',
      },
    }),
    prisma.patient.upsert({
      where: { patientId: 'PAT-0002' },
      update: {},
      create: {
        patientId: 'PAT-0002',
        firstName: 'Sunita',
        lastName: 'Devi',
        dateOfBirth: new Date('1990-07-22'),
        gender: 'FEMALE',
        phone: '+91-9988776656',
        email: 'sunita.devi@email.com',
        address: '456 Nehru Nagar, Mumbai',
        bloodGroup: 'O+',
      },
    }),
    prisma.patient.upsert({
      where: { patientId: 'PAT-0003' },
      update: {},
      create: {
        patientId: 'PAT-0003',
        firstName: 'Ravi',
        lastName: 'Shankar',
        dateOfBirth: new Date('1978-11-05'),
        gender: 'MALE',
        phone: '+91-9988776657',
        address: '789 Gandhi Street, Chennai',
        bloodGroup: 'A+',
        allergies: 'Sulfa drugs',
        medicalHistory: 'Diabetes Type 2, Hypertension',
      },
    }),
    prisma.patient.upsert({
      where: { patientId: 'PAT-0004' },
      update: {},
      create: {
        patientId: 'PAT-0004',
        firstName: 'Meera',
        lastName: 'Joshi',
        dateOfBirth: new Date('1995-01-30'),
        gender: 'FEMALE',
        phone: '+91-9988776658',
        email: 'meera.joshi@email.com',
        address: '321 Lajpat Nagar, Bangalore',
        bloodGroup: 'AB+',
      },
    }),
    prisma.patient.upsert({
      where: { patientId: 'PAT-0005' },
      update: {},
      create: {
        patientId: 'PAT-0005',
        firstName: 'Suresh',
        lastName: 'Reddy',
        dateOfBirth: new Date('1960-09-12'),
        gender: 'MALE',
        phone: '+91-9988776659',
        address: '654 Park Avenue, Hyderabad',
        bloodGroup: 'O-',
        medicalHistory: 'Heart Surgery (2018), Asthma',
      },
    }),
  ]);
  console.log(`✅ ${patients.length} patients created`);

  // Create medicines
  const medicineData = [
    { name: 'Paracetamol 500mg', manufacturer: 'Cipla', category: 'Analgesic', price: 25, stock: 500, expiryDate: new Date('2027-06-30') },
    { name: 'Amoxicillin 250mg', manufacturer: 'Sun Pharma', category: 'Antibiotic', price: 85, stock: 200, expiryDate: new Date('2027-03-15') },
    { name: 'Metformin 500mg', manufacturer: 'Dr. Reddy\'s', category: 'Antidiabetic', price: 45, stock: 350, expiryDate: new Date('2027-09-20') },
    { name: 'Amlodipine 5mg', manufacturer: 'Lupin', category: 'Antihypertensive', price: 55, stock: 8, expiryDate: new Date('2027-01-10') },
    { name: 'Omeprazole 20mg', manufacturer: 'Cipla', category: 'Antacid', price: 65, stock: 150, expiryDate: new Date('2027-12-31') },
    { name: 'Cetirizine 10mg', manufacturer: 'GSK', category: 'Antihistamine', price: 15, stock: 5, expiryDate: new Date('2027-08-15') },
    { name: 'Ibuprofen 400mg', manufacturer: 'Mankind', category: 'NSAID', price: 30, stock: 300, expiryDate: new Date('2027-05-20') },
    { name: 'Azithromycin 500mg', manufacturer: 'Zydus', category: 'Antibiotic', price: 120, stock: 100, expiryDate: new Date('2027-04-10') },
  ];

  for (const m of medicineData) {
    const existing = await prisma.medicine.findFirst({ where: { name: m.name } });
    if (!existing) {
      await prisma.medicine.create({ data: m });
    }
  }
  console.log(`✅ Seeded medicines catalog`);

  // Create appointments
  const now = new Date();
  const appointmentData = [
    {
      appointmentId: 'APT-0001',
      patientId: patients[0].id,
      doctorId: doctors[0].id,
      dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
      status: 'SCHEDULED',
      type: 'CHECKUP',
      notes: 'Regular cardiac checkup',
    },
    {
      appointmentId: 'APT-0002',
      patientId: patients[1].id,
      doctorId: doctors[1].id,
      dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30),
      status: 'SCHEDULED',
      type: 'CONSULTATION',
    },
    {
      appointmentId: 'APT-0003',
      patientId: patients[2].id,
      doctorId: doctors[0].id,
      dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0),
      status: 'IN_PROGRESS',
      type: 'FOLLOW_UP',
      notes: 'Follow-up for blood pressure monitoring',
    },
    {
      appointmentId: 'APT-0004',
      patientId: patients[3].id,
      doctorId: doctors[3].id,
      dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30),
      status: 'SCHEDULED',
      type: 'CONSULTATION',
    },
    {
      appointmentId: 'APT-0005',
      patientId: patients[4].id,
      doctorId: doctors[2].id,
      dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 0),
      status: 'COMPLETED',
      type: 'CHECKUP',
      notes: 'Post-surgery knee evaluation',
    },
  ];

  for (const apt of appointmentData) {
    await prisma.appointment.upsert({
      where: { appointmentId: apt.appointmentId },
      update: apt,
      create: apt,
    });
  }
  console.log(`✅ ${appointmentData.length} appointments seeded`);

  // Create lab reports
  const labData = [
    {
      reportId: 'LAB-0001',
      patientId: patients[0].id,
      doctorId: doctors[0].id,
      testName: 'Complete Blood Count (CBC)',
      testDescription: 'Routine blood analysis',
      status: 'COMPLETED',
      result: 'All values within normal range. WBC: 7500, RBC: 5.2M, Hemoglobin: 14.5 g/dL',
    },
    {
      reportId: 'LAB-0002',
      patientId: patients[2].id,
      doctorId: doctors[0].id,
      testName: 'Lipid Profile',
      testDescription: 'Cholesterol and triglycerides analysis',
      status: 'PENDING',
    },
    {
      reportId: 'LAB-0003',
      patientId: patients[4].id,
      doctorId: doctors[2].id,
      testName: 'X-Ray (Right Knee)',
      testDescription: 'Post-operative assessment',
      status: 'IN_PROGRESS',
    },
  ];

  for (const lab of labData) {
    await prisma.labReport.upsert({
      where: { reportId: lab.reportId },
      update: lab,
      create: lab,
    });
  }
  console.log(`✅ ${labData.length} lab reports seeded`);

  // Create billing
  const billingData = [
    {
      invoiceId: 'INV-0001',
      patientId: patients[0].id,
      totalAmount: 1300,
      paidAmount: 1300,
      status: 'PAID',
      paymentMethod: 'CARD',
      items: [
        { description: 'Cardiology Consultation', amount: 800, type: 'CONSULTATION' },
        { description: 'CBC Test', amount: 500, type: 'LAB_TEST' },
      ],
    },
    {
      invoiceId: 'INV-0002',
      patientId: patients[2].id,
      totalAmount: 2500,
      paidAmount: 1000,
      status: 'PARTIAL',
      paymentMethod: 'CASH',
      items: [
        { description: 'Cardiology Consultation', amount: 800, type: 'CONSULTATION' },
        { description: 'Lipid Profile Test', amount: 700, type: 'LAB_TEST' },
        { description: 'Medication - Metformin, Amlodipine', amount: 1000, type: 'MEDICINE' },
      ],
    },
    {
      invoiceId: 'INV-0003',
      patientId: patients[4].id,
      totalAmount: 5000,
      paidAmount: 0,
      status: 'PENDING',
      items: [
        { description: 'Orthopedic Consultation', amount: 1000, type: 'CONSULTATION' },
        { description: 'X-Ray', amount: 1500, type: 'LAB_TEST' },
        { description: 'Knee Brace', amount: 2500, type: 'PROCEDURE' },
      ],
    },
  ];

  for (const b of billingData) {
    const existing = await prisma.billing.findUnique({ where: { invoiceId: b.invoiceId } });
    if (!existing) {
      await prisma.billing.create({
        data: {
          invoiceId: b.invoiceId,
          patientId: b.patientId,
          totalAmount: b.totalAmount,
          paidAmount: b.paidAmount,
          status: b.status,
          paymentMethod: b.paymentMethod,
          items: {
            create: b.items,
          },
        },
      });
    }
  }
  console.log(`✅ ${billingData.length} billing records seeded`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Default Login Credentials across all 6 Hospital Roles:');
  console.log('   👑 ADMIN:        admin@hospitalrun.io        / admin123');
  console.log('   👨‍⚕️ DOCTOR:       dr.sharma@hospitalrun.io    / doctor123');
  console.log('   👩‍⚕️ NURSE:        nurse@hospitalrun.io        / nurse123');
  console.log('   🏢 RECEPTIONIST: receptionist@hospitalrun.io / reception123');
  console.log('   💊 PHARMACIST:   pharmacist@hospitalrun.io   / pharma123');
  console.log('   🧪 LAB_TECH:     labtech@hospitalrun.io      / labtech123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
