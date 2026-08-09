import './config/timezone.ts';
import { buildApp } from './app.ts';
import { env } from './config/env.ts';
import { logger } from './lib/logger.ts';

async function main(): Promise<void> {
  const app = await buildApp();

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, 'shutting down');
    try {
      await app.close();
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, 'shutdown failed');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    app.log.error({ err: reason }, 'unhandled rejection');
  });
  process.on('uncaughtException', (err) => {
    app.log.error({ err }, 'uncaught exception');
    void shutdown('uncaughtException');
  });

  try {
    await app.listen({ host: env.HOST, port: env.PORT });
  } catch (err) {
    app.log.error({ err }, 'failed to start');
    process.exit(1);
  }
}

main().catch((err) => {
  logger.fatal({ err }, 'fatal bootstrap error');
  process.exit(1);
});
