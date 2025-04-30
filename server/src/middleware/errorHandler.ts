import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Mongoose Validierungsfehler
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Validierungsfehler',
      errors: Object.values(err.errors).map(e => ({
        path: e.path,
        message: e.message
      }))
    });
  }

  // Mongoose Cast-Fehler (z.B. ungültige ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      status: 'error',
      code: 'INVALID_ID',
      message: 'Ungültige ID'
    });
  }

  // Zod Validierungsfehler
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Validierungsfehler',
      errors: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Anwendungsfehler
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      code: err.code,
      message: err.message
    });
  }

  // Unerwartete Fehler
  return res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'Ein interner Serverfehler ist aufgetreten'
      : err.message
  });
}; 