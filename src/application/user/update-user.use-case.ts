import { NotFoundError } from '../../lib/errors.js';
import type { UpdateUserInput, User } from '../../domain/user/user.entity.js';
import type { UserRepo } from '../../domain/user/user.repo.js';

export class UpdateUserUseCase {
  constructor(private readonly repo: UserRepo) {}

  async execute(id: string, input: UpdateUserInput): Promise<User> {
    const updated = await this.repo.update(id, input);
    if (!updated) throw new NotFoundError('User', id);
    return updated;
  }
}
