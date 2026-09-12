import type {
  CreateEmployeeInput,
  Employee,
  EmployeeFilterCriteria,
  ListEmployeesFilter,
  UpdateEmployeeInput,
} from './employee.entity.ts';

export interface EmployeeRepo {
  findById(id: string): Promise<Employee | null>;
  findByEmail(email: string): Promise<Employee | null>;
  create(input: CreateEmployeeInput): Promise<Employee>;
  update(id: string, input: UpdateEmployeeInput): Promise<Employee | null>;
  updatePassword(id: string, passwordHash: string): Promise<Employee | null>;
  recordFailedLogin(
    id: string,
    lockedUntil: Date | null,
  ): Promise<Employee | null>;
  resetFailedLogins(id: string): Promise<void>;
  delete(id: string): Promise<boolean>;
  list(filter: ListEmployeesFilter): Promise<Employee[]>;
  count(criteria: EmployeeFilterCriteria): Promise<number>;
}
