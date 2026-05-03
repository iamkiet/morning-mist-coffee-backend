import { sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/health',
    {
      logLevel: 'warn',
    },
    async (_req, reply) => {
      let dbStatus: 'ok' | 'fail' = 'ok';
      try {
        await app.db.execute(sql`select 1`);
      } catch {
        dbStatus = 'fail';
      }
      const status = dbStatus === 'ok' ? 'ok' : 'degraded';
      return reply.code(dbStatus === 'ok' ? 200 : 503).send({
        status,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        checks: { db: dbStatus },
      });
    },
  );

  app.get(
    '/ready',
    {
      logLevel: 'warn',
    },
    async (_req, reply) => {
      try {
        await app.db.execute(sql`select 1`);
        return { status: 'ok', checks: { db: 'ok' } };
      } catch (err) {
        app.log.error({ err }, 'readiness check failed');
        return reply.code(503).send({ status: 'fail', checks: { db: 'fail' } });
      }
    },
  );
}
