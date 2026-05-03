import type { User } from '../../domain/user/user.entity.js';
import type { UserDTO } from '../schemas/auth.schema.js';

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
