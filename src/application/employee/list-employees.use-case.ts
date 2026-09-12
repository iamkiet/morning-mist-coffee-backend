import type { Paginated } from '../../domain/shared/pagination.ts';
import type {
  Employee,
  EmployeeFilterCriteria,
  ListEmployeesFilter,
} from '../../domain/employee/employee.entity.ts';
import type { EmployeeRepo } from '../../domain/employee/employee.repo.ts';

export class ListEmployeesUseCase {
  constructor(private readonly repo: EmployeeRepo) {}

  async execute(filter: ListEmployeesFilter): Promise<Paginated<Employee>> {
    const { sortBy: _sortBy, sortDir: _sortDir, limit, offset, ...criteria } = filter;
    const [items, total] = await Promise.all([
      this.repo.list(filter),
      this.repo.count(criteria as EmployeeFilterCriteria),
    ]);
    return { items, total, limit, offset };
  }
}
