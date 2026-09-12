import { z } from 'zod';
import { CUSTOMER_SORT_FIELDS } from '../../domain/customer/customer.entity.ts';
import { paginatedResponse, paginationFields, sortFields } from './_pagination.ts';
import { PasswordSchema, UserStatusSchema } from './auth.schema.ts';

export const CustomerSchema = z.object({
  id: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  loyaltyPoints: z.number().int(),
  status: UserStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CustomerIdParam = z.object({ id: z.uuid() });

export const CreateCustomerHeaders = z
  .object({
    'x-customer-registration-key': z.string().min(1),
  })
  .loose();

export const CreateCustomerBody = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.email(),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  password: PasswordSchema,
});

export const UpdateCustomerBody = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phone: z.string().max(30).optional(),
    address: z.string().max(500).optional(),
    loyaltyPoints: z.number().int().min(0).optional(),
    status: UserStatusSchema.optional(),
  })
  .refine((v) => Object.values(v).some((value) => value !== undefined), {
    message: 'At least one field required',
  });

export const UpdatePasswordBody = z.object({
  password: PasswordSchema,
});

export const UpdateOwnCustomerBody = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phone: z.string().max(30).optional(),
    address: z.string().max(500).optional(),
  })
  .refine((v) => Object.values(v).some((value) => value !== undefined), {
    message: 'At least one field required',
  });

export const ListCustomersQuery = z.object({
  status: UserStatusSchema.optional(),
  q: z.string().optional(),
  ...sortFields(CUSTOMER_SORT_FIELDS),
  ...paginationFields,
});

export const CustomerListResponse = paginatedResponse(CustomerSchema);
