import { NotFoundError } from '../../lib/errors.js';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port.js';
import type { User } from '../../domain/user/user.entity.js';
import type { UserRepo } from '../../domain/user/user.repo.js';

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
