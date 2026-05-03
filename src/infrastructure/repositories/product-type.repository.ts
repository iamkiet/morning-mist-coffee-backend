import { asc, eq, sql } from 'drizzle-orm';
import type {
  CreateProductTypeInput,
  ProductType,
} from '../../domain/product-type/product-type.entity.js';
import type { ProductTypeRepo } from '../../domain/product-type/product-type.repo.js';
import type { DB } from '../db/client.js';
import { productTypes, type ProductTypeRow } from '../db/schema.js';

function rowToProductType(row: ProductTypeRow): ProductType {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PostgresProductTypeRepository implements ProductTypeRepo {
  constructor(private readonly db: DB) {}

  async list(): Promise<ProductType[]> {
    const rows = await this.db
      .select()
      .from(productTypes)
      .orderBy(asc(productTypes.name));
    return rows.map(rowToProductType);
  }

  async findById(id: string): Promise<ProductType | null> {
    const [row] = await this.db
      .select()
      .from(productTypes)
      .where(eq(productTypes.id, id))
      .limit(1);
    return row ? rowToProductType(row) : null;
  }

  async findByName(name: string): Promise<ProductType | null> {
    const [row] = await this.db
      .select()
      .from(productTypes)
      .where(sql`lower(${productTypes.name}) = lower(${name})`)
      .limit(1);
    return row ? rowToProductType(row) : null;
  }

  async create(input: CreateProductTypeInput): Promise<ProductType> {
    const [row] = await this.db
      .insert(productTypes)
      .values({ name: input.name })
      .returning();
    if (!row) throw new Error('Failed to create product type');
    return rowToProductType(row);
  }
}
