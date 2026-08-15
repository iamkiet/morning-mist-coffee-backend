import { ForbiddenError, NotFoundError } from '../../lib/errors.ts';
import type { UserRepo } from '../../domain/user/user.repo.ts';

export class DeleteUserUseCase {
  constructor(private readonly repo: UserRepo) {}

  async execute(id: string, requestingUserId: string): Promise<void> {
    if (id === requestingUserId) {
      throw new ForbiddenError('Cannot delete your own account');
    }
    const ok = await this.repo.delete(id);
    if (!ok) throw new NotFoundError('User', id);
  }
}
