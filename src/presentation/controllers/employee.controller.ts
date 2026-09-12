import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { ListEmployeesUseCase } from '../../application/employee/list-employees.use-case.ts';
import type { CreateEmployeeUseCase } from '../../application/employee/create-employee.use-case.ts';
import type { UpdateEmployeeUseCase } from '../../application/employee/update-employee.use-case.ts';
import type { UpdateEmployeePasswordUseCase } from '../../application/employee/update-employee-password.use-case.ts';
import type { DeleteEmployeeUseCase } from '../../application/employee/delete-employee.use-case.ts';
import { UnauthorizedError } from '../../lib/errors.ts';
import { mapPaginated } from '../../domain/shared/pagination.ts';
import { toEmployeeDTO } from '../serializers/employee.serializer.ts';
import type {
  CreateEmployeeBody,
  EmployeeIdParam,
  ListEmployeesQuery,
  UpdateEmployeeBody,
  UpdatePasswordBody,
} from '../schemas/employee.schema.ts';

export interface EmployeeUseCases {
  list: ListEmployeesUseCase;
  create: CreateEmployeeUseCase;
  update: UpdateEmployeeUseCase;
  updatePassword: UpdateEmployeePasswordUseCase;
  delete: DeleteEmployeeUseCase;
}

export class EmployeeController {
  constructor(private readonly uc: EmployeeUseCases) {}

  list = async (
    req: FastifyRequest<{ Querystring: z.infer<typeof ListEmployeesQuery> }>,
    reply: FastifyReply,
  ) => {
    const result = await this.uc.list.execute(req.query);
    return reply.send(mapPaginated(result, toEmployeeDTO));
  };

  create = async (
    req: FastifyRequest<{ Body: z.infer<typeof CreateEmployeeBody> }>,
    reply: FastifyReply,
  ) => {
    if (!req.user) throw new UnauthorizedError();
    const employee = await this.uc.create.execute(req.body, req.user.role);
    return reply.code(201).send(toEmployeeDTO(employee));
  };

  update = async (
    req: FastifyRequest<{
      Params: z.infer<typeof EmployeeIdParam>;
      Body: z.infer<typeof UpdateEmployeeBody>;
    }>,
    reply: FastifyReply,
  ) => {
    if (!req.user) throw new UnauthorizedError();
    const employee = await this.uc.update.execute(
      req.params.id,
      req.body,
      req.user.role,
      req.user.id,
    );
    return reply.send(toEmployeeDTO(employee));
  };

  updatePassword = async (
    req: FastifyRequest<{
      Params: z.infer<typeof EmployeeIdParam>;
      Body: z.infer<typeof UpdatePasswordBody>;
    }>,
    reply: FastifyReply,
  ) => {
    if (!req.user) throw new UnauthorizedError();
    await this.uc.updatePassword.execute(
      req.params.id,
      req.body.password,
      req.user.role,
      req.user.id,
    );
    return reply.code(204).send();
  };

  delete = async (
    req: FastifyRequest<{ Params: z.infer<typeof EmployeeIdParam> }>,
    reply: FastifyReply,
  ) => {
    if (!req.user) throw new UnauthorizedError();
    await this.uc.delete.execute(req.params.id, req.user.id, req.user.role);
    return reply.code(204).send();
  };
}
