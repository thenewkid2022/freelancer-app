import { User, IUser } from '../models/User';
import { AuthError } from '../utils/errors';
import jwt from 'jsonwebtoken';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
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
        throw new AuthError('Benutzer mit dieser E-Mail existiert bereits');
      }

      const user = await User.create(data);
      const token = user.generateAuthToken();

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
        throw new AuthError('Ungültige Anmeldedaten');
      }

      const isPasswordValid = await user.comparePassword(credentials.password);
      if (!isPasswordValid) {
        throw new AuthError('Ungültige Anmeldedaten');
      }

      if (!user.isActive) {
        throw new AuthError('Konto ist deaktiviert');
      }

      user.lastLogin = new Date();
      await user.save();

      const token = user.generateAuthToken();

      return {
        user: this.sanitizeUser(user),
        token
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Anmeldung fehlgeschlagen');
    }
  }

  async validateToken(token: string): Promise<IUser> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
      const user = await User.findById(decoded.id);
      
      if (!user || !user.isActive) {
        throw new AuthError('Ungültiger Token');
      }

      return user;
    } catch (error) {
      throw new AuthError('Ungültiger Token');
    }
  }

  private sanitizeUser(user: IUser): Omit<IUser, 'password'> {
    const sanitized = user.toObject();
    delete sanitized.password;
    return sanitized;
  }
} 