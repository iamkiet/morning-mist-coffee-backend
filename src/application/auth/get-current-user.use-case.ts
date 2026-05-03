import { UnauthorizedError } from '../../lib/errors.js';
import type { User } from '../../domain/user/user.entity.js';
import type { UserRepo } from '../../domain/user/user.repo.js';

export class GetCurrentUserUseCase {
  constructor(private readonly users: UserRepo) {}

  async execute(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedError('User no longer exists');
    return user;
  }
}
