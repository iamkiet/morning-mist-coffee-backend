import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { ListUsersUseCase } from '../../application/user/list-users.use-case.js';
import type { UpdateUserUseCase } from '../../application/user/update-user.use-case.js';
import { mapPaginated } from '../../domain/shared/pagination.js';
import { toUserDTO } from '../serializers/auth.serializer.js';
import type { ListUsersQuery, UpdateUserBody, UserIdParam } from '../schemas/user.schema.js';

export interface UserUseCases {
  list: ListUsersUseCase;
  update: UpdateUserUseCase;
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
}
