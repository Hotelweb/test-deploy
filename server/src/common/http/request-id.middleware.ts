import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

interface RequestWithId extends Request {
  id?: string;
}

export function requestIdMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction,
) {
  const requestId = req.header('x-request-id') || `req_${randomUUID()}`;
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
