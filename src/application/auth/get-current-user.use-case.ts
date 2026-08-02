import { UnauthorizedError } from '../../lib/errors.ts';
import type { User } from '../../domain/user/user.entity.ts';
import type { UserRepo } from '../../domain/user/user.repo.ts';

export class GetCurrentUserUseCase {
  constructor(private readonly users: UserRepo) {}

  async execute(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedError('User no longer exists');
    return user;
  }
}
