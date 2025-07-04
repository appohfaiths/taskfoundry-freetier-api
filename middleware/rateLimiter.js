import rateLimit from 'express-rate-limit';
import { RateLimitStore } from '../utils/rateLimitStore.js';

const store = new RateLimitStore();

export const rateLimiter = rateLimit({
  store: store,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: (req) => {
    // Different limits based on endpoint
    if (req.path.includes('/task')) return 10; // 10 task requests per day
    if (req.path.includes('/commit')) return 5; // 5 commit requests per day
    return 15; // Default limit
  },
  message: {
    error: 'Free tier limit exceeded',
    message: 'You have reached your daily limit. Please try again tomorrow or set up your own API key.',
    resetTime: null, // Will be set by the middleware
    upgradeInfo: {
      groq: 'Get 1000 free requests/day at https://console.groq.com',
      openai: 'Pay-per-use at https://platform.openai.com',
      setup: 'Run: npm install -g taskfoundry && taskfoundry setup'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP address for rate limiting
    return req.ip || req.connection.remoteAddress;
  },
});