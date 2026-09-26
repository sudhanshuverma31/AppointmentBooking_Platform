import mongoose, { Schema, Document } from 'mongoose';

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'NO_SHOW';

export interface IAppointment extends Document {
  userId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  customerName: string;
  age: number;
  gender: string;
  phone?: string;
  reason: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime?: string; // "10:30 AM" for TIME mode
  appointmentMode: 'TIME' | 'TOKEN';
  tokenNumber?: number; // 1, 2, ... for TOKEN mode
  status: AppointmentStatus;
  ownerNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'Owner', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    customerName: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    phone: { type: String, trim: true },
    reason: { type: String, required: true, trim: true },
    appointmentDate: { type: String, required: true }, // Format: YYYY-MM-DD
    appointmentTime: { type: String, default: '' },
    appointmentMode: { type: String, enum: ['TIME', 'TOKEN'], required: true },
    tokenNumber: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'],
      default: 'PENDING'
    },
    ownerNotes: { type: String, default: '' }
  },
  { timestamps: true }
);

AppointmentSchema.index({ ownerId: 1, appointmentDate: 1 });
AppointmentSchema.index({ userId: 1 });
AppointmentSchema.index({ ownerId: 1, appointmentDate: 1, appointmentTime: 1, status: 1 });

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);
