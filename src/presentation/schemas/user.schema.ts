import { z } from 'zod';
import { USER_SORT_FIELDS } from '../../domain/user/user.entity.ts';
import { paginatedResponse, paginationFields, sortFields } from './_pagination.ts';
import {
  PasswordSchema,
  UserRoleSchema,
  UserSchema,
  UserStatusSchema,
} from './auth.schema.ts';

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

export const UpdatePasswordBody = z.object({
  password: PasswordSchema,
});

export const ListUsersQuery = z.object({
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
  q: z.string().optional(),
  ...sortFields(USER_SORT_FIELDS),
  ...paginationFields,
});

export const UserListResponse = paginatedResponse(UserSchema);
