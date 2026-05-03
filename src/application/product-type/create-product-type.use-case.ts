import { ConflictError } from '../../lib/errors.js';
import type {
  CreateProductTypeInput,
  ProductType,
} from '../../domain/product-type/product-type.entity.js';
import type { ProductTypeRepo } from '../../domain/product-type/product-type.repo.js';

export class CreateProductTypeUseCase {
  constructor(private readonly repo: ProductTypeRepo) {}

  async execute(input: CreateProductTypeInput): Promise<ProductType> {
    const existing = await this.repo.findByName(input.name);
    if (existing) throw new ConflictError(`Product type '${input.name}' already exists`);
    return this.repo.create({ name: input.name.trim() });
  }
}
