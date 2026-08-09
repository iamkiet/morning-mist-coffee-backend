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
}
