import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment_booking_db';
  try {
    console.log('Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('Successfully connected to MongoDB database!');
  } catch (err: any) {
    console.error('MongoDB connection failed:', err?.message || err);
    throw err;
  }
};

export default connectDB;
