import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { RATE_LIMIT_AUTH } from '../middlewares/rate-limits.ts';
import { z } from 'zod';
import { ROLES_ADMIN_STAFF } from '../../domain/auth/auth-role.ts';
import { CustomerController } from '../controllers/customer.controller.ts';
import { checkCustomerRegistrationKey } from '../middlewares/customer-registration-key.ts';
import {
  CreateCustomerBody,
  CreateCustomerHeaders,
  CustomerIdParam,
  CustomerListResponse,
  CustomerSchema,
  ListCustomersQuery,
  UpdateCustomerBody,
  UpdateOwnCustomerBody,
  UpdatePasswordBody,
} from '../schemas/customer.schema.ts';

export async function customerRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new CustomerController(app.useCases.customer);

  // Public: a customer creating their own account (storefront self-registration)
  // and an admin/staff creating one on a customer's behalf from mist-ops both
  // hit this same endpoint — the payload shape is identical either way, so
  // there is no separate admin-only "create customer" route.
  fastify.post('/', {
    config: RATE_LIMIT_AUTH,
    schema: {
      tags: ['customers'],
      headers: CreateCustomerHeaders,
      body: CreateCustomerBody,
      response: { 201: CustomerSchema },
    },
    preHandler: [checkCustomerRegistrationKey],
    handler: controller.create,
  });

  // Self-service: a customer viewing/editing their own profile.
  fastify.get('/me', {
    onRequest: [app.authenticate, app.requireRole(['customer'])],
    schema: {
      tags: ['customers'],
      response: { 200: CustomerSchema },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.me,
  });

  fastify.patch('/me', {
    onRequest: [app.authenticate, app.requireRole(['customer'])],
    schema: {
      tags: ['customers'],
      body: UpdateOwnCustomerBody,
      response: { 200: CustomerSchema },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.updateMe,
  });

  // Admin/staff management of customer accounts.
  fastify.get('/', {
    onRequest: [app.authenticate, app.requireRole(ROLES_ADMIN_STAFF)],
    schema: {
      tags: ['customers'],
      querystring: ListCustomersQuery,
      response: { 200: CustomerListResponse },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.list,
  });

  fastify.patch('/:id', {
    onRequest: [app.authenticate, app.requireRole(ROLES_ADMIN_STAFF)],
    schema: {
      tags: ['customers'],
      params: CustomerIdParam,
      body: UpdateCustomerBody,
      response: { 200: CustomerSchema },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.update,
  });

  fastify.patch('/:id/password', {
    onRequest: [app.authenticate, app.requireRole(ROLES_ADMIN_STAFF)],
    schema: {
      tags: ['customers'],
      params: CustomerIdParam,
      body: UpdatePasswordBody,
      response: { 204: z.null() },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.updatePassword,
  });

  fastify.delete('/:id', {
    onRequest: [app.authenticate, app.requireRole(ROLES_ADMIN_STAFF)],
    schema: {
      tags: ['customers'],
      params: CustomerIdParam,
      response: { 204: z.null() },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.delete,
  });
}
