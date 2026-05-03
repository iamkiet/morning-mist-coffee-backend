import fp from 'fastify-plugin';
import { env } from '../../config/env.js';
import { buildDb, type DB } from '../../infrastructure/db/client.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: DB;
  }
}

export const dbPlugin = fp(
  async (app) => {
    const { client, db } = buildDb(env.DATABASE_URL);

    app.decorate('db', db);

    app.addHook('onClose', async (instance) => {
      instance.log.info('closing db connection pool');
      await client.end({ timeout: 5 });
    });
  },
  { name: 'db' },
);
