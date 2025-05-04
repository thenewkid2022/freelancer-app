import mongoose, { Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'freelancer';
  settings: {
    darkMode: boolean;
    language: 'de' | 'en' | 'es';
  };
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  fullName: string;
}

export interface UserDocument extends Omit<Document, '_id'>, IUser {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  deactivate(): Promise<void>;
  activate(): Promise<void>;
}

export const userSchema = new mongoose.Schema({
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
  settings: {
    darkMode: { type: Boolean, default: false },
    language: { type: String, enum: ['de', 'en', 'es'], default: 'de' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Virtuelle Eigenschaften
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save Middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instanz-Methoden
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function(): string {
  return jwt.sign(
    { 
      userId: this._id,
      email: this.email,
      role: this.role
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

userSchema.methods.deactivate = async function(): Promise<void> {
  this.isActive = false;
  await this.save();
};

userSchema.methods.activate = async function(): Promise<void> {
  this.isActive = true;
  await this.save();
};

const User = mongoose.model<UserDocument>('User', userSchema);

export default User; 