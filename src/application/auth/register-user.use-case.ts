import { ConflictError } from '../../lib/errors.ts';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port.ts';
import { normalizeEmail } from '../../domain/user/user.entity.ts';
import type { User, UserRole } from '../../domain/user/user.entity.ts';
import type { UserRepo } from '../../domain/user/user.repo.ts';

export interface RegisterUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
}

export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepo,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const email = normalizeEmail(input.email);

    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await this.hasher.hash(input.password);
    return this.users.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email,
      passwordHash,
      role: input.role,
    });
  }
}
