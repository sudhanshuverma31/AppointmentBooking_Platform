import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'USER' | 'OWNER' | 'ADMIN';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  mobile?: string;
  googleId?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    role: { type: String, enum: ['USER', 'OWNER', 'ADMIN'], default: 'USER' },
    mobile: { type: String, trim: true },
    googleId: { type: String },
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
