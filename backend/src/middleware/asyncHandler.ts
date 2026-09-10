import { Request, Response, NextFunction, RequestHandler } from 'express';

// PostgreSQL access is async, unlike the previous synchronous better-sqlite3
// calls. Express 4 does not automatically forward a rejected promise from an
// async handler to the error-handling middleware, so every route handler and
// middleware function is wrapped with this at registration time to preserve
// the same "thrown error -> central error handler" behavior as before.
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
