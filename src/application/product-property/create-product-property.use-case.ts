import { resolveUniqueName } from '../../lib/unique-name.ts';
import type {
  CreateProductPropertyInput,
  ProductProperty,
} from '../../domain/product-property/product-property.entity.ts';
import type { ProductPropertyRepo } from '../../domain/product-property/product-property.repo.ts';

export class CreateProductPropertyUseCase {
  constructor(private readonly repo: ProductPropertyRepo) {}

  async execute(input: CreateProductPropertyInput): Promise<ProductProperty> {
    const name = await resolveUniqueName(
      input.name,
      (n) => this.repo.findByName(n),
      'Property',
    );
    return this.repo.create({ name, dataType: input.dataType });
  }
}
