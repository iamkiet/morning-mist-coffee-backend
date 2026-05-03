import type { Paginated } from '../../domain/shared/pagination.js';
import type { ListUsersFilter, User, UserFilterCriteria } from '../../domain/user/user.entity.js';
import type { UserRepo } from '../../domain/user/user.repo.js';

export class ListUsersUseCase {
  constructor(private readonly repo: UserRepo) {}

  async execute(filter: ListUsersFilter): Promise<Paginated<User>> {
    const { sortBy, sortDir, limit, offset, ...criteria } = filter;
    const [items, total] = await Promise.all([
      this.repo.list(filter),
      this.repo.count(criteria as UserFilterCriteria),
    ]);
    return { items, total, limit, offset };
  }
}
