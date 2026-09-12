import { ROLE_CUSTOMER } from '../../domain/auth/auth-role.ts';
import type { Employee } from '../../domain/employee/employee.entity.ts';
import type { Customer } from '../../domain/customer/customer.entity.ts';
import type { AuthAccount } from './types.ts';

export function employeeToAuthAccount(employee: Employee): AuthAccount {
  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.companyEmail,
    role: employee.role,
    status: employee.status,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}

export function customerToAuthAccount(customer: Customer): AuthAccount {
  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    role: ROLE_CUSTOMER,
    status: customer.status,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}
