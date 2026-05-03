import type {
  CreateUserInput,
  ListUsersFilter,
  User,
  UserFilterCriteria,
} from './user.entity.js';

export interface UserRepo {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  list(filter: ListUsersFilter): Promise<User[]>;
  count(criteria: UserFilterCriteria): Promise<number>;
}
