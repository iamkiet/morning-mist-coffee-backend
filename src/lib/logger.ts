import { pino, type Logger, type LoggerOptions } from 'pino';
import { env } from '../config/env.js';

const loggerOptions: LoggerOptions = {
  level: env.LOG_LEVEL,
  base: { service: 'backend', env: env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.token',
      '*.apiKey',
    ],
    censor: '[REDACTED]',
  },
};

export const logger: Logger = pino(loggerOptions);
