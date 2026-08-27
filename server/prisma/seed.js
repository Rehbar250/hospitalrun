const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hospitalrun.io' },
    update: {},
    create: {
      email: 'admin@hospitalrun.io',
      password: hashedPassword,
      name: 'System Admin',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.email);

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
  const medicines = await Promise.all([
    prisma.medicine.create({ data: { name: 'Paracetamol 500mg', manufacturer: 'Cipla', category: 'Analgesic', price: 25, stock: 500, expiryDate: new Date('2027-06-30') } }),
    prisma.medicine.create({ data: { name: 'Amoxicillin 250mg', manufacturer: 'Sun Pharma', category: 'Antibiotic', price: 85, stock: 200, expiryDate: new Date('2027-03-15') } }),
    prisma.medicine.create({ data: { name: 'Metformin 500mg', manufacturer: 'Dr. Reddy\'s', category: 'Antidiabetic', price: 45, stock: 350, expiryDate: new Date('2027-09-20') } }),
    prisma.medicine.create({ data: { name: 'Amlodipine 5mg', manufacturer: 'Lupin', category: 'Antihypertensive', price: 55, stock: 8, expiryDate: new Date('2027-01-10') } }),
    prisma.medicine.create({ data: { name: 'Omeprazole 20mg', manufacturer: 'Cipla', category: 'Antacid', price: 65, stock: 150, expiryDate: new Date('2027-12-31') } }),
    prisma.medicine.create({ data: { name: 'Cetirizine 10mg', manufacturer: 'GSK', category: 'Antihistamine', price: 15, stock: 5, expiryDate: new Date('2027-08-15') } }),
    prisma.medicine.create({ data: { name: 'Ibuprofen 400mg', manufacturer: 'Mankind', category: 'NSAID', price: 30, stock: 300, expiryDate: new Date('2027-05-20') } }),
    prisma.medicine.create({ data: { name: 'Azithromycin 500mg', manufacturer: 'Zydus', category: 'Antibiotic', price: 120, stock: 100, expiryDate: new Date('2027-04-10') } }),
  ]);
  console.log(`✅ ${medicines.length} medicines created`);

  // Create appointments
  const now = new Date();
  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        appointmentId: 'APT-0001',
        patientId: patients[0].id,
        doctorId: doctors[0].id,
        dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
        status: 'SCHEDULED',
        type: 'CHECKUP',
        notes: 'Regular cardiac checkup',
      },
    }),
    prisma.appointment.create({
      data: {
        appointmentId: 'APT-0002',
        patientId: patients[1].id,
        doctorId: doctors[1].id,
        dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30),
        status: 'SCHEDULED',
        type: 'CONSULTATION',
      },
    }),
    prisma.appointment.create({
      data: {
        appointmentId: 'APT-0003',
        patientId: patients[2].id,
        doctorId: doctors[0].id,
        dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0),
        status: 'IN_PROGRESS',
        type: 'FOLLOW_UP',
        notes: 'Follow-up for blood pressure monitoring',
      },
    }),
    prisma.appointment.create({
      data: {
        appointmentId: 'APT-0004',
        patientId: patients[3].id,
        doctorId: doctors[3].id,
        dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30),
        status: 'SCHEDULED',
        type: 'CONSULTATION',
      },
    }),
    prisma.appointment.create({
      data: {
        appointmentId: 'APT-0005',
        patientId: patients[4].id,
        doctorId: doctors[2].id,
        dateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 0),
        status: 'COMPLETED',
        type: 'CHECKUP',
        notes: 'Post-surgery knee evaluation',
      },
    }),
  ]);
  console.log(`✅ ${appointments.length} appointments created`);

  // Create lab reports
  const labReports = await Promise.all([
    prisma.labReport.create({
      data: {
        reportId: 'LAB-0001',
        patientId: patients[0].id,
        doctorId: doctors[0].id,
        testName: 'Complete Blood Count (CBC)',
        testDescription: 'Routine blood analysis',
        status: 'COMPLETED',
        result: 'All values within normal range. WBC: 7500, RBC: 5.2M, Hemoglobin: 14.5 g/dL',
      },
    }),
    prisma.labReport.create({
      data: {
        reportId: 'LAB-0002',
        patientId: patients[2].id,
        doctorId: doctors[0].id,
        testName: 'Lipid Profile',
        testDescription: 'Cholesterol and triglycerides analysis',
        status: 'PENDING',
      },
    }),
    prisma.labReport.create({
      data: {
        reportId: 'LAB-0003',
        patientId: patients[4].id,
        doctorId: doctors[2].id,
        testName: 'X-Ray (Right Knee)',
        testDescription: 'Post-operative assessment',
        status: 'IN_PROGRESS',
      },
    }),
  ]);
  console.log(`✅ ${labReports.length} lab reports created`);

  // Create billing
  const billings = await Promise.all([
    prisma.billing.create({
      data: {
        invoiceId: 'INV-0001',
        patientId: patients[0].id,
        totalAmount: 1300,
        paidAmount: 1300,
        status: 'PAID',
        paymentMethod: 'CARD',
        items: {
          create: [
            { description: 'Cardiology Consultation', amount: 800, type: 'CONSULTATION' },
            { description: 'CBC Test', amount: 500, type: 'LAB_TEST' },
          ],
        },
      },
    }),
    prisma.billing.create({
      data: {
        invoiceId: 'INV-0002',
        patientId: patients[2].id,
        totalAmount: 2500,
        paidAmount: 1000,
        status: 'PARTIAL',
        paymentMethod: 'CASH',
        items: {
          create: [
            { description: 'Cardiology Consultation', amount: 800, type: 'CONSULTATION' },
            { description: 'Lipid Profile Test', amount: 700, type: 'LAB_TEST' },
            { description: 'Medication - Metformin, Amlodipine', amount: 1000, type: 'MEDICINE' },
          ],
        },
      },
    }),
    prisma.billing.create({
      data: {
        invoiceId: 'INV-0003',
        patientId: patients[4].id,
        totalAmount: 5000,
        paidAmount: 0,
        status: 'PENDING',
        items: {
          create: [
            { description: 'Orthopedic Consultation', amount: 1000, type: 'CONSULTATION' },
            { description: 'X-Ray', amount: 1500, type: 'LAB_TEST' },
            { description: 'Knee Brace', amount: 2500, type: 'PROCEDURE' },
          ],
        },
      },
    }),
  ]);
  console.log(`✅ ${billings.length} billing records created`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Email: admin@hospitalrun.io');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
