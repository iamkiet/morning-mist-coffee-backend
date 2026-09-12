import type { AuthAccount } from '../../application/auth/types.ts';
import type { UserDTO } from '../schemas/auth.schema.ts';

export function toUserDTO(account: AuthAccount): UserDTO {
  return {
    id: account.id,
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    role: account.role,
    status: account.status,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}
