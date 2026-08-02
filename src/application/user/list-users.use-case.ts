import type { Paginated } from '../../domain/shared/pagination.ts';
import type { ListUsersFilter, User, UserFilterCriteria } from '../../domain/user/user.entity.ts';
import type { UserRepo } from '../../domain/user/user.repo.ts';

export class ListUsersUseCase {
  constructor(private readonly repo: UserRepo) {}

  async execute(filter: ListUsersFilter): Promise<Paginated<User>> {
    const { sortBy: _sortBy, sortDir: _sortDir, limit, offset, ...criteria } = filter;
    const [items, total] = await Promise.all([
      this.repo.list(filter),
      this.repo.count(criteria as UserFilterCriteria),
    ]);
    return { items, total, limit, offset };
  }
}
