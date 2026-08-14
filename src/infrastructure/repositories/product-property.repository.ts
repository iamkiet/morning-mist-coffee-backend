import { asc, eq, sql } from 'drizzle-orm';
import type {
  CreateProductPropertyInput,
  ProductProperty,
} from '../../domain/product-property/product-property.entity.ts';
import type { ProductPropertyRepo } from '../../domain/product-property/product-property.repo.ts';
import type { DB } from '../db/client.ts';
import { productProperties, type ProductPropertyRow } from '../db/schema.ts';

function rowToProperty(row: ProductPropertyRow): ProductProperty {
  return {
    id: row.id,
    name: row.name,
    dataType: row.dataType,
    createdAt: row.createdAt,
  };
}

export class PostgresProductPropertyRepository implements ProductPropertyRepo {
  constructor(private readonly db: DB) {}

  async list(): Promise<ProductProperty[]> {
    const rows = await this.db
      .select()
      .from(productProperties)
      .orderBy(asc(productProperties.name));
    return rows.map(rowToProperty);
  }

  async findById(id: string): Promise<ProductProperty | null> {
    const [row] = await this.db
      .select()
      .from(productProperties)
      .where(eq(productProperties.id, id))
      .limit(1);
    return row ? rowToProperty(row) : null;
  }

  async findByName(name: string): Promise<ProductProperty | null> {
    const [row] = await this.db
      .select()
      .from(productProperties)
      .where(sql`lower(${productProperties.name}) = lower(${name})`)
      .limit(1);
    return row ? rowToProperty(row) : null;
  }

  async create(input: CreateProductPropertyInput): Promise<ProductProperty> {
    const [row] = await this.db
      .insert(productProperties)
      .values({ name: input.name, ...(input.dataType ? { dataType: input.dataType } : {}) })
      .returning();
    if (!row) throw new Error('Failed to create product property');
    return rowToProperty(row);
  }
}
