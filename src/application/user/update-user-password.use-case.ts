import { NotFoundError } from '../../lib/errors.ts';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port.ts';
import type { User } from '../../domain/user/user.entity.ts';
import type { UserRepo } from '../../domain/user/user.repo.ts';

export class UpdateUserPasswordUseCase {
  constructor(
    private readonly users: UserRepo,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(id: string, newPassword: string): Promise<User> {
    const existing = await this.users.findById(id);
    if (!existing) throw new NotFoundError('User', id);
    const passwordHash = await this.hasher.hash(newPassword);
    const updated = await this.users.updatePassword(id, passwordHash);
    if (!updated) throw new NotFoundError('User', id);
    return updated;
  }
}
