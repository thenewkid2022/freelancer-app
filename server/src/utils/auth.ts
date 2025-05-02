import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser } from '../models/User';
import { config } from '../config';

export const generateToken = (user: IUser): string => {
  const payload = {
    id: user._id
  };
  
  const options: SignOptions = {
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  };
  
  return jwt.sign(payload, config.JWT_SECRET, options);
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    throw new Error('Ungültiger Token');
  }
}; 