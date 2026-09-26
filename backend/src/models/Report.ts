import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  reporterUserId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  reason: string;
  description: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    reporterUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'Owner', required: true },
    reason: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'],
      default: 'PENDING'
    },
    resolutionNotes: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model<IReport>('Report', ReportSchema);
