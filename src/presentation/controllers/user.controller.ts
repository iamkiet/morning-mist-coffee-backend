import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { ListUsersUseCase } from '../../application/user/list-users.use-case.ts';
import type { UpdateUserUseCase } from '../../application/user/update-user.use-case.ts';
import type { UpdateUserPasswordUseCase } from '../../application/user/update-user-password.use-case.ts';
import { mapPaginated } from '../../domain/shared/pagination.ts';
import { toUserDTO } from '../serializers/auth.serializer.ts';
import type { ListUsersQuery, UpdateUserBody, UpdatePasswordBody, UserIdParam } from '../schemas/user.schema.ts';

export interface UserUseCases {
  list: ListUsersUseCase;
  update: UpdateUserUseCase;
  updatePassword: UpdateUserPasswordUseCase;
}

export class UserController {
  constructor(private readonly uc: UserUseCases) {}

  list = async (
    req: FastifyRequest<{ Querystring: z.infer<typeof ListUsersQuery> }>,
    reply: FastifyReply,
  ) => {
    const result = await this.uc.list.execute(req.query);
    return reply.send(mapPaginated(result, toUserDTO));
  };

  update = async (
    req: FastifyRequest<{
      Params: z.infer<typeof UserIdParam>;
      Body: z.infer<typeof UpdateUserBody>;
    }>,
    reply: FastifyReply,
  ) => {
    const user = await this.uc.update.execute(req.params.id, req.body);
    return reply.send(toUserDTO(user));
  };

  updatePassword = async (
    req: FastifyRequest<{
      Params: z.infer<typeof UserIdParam>;
      Body: z.infer<typeof UpdatePasswordBody>;
    }>,
    reply: FastifyReply,
  ) => {
    await this.uc.updatePassword.execute(req.params.id, req.body.password);
    return reply.code(204).send();
  };
}
