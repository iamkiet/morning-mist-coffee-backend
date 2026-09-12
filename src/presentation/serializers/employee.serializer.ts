import type { Employee } from '../../domain/employee/employee.entity.ts';
import type { EmployeeSchema } from '../schemas/employee.schema.ts';
import type { z } from 'zod';

export type EmployeeDTO = z.infer<typeof EmployeeSchema>;

export function toEmployeeDTO(employee: Employee): EmployeeDTO {
  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    companyEmail: employee.companyEmail,
    department: employee.department,
    role: employee.role,
    status: employee.status,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };
}
