import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cacheService.js';

/**
 * Express middleware to cache GET requests for a specified TTL in seconds.
 * Adds 'X-Cache: HIT' or 'X-Cache: MISS' headers for debugging and observability.
 */
export const cacheMiddleware = (ttlSeconds: number, keyGroup?: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    const key = `${keyGroup ? keyGroup + ':' : ''}${req.originalUrl || req.url}`;
    const cachedData = cacheService.get(key);

    if (cachedData !== null) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', key);
      res.json(cachedData);
      return;
    }

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Cache-Key', key);

    // Intercept res.json to capture response body
    const originalJson = res.json.bind(res);
    res.json = (body: any): Response => {
      // Only cache successful 200 responses
      if (res.statusCode === 200 && body) {
        cacheService.set(key, body, ttlSeconds);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Helper to invalidate cache patterns after mutation (POST, PUT, DELETE, PATCH)
 */
export const invalidateCache = (...patterns: string[]) => {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    cacheService.invalidatePatterns(patterns);
    next();
  };
};
