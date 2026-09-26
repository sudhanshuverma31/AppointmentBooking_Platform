import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Owner from '../models/Owner.js';
import Appointment from '../models/Appointment.js';
import VerificationRequest from '../models/VerificationRequest.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI

const initialCategories = [
  { name: 'Doctor', icon: 'Stethoscope', description: 'Certified physicians, cardiologists, pediatricians, & specialists' },
  { name: 'Dentist', icon: 'Smile', description: 'Dental checkups, root canals, alignment, & cosmetic dentistry' },
  { name: 'Salon', icon: 'Scissors', description: 'Hair styling, grooming, spa treatments, & beauty parlors' },
  { name: 'Gym', icon: 'Dumbbell', description: 'Fitness centers, weight training, & wellness clubs' },
  { name: 'Fitness Trainer', icon: 'Activity', description: 'Personalized physical training & diet management' },
  { name: 'Consultant', icon: 'Briefcase', description: 'Business strategy, financial advice, & career counseling' },
  { name: 'Lawyer', icon: 'Scale', description: 'Legal advisory, corporate law, family law, & litigation' },
  { name: 'Tutor', icon: 'BookOpen', description: 'Academic tutoring, language learning, & entrance prep' },
  { name: 'Therapist', icon: 'Heart', description: 'Mental health, counseling, & psychotherapy professionals' },
  { name: 'Mechanic', icon: 'Wrench', description: 'Automobile repair, diagnostic tuning, & engine overhaul' },
  { name: 'Car Service', icon: 'Car', description: 'Car washing, detailing, oil change, & maintenance' },
  { name: 'Photographer', icon: 'Camera', description: 'Event photography, portraits, studio shoots, & wedding videography' },
  { name: 'Makeup Artist', icon: 'Sparkles', description: 'Bridal makeup, fashion styling, & skincare consultation' },
  { name: 'Electrician', icon: 'Zap', description: 'Electrical repairs, wiring installations, & power backup' },
  { name: 'Plumber', icon: 'Droplet', description: 'Pipeline repairs, drainage cleaning, & bathroom fitting' },
];

export const seedDatabase = async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is required to seed the database');
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    }

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Owner.deleteMany({});
    await Appointment.deleteMany({});
    await VerificationRequest.deleteMany({});

    console.log('Seeding categories...');
    const createdCategories = [];
    for (const cat of initialCategories) {
      const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const c = await Category.create({ ...cat, slug, isActive: true });
      createdCategories.push(c);
    }

    const doctorCat = createdCategories.find(c => c.name === 'Doctor')!._id;
    const dentistCat = createdCategories.find(c => c.name === 'Dentist')!._id;
    const salonCat = createdCategories.find(c => c.name === 'Salon')!._id;
    const lawyerCat = createdCategories.find(c => c.name === 'Lawyer')!._id;

    console.log('Seeding admin user...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'System Admin',
      email: 'admin@appointment.com',
      password: hashedAdminPassword,
      role: 'ADMIN',
      mobile: '+91 9876543210',
    });

    console.log('Seeding regular demo user...');
    const hashedUserPassword = await bcrypt.hash('user123', 10);
    const demoUser = await User.create({
      name: 'Rahul Kumar',
      email: 'user@example.com',
      password: hashedUserPassword,
      role: 'USER',
      mobile: '+91 9123456789',
    });

    console.log('Seeding verified service providers (Owners)...');
    const hashedOwnerPassword = await bcrypt.hash('owner123', 10);

    // Owner 1: Dr. Rahul Sharma (Verified Doctor - Lucknow, UP)
    const owner1User = await User.create({
      name: 'Dr. Rahul Sharma',
      email: 'doctor@example.com',
      password: hashedOwnerPassword,
      role: 'OWNER',
      mobile: '+91 9988776655',
    });

    const owner1 = await Owner.create({
      userId: owner1User._id,
      fullName: 'Dr. Rahul Sharma',
      email: 'doctor@example.com',
      mobile: '+91 9988776655',
      title: 'Senior Cardiologist & Internal Medicine Specialist',
      description: 'Over 15 years of clinical expertise treating complex cardiovascular disorders. Trained at premier medical institutions with state-of-the-art diagnostic facilities.',
      categoryId: doctorCat,
      profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
      bannerImages: [
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200&auto=format&fit=crop&q=80',
      ],
      outletName: 'City Care Cardiology Center',
      country: 'India',
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      address: 'Suite 402, Hazratganj Medical Enclave, Lucknow, UP',
      appointmentMode: 'TIME',
      slotDurationMinutes: 30,
      activeStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      kycStatus: 'VERIFIED',
      kycProvider: 'InstantID Compliant KYC Provider',
      kycReferenceId: 'KYC-88492019',
      verifiedAt: new Date(),
    });

    // Owner 2: Priya Verma (Verified Salon - Delhi)
    const owner2User = await User.create({
      name: 'Priya Verma',
      email: 'priya@glamstudio.com',
      password: hashedOwnerPassword,
      role: 'OWNER',
      mobile: '+91 9811223344',
    });

    const owner2 = await Owner.create({
      userId: owner2User._id,
      fullName: 'Priya Verma',
      email: 'priya@glamstudio.com',
      mobile: '+91 9811223344',
      title: 'Master Hair Stylist & Aesthetician',
      description: 'Luxury hair styling, organic skincare rituals, and bridal couture styling with over 10 years of boutique studio experience.',
      categoryId: salonCat,
      profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      bannerImages: [
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop&q=80',
      ],
      outletName: 'Glamour Lounge & Spa',
      country: 'India',
      state: 'Delhi',
      district: 'South Delhi',
      address: 'Plot 14, Greater Kailash Part 2, New Delhi',
      appointmentMode: 'TOKEN',
      dailyCapacity: 30,
      activeStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      kycStatus: 'VERIFIED',
      kycProvider: 'InstantID Compliant KYC Provider',
      kycReferenceId: 'KYC-90412847',
      verifiedAt: new Date(),
    });

    // Owner 3: Dr. Amit Mehta (Verified Dentist - Mumbai, Maharashtra)
    const owner3User = await User.create({
      name: 'Dr. Amit Mehta',
      email: 'amit@smileclinic.com',
      password: hashedOwnerPassword,
      role: 'OWNER',
      mobile: '+91 9822334455',
    });

    await Owner.create({
      userId: owner3User._id,
      fullName: 'Dr. Amit Mehta',
      email: 'amit@smileclinic.com',
      mobile: '+91 9822334455',
      title: 'Orthodontist & Cosmetic Dentist',
      description: 'Specialist in dental implants, clear aligners, and pain-free laser dentistry using world-class technology.',
      categoryId: dentistCat,
      profileImage: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
      bannerImages: [
        'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&auto=format&fit=crop&q=80',
      ],
      outletName: 'Apex Dental & Maxillofacial Care',
      country: 'India',
      state: 'Maharashtra',
      district: 'Mumbai',
      address: 'G-04, Bandra Kurla Complex, Mumbai, MH',
      appointmentMode: 'TIME',
      slotDurationMinutes: 30,
      activeStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      kycStatus: 'VERIFIED',
      kycProvider: 'InstantID Compliant KYC Provider',
      kycReferenceId: 'KYC-11029384',
      verifiedAt: new Date(),
    });

    // Owner 4: Adv. Ananya Roy (Pending Verification - Bangalore, Karnataka)
    const owner4User = await User.create({
      name: 'Adv. Ananya Roy',
      email: 'ananya@roylegal.com',
      password: hashedOwnerPassword,
      role: 'OWNER',
      mobile: '+91 9744556677',
    });

    const owner4 = await Owner.create({
      userId: owner4User._id,
      fullName: 'Adv. Ananya Roy',
      email: 'ananya@roylegal.com',
      mobile: '+91 9744556677',
      title: 'Corporate Legal Advisor & IPR Advocate',
      description: 'Providing legal consulting for startups, intellectual property filings, contract vetting, and commercial arbitration.',
      categoryId: lawyerCat,
      profileImage: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80',
      bannerImages: [
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&auto=format&fit=crop&q=80',
      ],
      outletName: 'Roy & Associates Legal Firm',
      country: 'India',
      state: 'Karnataka',
      district: 'Bengaluru',
      address: 'Level 5, MG Road Financial Tower, Bengaluru, KA',
      appointmentMode: 'TIME',
      slotDurationMinutes: 45,
      activeStatus: 'ACTIVE',
      verificationStatus: 'PENDING',
      kycStatus: 'PENDING',
    });

    await VerificationRequest.create({
      ownerId: owner4._id,
      identityType: 'Aadhaar / Government Verified ID',
      kycReferenceId: 'KYC-PENDING-44910',
      businessDocUrl: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&auto=format&fit=crop&q=80',
      licenseNumber: 'BAR-KAR-2018-99201',
      documentType: 'Bar Council Registration Certificate',
      additionalNotes: 'Uploaded official Bar Council registration proof for review.',
      status: 'PENDING',
    });

    // Seed sample appointments
    const todayStr = new Date().toISOString().split('T')[0];

    await Appointment.create({
      userId: demoUser._id,
      ownerId: owner1._id,
      categoryId: doctorCat,
      customerName: 'Rahul Kumar',
      age: 28,
      gender: 'Male',
      phone: '+91 9123456789',
      reason: 'Routine cardiovascular checkup & ECG review',
      appointmentDate: todayStr,
      appointmentTime: '10:30 AM',
      appointmentMode: 'TIME',
      status: 'CONFIRMED',
      ownerNotes: 'Patient requested morning follow-up call.',
    });

    await Appointment.create({
      userId: demoUser._id,
      ownerId: owner2._id,
      categoryId: salonCat,
      customerName: 'Siddharth Roy',
      age: 32,
      gender: 'Male',
      phone: '+91 9123456789',
      reason: 'Hair styling and grooming session',
      appointmentDate: todayStr,
      appointmentMode: 'TOKEN',
      tokenNumber: 1,
      status: 'PENDING',
    });

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
};

if (process.argv[1] && process.argv[1].includes('seed.ts')) {
  seedDatabase().then(() => process.exit(0));
}
