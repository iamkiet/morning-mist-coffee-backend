import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export type DB = ReturnType<typeof buildDb>['db'];

export function buildDb(connectionString: string) {
  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    connection: { timezone: 'UTC' },
  });
  const db = drizzle({ client, schema, casing: 'snake_case' });
  return { client, db };
}
