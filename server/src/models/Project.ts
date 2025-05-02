import mongoose, { Schema, Document, Types } from 'mongoose';
import { IUser } from './User';

export interface IProject extends Document {
  name: string;
  description: string;
  client: Types.ObjectId | IUser;
  freelancer: Types.ObjectId | IUser;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export const projectSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Projektname ist erforderlich'],
    trim: true,
    minlength: [2, 'Projektname muss mindestens 2 Zeichen lang sein']
  },
  description: {
    type: String,
    required: [true, 'Projektbeschreibung ist erforderlich'],
    trim: true
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client ist erforderlich']
  },
  freelancer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Freelancer ist erforderlich']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

const Project = mongoose.model<IProject>('Project', projectSchema);

export default Project; 