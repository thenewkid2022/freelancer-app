const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  project: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  hourlyRate: {
    type: Number,
    default: 0
  },
  billable: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'billed'],
    default: 'completed'
  },
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
timeEntrySchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(' ');
});

timeEntrySchema.virtual('durationInHours').get(function() {
  return (this.duration / 3600).toFixed(2);
});

timeEntrySchema.virtual('durationInMinutes').get(function() {
  return Math.round(this.duration / 60);
});

// Compound Indizes für häufig verwendete Abfragen
timeEntrySchema.index({ userId: 1, startTime: -1 });
timeEntrySchema.index({ project: 1, startTime: -1 });
timeEntrySchema.index({ userId: 1, project: 1, startTime: -1 });

// Pre-save Middleware für automatische Dauerberechnung
timeEntrySchema.pre('save', function(next) {
  if (this.isModified('startTime') || this.isModified('endTime')) {
    // Berechne die exakte Dauer in Sekunden
    this.duration = Math.round((this.endTime - this.startTime) / 1000);
  }
  this.updatedAt = new Date();
  next();
});

// Validierung für Start- und Endzeit
timeEntrySchema.pre('validate', function(next) {
  if (this.startTime >= this.endTime) {
    this.invalidate('endTime', 'Endzeit muss nach Startzeit liegen');
  }
  next();
});

// Statische Methode für Statistiken
timeEntrySchema.statics.getStats = async function(userId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        startTime: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
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
    { $sort: { date: 1 } }
  ];

  return this.aggregate(pipeline);
};

// Optionen für virtuelle Felder
timeEntrySchema.set('toJSON', { virtuals: true });
timeEntrySchema.set('toObject', { virtuals: true });

const TimeEntry = mongoose.model('TimeEntry', timeEntrySchema);

module.exports = TimeEntry;