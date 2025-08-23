"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.userSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: [true, 'Email ist erforderlich'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Bitte geben Sie eine gültige E-Mail-Adresse ein']
    },
    password: {
        type: String,
        required: [true, 'Passwort ist erforderlich'],
        minlength: [6, 'Passwort muss mindestens 6 Zeichen lang sein']
    },
    firstName: {
        type: String,
        required: [true, 'Vorname ist erforderlich'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Nachname ist erforderlich'],
        trim: true
    },
    role: {
        type: String,
        enum: {
            values: ['admin', 'freelancer'],
            message: '{VALUE} ist keine gültige Rolle'
        },
        required: [true, 'Rolle ist erforderlich']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    settings: {
        darkMode: { type: Boolean, default: false },
        language: { type: String, default: 'de' },
        emailNotifications: { type: Boolean, default: true }
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            return ret;
        }
    },
    toObject: {
        transform: function (doc, ret) {
            delete ret.password;
            return ret;
        }
    }
});
// Virtuelle Eigenschaften
exports.userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});
// Pre-save Middleware
exports.userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    const salt = await bcryptjs_1.default.genSalt(10);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
    next();
});
// Instanz-Methoden
exports.userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
exports.userSchema.methods.generateAuthToken = function () {
    return jsonwebtoken_1.default.sign({
        userId: this._id,
        email: this.email,
        role: this.role
    }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
};
exports.userSchema.methods.deactivate = async function () {
    this.isActive = false;
    await this.save();
};
exports.userSchema.methods.activate = async function () {
    this.isActive = true;
    await this.save();
};
const User = mongoose_1.default.model('User', exports.userSchema);
exports.default = User;
