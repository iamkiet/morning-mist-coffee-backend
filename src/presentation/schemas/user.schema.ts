import { z } from 'zod';
import { paginatedResponse, paginationFields, sortFields } from './_pagination.js';
import { UserRoleSchema, UserSchema, UserStatusSchema } from './auth.schema.js';

export const ListUsersQuery = z.object({
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
  q: z.string().optional(),
  ...sortFields(['createdAt', 'firstName', 'lastName', 'email'] as const),
  ...paginationFields,
});

export const UserListResponse = paginatedResponse(UserSchema);
