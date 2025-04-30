import mongoose, { Schema, Document, Types, Model } from 'mongoose';
import { IUser } from './User';

export interface ITimeEntry {
  freelancer: IUser['_id'];
  client: IUser['_id'];
  project: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  status: 'pending' | 'approved' | 'rejected';
  hourlyRate: number;
  totalAmount: number;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntryDocument extends ITimeEntry, Document {
  formattedDuration: string;
  durationInHours: string;
  durationInMinutes: number;
  isActive: boolean;
}

interface TimeEntryModel extends Model<TimeEntryDocument> {
  getStats(userId: string, startDate: Date, endDate: Date): Promise<any>;
}

const timeEntrySchema = new Schema<TimeEntryDocument, TimeEntryModel>({
  freelancer: {
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'Freelancer ist erforderlich']
  },
  client: {
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'Kunde ist erforderlich']
  },
  project: {
    type: String,
    required: [true, 'Projekt ist erforderlich'],
    trim: true
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
    type: Date
  },
  duration: {
    type: Number,
    required: [true, 'Dauer ist erforderlich'],
    min: [0, 'Dauer muss positiv sein']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Stundensatz ist erforderlich'],
    min: [0, 'Stundensatz muss positiv sein']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Gesamtbetrag ist erforderlich'],
    min: [0, 'Gesamtbetrag muss positiv sein']
  },
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
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

// Virtuelle Felder für formatierte Zeit
timeEntrySchema.virtual('formattedDuration').get(function(this: TimeEntryDocument) {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(' ');
});

timeEntrySchema.virtual('durationInHours').get(function(this: TimeEntryDocument) {
  return (this.duration / 3600).toFixed(2);
});

timeEntrySchema.virtual('durationInMinutes').get(function(this: TimeEntryDocument) {
  return Math.round(this.duration / 60);
});

// Virtuelle Felder
timeEntrySchema.virtual('isActive').get(function(this: TimeEntryDocument) {
  return !this.endTime;
});

// Compound Indizes für häufig verwendete Abfragen
timeEntrySchema.index({ freelancer: 1, status: 1 });
timeEntrySchema.index({ client: 1, status: 1 });
timeEntrySchema.index({ startTime: 1 });
timeEntrySchema.index({ project: 1 });

// Pre-save Middleware für automatische Berechnungen
timeEntrySchema.pre('save', function(this: TimeEntryDocument, next) {
  if (this.isModified('duration') || this.isModified('hourlyRate')) {
    this.totalAmount = (this.duration / 60) * this.hourlyRate;
  }
  if (this.isModified('startTime') || this.isModified('endTime')) {
    if (this.endTime) {
      this.duration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / 1000);
    }
  }
  this.updatedAt = new Date();
  next();
});

// Validierung für Start- und Endzeit
timeEntrySchema.pre('validate', function(this: TimeEntryDocument, next) {
  if (this.endTime && this.startTime >= this.endTime) {
    this.invalidate('endTime', 'Endzeit muss nach Startzeit liegen');
  }
  next();
});

// Statische Methode für Statistiken
timeEntrySchema.static('getStats', async function(userId: string, startDate: Date, endDate: Date) {
  const pipeline = [
    {
      $match: {
        userId: new Types.ObjectId(userId),
        startTime: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          project: '$project'
        },
        totalDuration: { $sum: '$duration' },
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        minDuration: { $min: '$duration' },
        maxDuration: { $max: '$duration' }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        projects: {
          $push: {
            name: '$_id.project',
            duration: '$totalDuration',
            count: '$count',
            avgDuration: '$avgDuration',
            minDuration: '$minDuration',
            maxDuration: '$maxDuration'
          }
        },
        totalDuration: { $sum: '$totalDuration' },
        totalCount: { $sum: '$count' }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        projects: 1,
        totalHours: { $round: [{ $divide: ['$totalDuration', 3600] }, 2] },
        totalMinutes: { $round: ['$totalDuration', 0] },
        totalCount: 1,
        averageMinutesPerEntry: {
          $round: [{ $divide: ['$totalDuration', '$totalCount'] }, 0]
        }
      }
    },
    { $sort: { date: 1 as const } }
  ];

  return this.aggregate(pipeline);
});

// Optionen für virtuelle Felder
timeEntrySchema.set('toJSON', { virtuals: true });
timeEntrySchema.set('toObject', { virtuals: true });

export const TimeEntry = mongoose.model<TimeEntryDocument, TimeEntryModel>('TimeEntry', timeEntrySchema); 