import { ConflictError } from '../../lib/errors.ts';
import { normalizeEmail } from '../../domain/shared/email.ts';
import type { Customer } from '../../domain/customer/customer.entity.ts';
import type { CustomerRepo } from '../../domain/customer/customer.repo.ts';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port.ts';

export interface CreateCustomerByAdminInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  password: string;
}

export class CreateCustomerUseCase {
  constructor(
    private readonly repo: CustomerRepo,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: CreateCustomerByAdminInput): Promise<Customer> {
    const email = normalizeEmail(input.email);
    const existing = await this.repo.findByEmail(email);
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await this.hasher.hash(input.password);
    return this.repo.create({
      firstName: input.firstName,
      lastName: input.lastName,
      email,
      phone: input.phone,
      address: input.address,
      passwordHash,
    });
  }
}
