import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import { UnauthorizedError } from '../../lib/errors.ts';
import type { ListCustomersUseCase } from '../../application/customer/list-customers.use-case.ts';
import type { GetCustomerByIdUseCase } from '../../application/customer/get-customer-by-id.use-case.ts';
import type { CreateCustomerUseCase } from '../../application/customer/create-customer.use-case.ts';
import type { UpdateCustomerUseCase } from '../../application/customer/update-customer.use-case.ts';
import type { UpdateCustomerPasswordUseCase } from '../../application/customer/update-customer-password.use-case.ts';
import type { DeleteCustomerUseCase } from '../../application/customer/delete-customer.use-case.ts';
import { mapPaginated } from '../../domain/shared/pagination.ts';
import { toCustomerDTO } from '../serializers/customer.serializer.ts';
import type {
  CreateCustomerBody,
  CustomerIdParam,
  ListCustomersQuery,
  UpdateCustomerBody,
  UpdateOwnCustomerBody,
  UpdatePasswordBody,
} from '../schemas/customer.schema.ts';

export interface CustomerUseCases {
  list: ListCustomersUseCase;
  getById: GetCustomerByIdUseCase;
  create: CreateCustomerUseCase;
  update: UpdateCustomerUseCase;
  updatePassword: UpdateCustomerPasswordUseCase;
  delete: DeleteCustomerUseCase;
}

export class CustomerController {
  constructor(private readonly uc: CustomerUseCases) {}

  list = async (
    req: FastifyRequest<{ Querystring: z.infer<typeof ListCustomersQuery> }>,
    reply: FastifyReply,
  ) => {
    const result = await this.uc.list.execute(req.query);
    return reply.send(mapPaginated(result, toCustomerDTO));
  };

  create = async (
    req: FastifyRequest<{ Body: z.infer<typeof CreateCustomerBody> }>,
    reply: FastifyReply,
  ) => {
    const customer = await this.uc.create.execute(req.body);
    return reply.code(201).send(toCustomerDTO(customer));
  };

  me = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) throw new UnauthorizedError();
    const customer = await this.uc.getById.execute(req.user.id);
    return reply.send(toCustomerDTO(customer));
  };

  updateMe = async (
    req: FastifyRequest<{ Body: z.infer<typeof UpdateOwnCustomerBody> }>,
    reply: FastifyReply,
  ) => {
    if (!req.user) throw new UnauthorizedError();
    const customer = await this.uc.update.execute(req.user.id, req.body);
    return reply.send(toCustomerDTO(customer));
  };

  update = async (
    req: FastifyRequest<{
      Params: z.infer<typeof CustomerIdParam>;
      Body: z.infer<typeof UpdateCustomerBody>;
    }>,
    reply: FastifyReply,
  ) => {
    const customer = await this.uc.update.execute(req.params.id, req.body);
    return reply.send(toCustomerDTO(customer));
  };

  updatePassword = async (
    req: FastifyRequest<{
      Params: z.infer<typeof CustomerIdParam>;
      Body: z.infer<typeof UpdatePasswordBody>;
    }>,
    reply: FastifyReply,
  ) => {
    await this.uc.updatePassword.execute(req.params.id, req.body.password);
    return reply.code(204).send();
  };

  delete = async (
    req: FastifyRequest<{ Params: z.infer<typeof CustomerIdParam> }>,
    reply: FastifyReply,
  ) => {
    await this.uc.delete.execute(req.params.id);
    return reply.code(204).send();
  };
}
