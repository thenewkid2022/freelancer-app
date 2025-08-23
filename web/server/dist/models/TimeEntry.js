"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeEntry = exports.timeEntrySchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.timeEntrySchema = new mongoose_1.Schema({
    projectNumber: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: false,
    },
    duration: {
        type: Number,
        required: false,
    },
    correctedDuration: {
        type: Number,
        required: false,
    },
    tags: [{ type: String }]
}, {
    timestamps: true
});
// Virtuelle Felder für formatierte Zeit
exports.timeEntrySchema.virtual('formattedDuration').get(function () {
    const hours = Math.floor((this.duration ?? 0) / 3600);
    const minutes = Math.floor(((this.duration ?? 0) % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
});
exports.timeEntrySchema.virtual('durationInHours').get(function () {
    return (this.duration ?? 0) / 3600;
});
// Pre-save Middleware für automatische Berechnungen
exports.timeEntrySchema.pre('save', function (next) {
    if (this.endTime && this.startTime) {
        this.duration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / 1000);
    }
    else {
        this.duration = undefined;
    }
    next();
});
// Validierung für Start- und Endzeit
exports.timeEntrySchema.pre('validate', function (next) {
    if (this.startTime && this.endTime && this.startTime.getTime() >= this.endTime.getTime()) {
        this.invalidate('endTime', 'Endzeit muss nach Startzeit liegen');
    }
    next();
});
// Index für effiziente Aggregation
// Für häufige Filterungen und Gruppierungen nach userId, projectNumber und startTime
// Siehe /api/time-entries/merged
exports.timeEntrySchema.index({ userId: 1, projectNumber: 1, startTime: 1 });
// Statische Methode für Statistiken
exports.timeEntrySchema.statics.getStats = async function (userId, startDate, endDate) {
    return this.aggregate([
        {
            $match: {
                userId: userId,
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
exports.timeEntrySchema.set('toJSON', { virtuals: true });
exports.timeEntrySchema.set('toObject', { virtuals: true });
const TimeEntry = mongoose_1.default.model('TimeEntry', exports.timeEntrySchema);
exports.TimeEntry = TimeEntry;
exports.default = TimeEntry;
