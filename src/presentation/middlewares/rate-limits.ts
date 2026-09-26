import type { FastifyRequest } from 'fastify';

export const RATE_LIMIT_GLOBAL = { max: 100, timeWindow: '1 minute' };

export const RATE_LIMIT_AUTH = {
  rateLimit: { max: 5, timeWindow: '1 minute' },
};

export const RATE_LIMIT_ORDER_LOOKUP = {
  rateLimit: {
    max: 5,
    timeWindow: '1 minute',
    keyGenerator: (req: FastifyRequest) => req.ip,
  },
};

export const RATE_LIMIT_CHAT_TEXT = {
  rateLimit: { max: 5, timeWindow: '1 minute' },
};

export const RATE_LIMIT_CHAT_VOICE = {
  rateLimit: { max: 5, timeWindow: '1 minute' },
};
