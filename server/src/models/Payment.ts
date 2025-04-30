import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';
import { TimeEntryDocument } from './TimeEntry';

export interface IPayment {
  freelancer: IUser['_id'];
  client: IUser['_id'];
  timeEntries: TimeEntryDocument['_id'][];
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod: 'bank_transfer' | 'paypal' | 'stripe';
  paymentDetails: {
    transactionId?: string;
    paymentDate?: Date;
    notes?: string;
  };
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentDocument extends IPayment, Document {
  isOverdue: boolean;
}

const paymentSchema = new Schema<PaymentDocument>({
  freelancer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Freelancer ist erforderlich']
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Kunde ist erforderlich']
  },
  timeEntries: [{
    type: Schema.Types.ObjectId,
    ref: 'TimeEntry',
    required: [true, 'Zeiteinträge sind erforderlich']
  }],
  amount: {
    type: Number,
    required: [true, 'Betrag ist erforderlich'],
    min: [0, 'Betrag muss positiv sein']
  },
  currency: {
    type: String,
    required: [true, 'Währung ist erforderlich'],
    default: 'EUR',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'stripe'],
    required: [true, 'Zahlungsmethode ist erforderlich']
  },
  paymentDetails: {
    transactionId: String,
    paymentDate: Date,
    notes: String
  },
  dueDate: {
    type: Date,
    required: [true, 'Fälligkeitsdatum ist erforderlich']
  },
  paidAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indizes für schnelle Suche
paymentSchema.index({ freelancer: 1, status: 1 });
paymentSchema.index({ client: 1, status: 1 });
paymentSchema.index({ dueDate: 1 });
paymentSchema.index({ 'paymentDetails.transactionId': 1 });

// Virtuelle Felder
paymentSchema.virtual('isOverdue').get(function(this: PaymentDocument) {
  return this.status === 'pending' && new Date() > this.dueDate;
});

// Pre-Save Hook für Status-Updates
paymentSchema.pre('save', function(this: PaymentDocument, next) {
  if (this.isModified('status') && this.status === 'completed' && !this.paidAt) {
    this.paidAt = new Date();
  }
  next();
});

export const Payment = mongoose.model<PaymentDocument>('Payment', paymentSchema); 