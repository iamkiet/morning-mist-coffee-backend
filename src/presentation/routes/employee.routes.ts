import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ROLES_ADMIN_STAFF } from '../../domain/auth/auth-role.ts';
import { EmployeeController } from '../controllers/employee.controller.ts';
import { checkEmployeeRegistrationKey } from '../middlewares/employee-registration-key.ts';
import {
  CreateEmployeeBody,
  CreateEmployeeHeaders,
  EmployeeIdParam,
  EmployeeListResponse,
  EmployeeSchema,
  ListEmployeesQuery,
  UpdateEmployeeBody,
  UpdatePasswordBody,
} from '../schemas/employee.schema.ts';

export async function employeeRoutes(app: FastifyInstance): Promise<void> {
  const fastify = app.withTypeProvider<ZodTypeProvider>();
  const controller = new EmployeeController(app.useCases.employee);

  fastify.addHook('onRequest', app.authenticate);
  fastify.addHook('onRequest', app.requireRole(ROLES_ADMIN_STAFF));

  fastify.get('/', {
    schema: {
      tags: ['employees'],
      querystring: ListEmployeesQuery,
      response: { 200: EmployeeListResponse },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.list,
  });

  fastify.post('/', {
    schema: {
      tags: ['employees'],
      headers: CreateEmployeeHeaders,
      body: CreateEmployeeBody,
      response: { 201: EmployeeSchema },
      security: [{ bearerAuth: [] }],
    },
    preHandler: [checkEmployeeRegistrationKey],
    handler: controller.create,
  });

  fastify.patch('/:id', {
    schema: {
      tags: ['employees'],
      params: EmployeeIdParam,
      body: UpdateEmployeeBody,
      response: { 200: EmployeeSchema },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.update,
  });

  fastify.patch('/:id/password', {
    schema: {
      tags: ['employees'],
      params: EmployeeIdParam,
      body: UpdatePasswordBody,
      response: { 204: z.null() },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.updatePassword,
  });

  fastify.delete('/:id', {
    schema: {
      tags: ['employees'],
      params: EmployeeIdParam,
      response: { 204: z.null() },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.delete,
  });
}
