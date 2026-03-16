import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = 'statusCode' in err ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`${statusCode} - ${message}`, {
    stack: err.stack,
    ...(process.env.NODE_ENV === 'development' && { error: err }),
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.message,
    });
    return;
  }

  // Mongoose duplicate key error
  if ('code' in err && (err as { code: unknown }).code === 11000) {
    res.status(409).json({
      success: false,
      error: 'Duplicate field value. This record already exists.',
    });
    return;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Invalid resource ID format.',
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, error: 'Invalid token.' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, error: 'Token expired.' });
    return;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Async handler wrapper to avoid try-catch in every controller
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
