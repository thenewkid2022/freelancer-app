import mongoose, { Schema, Document, Types, Model } from 'mongoose';
import { IUser } from './User';

export interface ITimeEntry {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntryDocument extends Document {
  user: Types.ObjectId | IUser;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
  formattedDuration: string;
  durationInHours: number;
}

interface TimeEntryModel extends Model<TimeEntryDocument> {
  getStats(userId: Types.ObjectId, startDate: Date, endDate: Date): Promise<any>;
}

export const timeEntrySchema = new Schema<TimeEntryDocument>({
  user: {
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'Benutzer ist erforderlich']
  },
  description: {
    type: String,
    required: [true, 'Beschreibung ist erforderlich'],
    trim: true
  },
  startTime: {
    type: Date,
    required: [true, 'Startzeit ist erforderlich']
  },
  endTime: {
    type: Date,
    required: [true, 'Endzeit ist erforderlich']
  },
  duration: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtuelle Felder für formatierte Zeit
timeEntrySchema.virtual('formattedDuration').get(function(this: TimeEntryDocument) {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
});

timeEntrySchema.virtual('durationInHours').get(function(this: TimeEntryDocument) {
  return this.duration / 3600;
});

// Pre-save Middleware für automatische Berechnungen
timeEntrySchema.pre('save', function(this: TimeEntryDocument, next) {
  this.duration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / 1000);
  next();
});

// Validierung für Start- und Endzeit
timeEntrySchema.pre('validate', function(this: TimeEntryDocument, next) {
  if (this.startTime && this.endTime && this.startTime.getTime() >= this.endTime.getTime()) {
    this.invalidate('endTime', 'Endzeit muss nach Startzeit liegen');
  }
  next();
});

// Statische Methode für Statistiken
timeEntrySchema.statics.getStats = async function(userId: Types.ObjectId, startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        user: userId,
        startTime: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } }
        },
        totalHours: { $sum: { $divide: ['$duration', 3600] } },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id.date',
        totalHours: { $round: ['$totalHours', 2] },
        count: 1
      }
    },
    {
      $sort: { date: 1 }
    }
  ]);
};

// Optionen für virtuelle Felder
timeEntrySchema.set('toJSON', { virtuals: true });
timeEntrySchema.set('toObject', { virtuals: true });

const TimeEntry = mongoose.model<TimeEntryDocument, TimeEntryModel>('TimeEntry', timeEntrySchema);

export { TimeEntry };
export default TimeEntry; 