import mongoose, { Schema, Document } from 'mongoose';

export type VerificationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED';

export interface IVerificationRequest extends Document {
  ownerId: mongoose.Types.ObjectId;
  identityType: string; // e.g. 'Government Issued ID (KYC)'
  kycReferenceId: string;
  businessDocUrl?: string;
  licenseNumber?: string;
  documentType?: string;
  additionalNotes?: string;
  status: VerificationRequestStatus;
  adminNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationRequestSchema: Schema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'Owner', required: true },
    identityType: { type: String, required: true },
    kycReferenceId: { type: String, required: true },
    businessDocUrl: { type: String, default: '' },
    licenseNumber: { type: String, default: '' },
    documentType: { type: String, default: 'Business License' },
    additionalNotes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'INFO_REQUESTED'],
      default: 'PENDING'
    },
    adminNotes: { type: String, default: '' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model<IVerificationRequest>('VerificationRequest', VerificationRequestSchema);
