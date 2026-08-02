import type { User } from '../../domain/user/user.entity.ts';
import type { UserDTO } from '../schemas/auth.schema.ts';

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
