import { z } from 'zod';
import { USER_ROLES, USER_STATUSES } from '../../domain/user/user.entity.ts';

export const UserRoleSchema = z.enum(USER_ROLES);
export const UserStatusSchema = z.enum(USER_STATUSES);

export const UserSchema = z.object({
  id: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const PasswordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a digit')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain a special character');

export const RegisterBody = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.email(),
  password: PasswordSchema,
  role: UserRoleSchema.optional(),
});

export const RegisterHeaders = z
  .object({
    'x-user-registration-key': z.string().min(1),
  })
  .loose();

export const LoginBody = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
});

export const RefreshBody = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const AuthResponse = z.object({
  user: UserSchema,
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  csrfToken: z.string(),
});

export const RefreshResponse = z.object({
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  csrfToken: z.string(),
});

export const MeResponse = z.object({
  user: UserSchema,
  csrfToken: z.string().optional(),
});

export type UserDTO = z.infer<typeof UserSchema>;
