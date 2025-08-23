import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ValidationError, AuthError, NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

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
      message: err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  // Eigene Fehlertypen
  if (err instanceof ValidationError) {
    return res.status(400).json({
      message: err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  if (err instanceof AuthError) {
    return res.status(401).json({
      message: err.message,
      code: 'AUTH_ERROR'
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      message: err.message,
      code: 'NOT_FOUND'
    });
  }

  if (err instanceof ForbiddenError) {
    return res.status(403).json({
      message: err.message,
      code: 'FORBIDDEN'
    });
  }

  if (err instanceof BadRequestError) {
    return res.status(400).json({
      message: err.message,
      code: 'BAD_REQUEST'
    });
  }

  // Unbekannte Fehler
  return res.status(500).json({
    message: 'Ein interner Serverfehler ist aufgetreten',
    code: 'INTERNAL_SERVER_ERROR'
  });
}; 