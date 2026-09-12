import { z } from 'zod';
import {
  EMPLOYEE_ROLES,
  EMPLOYEE_SORT_FIELDS,
} from '../../domain/employee/employee.entity.ts';
import { paginatedResponse, paginationFields, sortFields } from './_pagination.ts';
import { PasswordSchema, UserStatusSchema } from './auth.schema.ts';

export const EmployeeRoleSchema = z.enum(EMPLOYEE_ROLES);

export const EmployeeSchema = z.object({
  id: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  companyEmail: z.email(),
  department: z.string().nullable(),
  role: EmployeeRoleSchema,
  status: UserStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const EmployeeIdParam = z.object({ id: z.uuid() });

export const CreateEmployeeHeaders = z
  .object({
    'x-employee-registration-key': z.string().min(1),
  })
  .loose();

export const CreateEmployeeBody = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  companyEmail: z.email(),
  department: z.string().max(100).optional(),
  password: PasswordSchema,
  role: EmployeeRoleSchema,
});

export const UpdateEmployeeBody = z
  .object({
    department: z.string().max(100).optional(),
    role: EmployeeRoleSchema.optional(),
    status: UserStatusSchema.optional(),
  })
  .refine(
    (v) => v.department !== undefined || v.role !== undefined || v.status !== undefined,
    { message: 'At least one field required' },
  );

export const UpdatePasswordBody = z.object({
  password: PasswordSchema,
});

export const ListEmployeesQuery = z.object({
  role: EmployeeRoleSchema.optional(),
  status: UserStatusSchema.optional(),
  q: z.string().optional(),
  ...sortFields(EMPLOYEE_SORT_FIELDS),
  ...paginationFields,
});

export const EmployeeListResponse = paginatedResponse(EmployeeSchema);
