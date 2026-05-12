import Fastify, { type FastifyError } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import {
  serializerCompiler,
  validatorCompiler,
  hasZodFastifySchemaValidationErrors,
} from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { isAppError } from './lib/errors.js';
import { dbPlugin } from './presentation/plugins/db.plugin.js';
import { authPlugin } from './presentation/plugins/auth.plugin.js';
import { servicesPlugin } from './presentation/plugins/services.plugin.js';
import { authRoutes } from './presentation/routes/auth.routes.js';
import { healthRoutes } from './presentation/routes/health.routes.js';
import { orderRoutes } from './presentation/routes/order.routes.js';
import { productRoutes } from './presentation/routes/product.routes.js';
import { productTypeRoutes } from './presentation/routes/product-type.routes.js';
import { userRoutes } from './presentation/routes/user.routes.js';

export async function buildApp() {
  const app = Fastify({
    loggerInstance: logger,
    disableRequestLogging: false,
    trustProxy: true,
    genReqId: () => crypto.randomUUID(),
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  const corsOrigin = env.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  await app.register(helmet, { global: true });
  await app.register(cors, {
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  await app.register(cookie);
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (_req, ctx) => ({
      error: 'RATE_LIMIT_EXCEEDED',
      message: `Too many requests, retry in ${ctx.after}.`,
    }),
  });
  await app.register(sensible);

  await app.register(dbPlugin);
  await app.register(authPlugin);
  await app.register(servicesPlugin);

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(orderRoutes, { prefix: '/api/v1/orders' });
  await app.register(productTypeRoutes, { prefix: '/api/v1/product-types' });
  await app.register(productRoutes, { prefix: '/api/v1/products' });
  await app.register(userRoutes, { prefix: '/api/v1/users' });

  app.setErrorHandler((error: FastifyError, req, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.validation,
      });
    }

    if (isAppError(error)) {
      req.log.warn({ err: error }, 'app error');
      return reply.code(error.statusCode).send({
        error: error.code,
        message: error.message,
        details: error.details,
      });
    }

    req.log.error({ err: error }, 'unhandled error');
    const status = error.statusCode ?? 500;
    return reply.code(status).send({
      error: status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
      message:
        status >= 500 && !env.EXPOSE_INTERNAL_ERRORS
          ? 'Internal server error'
          : error.message,
    });
  });

  app.setNotFoundHandler((req, reply) => {
    reply.code(404).send({
      error: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
    });
  });

  return app;
}
