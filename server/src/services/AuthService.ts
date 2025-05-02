import User from '../models/User';
import { IUser } from '../models/User';
import { AuthError } from '../utils/errors';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { Document } from 'mongoose';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  role: 'admin' | 'freelancer' | 'client';
}

export interface AuthResponse {
  user: Omit<IUser, 'password'>;
  token: string;
}

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new AuthError('E-Mail-Adresse wird bereits verwendet');
      }

      const user = await User.create(data);
      const token = this.generateToken(user);

      return {
        user: this.sanitizeUser(user),
        token
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Registrierung fehlgeschlagen');
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const user = await User.findOne({ email: credentials.email });
      if (!user) {
        throw new AuthError('Ungültige Anmeldedaten', 401);
      }

      const isPasswordValid = await user.comparePassword(credentials.password);
      if (!isPasswordValid) {
        throw new AuthError('Ungültige Anmeldedaten', 401);
      }

      if (!user.isActive) {
        throw new AuthError('Konto ist deaktiviert', 403);
      }

      user.lastLogin = new Date();
      await user.save();

      const token = this.generateToken(user);

      return {
        user: this.sanitizeUser(user),
        token
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Anmeldung fehlgeschlagen');
    }
  }

  private generateToken(user: IUser): string {
    const payload = { id: user._id };
    const options: SignOptions = { expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] };
    return jwt.sign(payload, config.JWT_SECRET as jwt.Secret, options);
  }

  async validateToken(token: string): Promise<IUser> {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as { id: string };
      const user = await User.findById(decoded.id);
      
      if (!user || !user.isActive) {
        throw new AuthError('Ungültiger Token', 401);
      }

      return user;
    } catch (error) {
      throw new AuthError('Ungültiger Token', 401);
    }
  }

  private sanitizeUser(user: IUser & Document): Omit<IUser, 'password'> {
    const sanitized = user.toObject();
    delete sanitized.password;
    return sanitized;
  }
} 