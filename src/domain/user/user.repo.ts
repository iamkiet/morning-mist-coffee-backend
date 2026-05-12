import type {
  CreateUserInput,
  ListUsersFilter,
  UpdateUserInput,
  User,
  UserFilterCriteria,
} from './user.entity.js';

export interface UserRepo {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, input: UpdateUserInput): Promise<User | null>;
  updatePassword(id: string, passwordHash: string): Promise<User | null>;
  list(filter: ListUsersFilter): Promise<User[]>;
  count(criteria: UserFilterCriteria): Promise<number>;
}
