import { z } from 'zod';

export const UserRoleSchema = z.enum(['user', 'admin']);
export const UserStatusSchema = z.enum(['active', 'inactive', 'banned']);

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

export const RegisterBody = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(8).max(128),
});

export const LoginBody = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
});

export const RefreshBody = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const AuthResponse = z.object({
  user: UserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const RefreshResponse = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type UserDTO = z.infer<typeof UserSchema>;
