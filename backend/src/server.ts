import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import ownerRoutes from './routes/ownerRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { seedDatabase } from './config/seed.js';
import connectDB from './config/db.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { sanitizeInputMiddleware } from './middleware/security.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.FRONTEND_URL || 'https://appointmentbooking-platform-2.onrender.com,http://localhost:3000,http://localhost')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Security & Parsing Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply Security Sanitization & Global Rate Limiting
app.use(sanitizeInputMiddleware);
app.use('/api', apiLimiter);


// Static directory for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/owners', ownerRoutes);
// Owner dashboard actions use the singular /owner prefix in the frontend.
// Keep the plural public owner routes and expose the dashboard routes there too.
app.use('/api/owner', ownerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), message: 'CareSync API Server Running' });
});

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed initial data
    const CategoryModel = mongoose.model('Category');
    const catCount = await CategoryModel.countDocuments();
    if (catCount === 0) {
      console.log('Database empty. Seeding initial categories, admin, and demo verified providers...');
      await seedDatabase();
    }

    app.listen(PORT, () => {
      console.log(`🚀 CareSync Backend Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
};

startServer();
