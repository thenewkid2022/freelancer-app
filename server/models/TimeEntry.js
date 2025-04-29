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
    required: true,
    trim: true,
    maxlength: 500
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
    required: true,
    min: 0
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
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

// Compound Indizes für häufig verwendete Abfragen
timeEntrySchema.index({ userId: 1, startTime: -1 });
timeEntrySchema.index({ project: 1, startTime: -1 });
timeEntrySchema.index({ userId: 1, project: 1, startTime: -1 });

// Pre-save Middleware für automatische Dauerberechnung
timeEntrySchema.pre('save', function(next) {
  if (this.isModified('startTime') || this.isModified('endTime')) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
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
  return this.aggregate([
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
        _id: null,
        totalDuration: { $sum: '$duration' },
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' }
      }
    }
  ]);
};

const TimeEntry = mongoose.model('TimeEntry', timeEntrySchema);

module.exports = TimeEntry;