import type {
  Customer,
  CustomerFilterCriteria,
  CreateCustomerInput,
  ListCustomersFilter,
  UpdateCustomerInput,
} from './customer.entity.ts';

export interface CustomerRepo {
  findById(id: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  create(input: CreateCustomerInput): Promise<Customer>;
  update(id: string, input: UpdateCustomerInput): Promise<Customer | null>;
  updatePassword(id: string, passwordHash: string): Promise<Customer | null>;
  recordFailedLogin(
    id: string,
    lockedUntil: Date | null,
  ): Promise<Customer | null>;
  resetFailedLogins(id: string): Promise<void>;
  delete(id: string): Promise<boolean>;
  list(filter: ListCustomersFilter): Promise<Customer[]>;
  count(criteria: CustomerFilterCriteria): Promise<number>;
}
