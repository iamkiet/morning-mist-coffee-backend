import type { Customer } from '../../domain/customer/customer.entity.ts';
import type { CustomerSchema } from '../schemas/customer.schema.ts';
import type { z } from 'zod';

export type CustomerDTO = z.infer<typeof CustomerSchema>;

export function toCustomerDTO(customer: Customer): CustomerDTO {
  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    loyaltyPoints: customer.loyaltyPoints,
    status: customer.status,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}
