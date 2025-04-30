import { ApiError } from '@/types/api';

export class ApplicationError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status?: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  public static fromApiError(error: ApiError): ApplicationError {
    return new ApplicationError(
      error.message,
      error.code,
      error.status,
      error.details
    );
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Nicht authentifiziert') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Nicht autorisiert') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string) {
    super(`${resource} nicht gefunden`, 'NOT_FOUND_ERROR', 404);
    this.name = 'NotFoundError';
  }
}

export function handleError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApplicationError(error.message);
  }

  return new ApplicationError('Ein unbekannter Fehler ist aufgetreten');
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

export function createErrorMessage(error: unknown): string {
  const appError = handleError(error);
  
  switch (appError.code) {
    case 'VALIDATION_ERROR':
      return 'Bitte überprüfen Sie Ihre Eingaben.';
    case 'AUTHENTICATION_ERROR':
      return 'Bitte melden Sie sich erneut an.';
    case 'AUTHORIZATION_ERROR':
      return 'Sie haben keine Berechtigung für diese Aktion.';
    case 'NOT_FOUND_ERROR':
      return 'Die angeforderte Ressource wurde nicht gefunden.';
    case 'NETWORK_ERROR':
      return 'Bitte überprüfen Sie Ihre Internetverbindung.';
    default:
      return appError.message;
  }
} 