import { rateLimit } from 'express-rate-limit';

class RateLimitMiddleware {
  public readonly general = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ success: false, message: 'Too many requests' });
    },
  });

  public readonly analysis = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ success: false, message: 'Analysis request limit exceeded' });
    },
  });

  public readonly ai = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ success: false, message: 'AI request limit exceeded' });
    },
  });
}

export default RateLimitMiddleware;
