import { ConflictError } from '../../lib/errors.ts';
import type {
  CreateProductPropertyInput,
  ProductProperty,
} from '../../domain/product-property/product-property.entity.ts';
import type { ProductPropertyRepo } from '../../domain/product-property/product-property.repo.ts';

export class CreateProductPropertyUseCase {
  constructor(private readonly repo: ProductPropertyRepo) {}

  async execute(input: CreateProductPropertyInput): Promise<ProductProperty> {
    const name = input.name.trim();
    const existing = await this.repo.findByName(name);
    if (existing) throw new ConflictError(`Property '${name}' already exists`);
    return this.repo.create({ name, dataType: input.dataType });
  }
}
