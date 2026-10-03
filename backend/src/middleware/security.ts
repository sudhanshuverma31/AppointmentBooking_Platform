import { Request, Response, NextFunction } from 'express';

/**
 * Recursively sanitize objects to prevent MongoDB NoSQL query injection
 * Removes keys or values starting with '$' or containing '.' in object keys
 */
function sanitize(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item));
  }

  const cleanObj: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    // Remove '$' prefix in keys to prevent NoSQL operator injection (e.g., { "$gt": "" })
    if (key.startsWith('$')) {
      continue;
    }
    const cleanKey = key.replace(/\./g, '_');
    cleanObj[cleanKey] = sanitize(obj[key]);
  }
  return cleanObj;
}

/**
 * Express middleware to sanitize body, query, and params
 */
export const sanitizeInputMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
};
