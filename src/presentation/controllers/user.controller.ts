import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import type { ListUsersUseCase } from '../../application/user/list-users.use-case.js';
import { mapPaginated } from '../../domain/shared/pagination.js';
import { toUserDTO } from '../serializers/auth.serializer.js';
import type { ListUsersQuery } from '../schemas/user.schema.js';

export interface UserUseCases {
  list: ListUsersUseCase;
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
}
