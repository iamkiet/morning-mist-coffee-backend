import Fastify, { type FastifyError } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  serializerCompiler,
  validatorCompiler,
  hasZodFastifySchemaValidationErrors,
  jsonSchemaTransform,
} from 'fastify-type-provider-zod';
import { env } from './config/env.ts';
import { logger } from './lib/logger.ts';
import { ForbiddenError, isAppError } from './lib/errors.ts';
import { csrfProtection } from './presentation/middlewares/csrf.ts';
import { dbPlugin } from './presentation/plugins/db.plugin.ts';
import { authPlugin } from './presentation/plugins/auth.plugin.ts';
import { servicesPlugin } from './presentation/plugins/services.plugin.ts';
import { authRoutes } from './presentation/routes/auth.routes.ts';
import { chatRoutes } from './presentation/routes/chat.routes.ts';
import { healthRoutes } from './presentation/routes/health.routes.ts';
import { orderRoutes } from './presentation/routes/order.routes.ts';
import { productRoutes } from './presentation/routes/product.routes.ts';
import { productCategoryRoutes } from './presentation/routes/product-category.routes.ts';
import { productPropertyRoutes } from './presentation/routes/product-property.routes.ts';
import { searchRoutes } from './presentation/routes/search.routes.ts';
import { userRoutes } from './presentation/routes/user.routes.ts';

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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });
  await app.register(cookie);
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (_req, ctx) => ({
      error: 'RATE_LIMIT_EXCEEDED',
      message: `Too many requests, retry in ${ctx.after}.`,
    }),
    onExceeded: (req) => {
      req.log.warn(
        { event: 'rate_limit.hit', ip: req.ip, endpoint: req.url },
        'rate limit exceeded',
      );
      app.securityEvents.record({
        type: 'rate_limit_hit',
        ip: req.ip,
        occurredAt: new Date(),
        endpoint: req.url,
        userAgent: req.headers['user-agent'],
      });
    },
  });
  await app.register(sensible);

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Morning Mist Coffee API',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/documents' });

  await app.register(dbPlugin);
  await app.register(authPlugin);
  await app.register(servicesPlugin);

  app.addHook('onRequest', async (req) => {
    if (req.url === '/health') return;
    if (app.ipBlockList.isBlocked(req.ip)) {
      throw new ForbiddenError('Temporarily blocked by security agent');
    }
  });
  app.addHook('onRequest', csrfProtection);

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(chatRoutes, { prefix: '/api/v1/chat' });
  await app.register(orderRoutes, { prefix: '/api/v1/orders' });
  await app.register(productCategoryRoutes, { prefix: '/api/v1/product-categories' });
  await app.register(productPropertyRoutes, { prefix: '/api/v1/product-properties' });
  await app.register(productRoutes, { prefix: '/api/v1/products' });
  await app.register(searchRoutes, { prefix: '/api/v1/search' });
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
