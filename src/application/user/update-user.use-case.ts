import { NotFoundError } from '../../lib/errors.ts';
import type { UpdateUserInput, User } from '../../domain/user/user.entity.ts';
import type { UserRepo } from '../../domain/user/user.repo.ts';

export class UpdateUserUseCase {
  constructor(private readonly repo: UserRepo) {}

  async execute(id: string, input: UpdateUserInput): Promise<User> {
    const updated = await this.repo.update(id, input);
    if (!updated) throw new NotFoundError('User', id);
    return updated;
  }
}
