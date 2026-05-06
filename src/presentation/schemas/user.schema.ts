import { z } from 'zod';
import { paginatedResponse, paginationFields, sortFields } from './_pagination.js';
import { UserRoleSchema, UserSchema, UserStatusSchema } from './auth.schema.js';

export { UserSchema };

export const UserIdParam = z.object({ id: z.uuid() });

export const UpdateUserBody = z
  .object({
    role: UserRoleSchema.optional(),
    status: UserStatusSchema.optional(),
  })
  .refine((v) => v.role !== undefined || v.status !== undefined, {
    message: 'At least one field required',
  });

export const ListUsersQuery = z.object({
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
  q: z.string().optional(),
  ...sortFields(['createdAt', 'firstName', 'lastName', 'email'] as const),
  ...paginationFields,
});

export const UserListResponse = paginatedResponse(UserSchema);
