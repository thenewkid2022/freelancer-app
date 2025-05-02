import mongoose, { Schema, Document, Types, Model } from 'mongoose';
import { IUser } from './User';

export interface IPayment {
  _id: Types.ObjectId;
  project: Types.ObjectId;
  freelancer: Types.ObjectId | IUser;
  client: Types.ObjectId | IUser;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'bank_transfer' | 'paypal';
  paymentIntentId?: string;
  transferId?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentDocument extends Document {
  project: Types.ObjectId;
  freelancer: Types.ObjectId | IUser;
  client: Types.ObjectId | IUser;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'bank_transfer' | 'paypal';
  paymentIntentId?: string;
  transferId?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentModel extends Model<PaymentDocument> {
  getStats(userId: Types.ObjectId, startDate: Date, endDate: Date): Promise<any>;
}

export const paymentSchema = new Schema<PaymentDocument>({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  freelancer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    required: true,
    default: 'EUR',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'bank_transfer', 'paypal'],
    required: true,
  },
  paymentIntentId: {
    type: String,
  },
  transferId: {
    type: String,
  },
  description: {
    type: String,
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true
});

// Statische Methode für Statistiken
paymentSchema.statics.getStats = async function(userId: Types.ObjectId, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { freelancer: userId },
          { client: userId }
        ],
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          status: '$status'
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id.date',
        status: '$_id.status',
        totalAmount: { $round: ['$totalAmount', 2] },
        count: 1
      }
    },
    {
      $sort: { date: 1, status: 1 }
    }
  ]);
};

const Payment = mongoose.model<PaymentDocument, PaymentModel>('Payment', paymentSchema);

export { Payment };
export default Payment; 