import fp from 'fastify-plugin';
import { SecurityAgentService } from '../../application/security/security-agent.service.ts';
import { env } from '../../config/env.ts';
import type { TokenSigner } from '../../domain/ports/token-signer.port.ts';
import type { IpBlockList } from '../../domain/security/ip-block-list.port.ts';
import type { SecurityEventStore } from '../../domain/security/security-event-store.port.ts';
import { BcryptPasswordHasher } from '../../infrastructure/adapters/bcrypt.password-hasher.ts';
import { FfmpegAudioConverterAdapter } from '../../infrastructure/adapters/ffmpeg.audio-converter.ts';
import { GeminiChatAdapter } from '../../infrastructure/adapters/gemini.chat.ts';
import { GeminiClient } from '../../infrastructure/adapters/gemini.client.ts';
import { GeminiMultimodalEmbeddingAdapter } from '../../infrastructure/adapters/gemini.multimodal-embedding.ts';
import { GeminiProductFilterExtractionAdapter } from '../../infrastructure/adapters/gemini.product-filter-extraction.ts';
import { GeminiSecurityDecisionAdapter } from '../../infrastructure/adapters/gemini.security-decision.ts';
import { GeminiTranscriptionAdapter } from '../../infrastructure/adapters/gemini.transcription.ts';
import { JoseTokenSigner } from '../../infrastructure/adapters/jose.token-signer.ts';
import { ResendEmailSender } from '../../infrastructure/adapters/resend.email-sender.ts';
import { PostgresOrderRepository } from '../../infrastructure/repositories/order.repository.ts';
import { PostgresProductStockRepository } from '../../infrastructure/repositories/product-stock.repository.ts';
import { PostgresProductTypeRepository } from '../../infrastructure/repositories/product-type.repository.ts';
import { PostgresProductRepository } from '../../infrastructure/repositories/product.repository.ts';
import { PostgresRefreshTokenRepository } from '../../infrastructure/repositories/refresh-token.repository.ts';
import { PostgresUserRepository } from '../../infrastructure/repositories/user.repository.ts';
import { InMemoryIpBlockList } from '../../infrastructure/security/in-memory-ip-block-list.ts';
import { InMemorySecurityEventStore } from '../../infrastructure/security/in-memory-security-event-store.ts';
import { buildUseCases, type AppUseCases } from './build-use-cases.ts';

const SECURITY_AGENT_CYCLE_MS = 60_000;

declare module 'fastify' {
  interface FastifyInstance {
    useCases: AppUseCases;
    tokenSigner: TokenSigner;
    gemini: GeminiClient;
    securityEvents: SecurityEventStore;
    ipBlockList: IpBlockList;
    securityAgent: SecurityAgentService;
  }
}

export const servicesPlugin = fp(
  async (app) => {
    const gemini = new GeminiClient(env.GEMINI_API_KEY);
    const emailSender = new ResendEmailSender(env.RESEND_API_KEY, env.RESEND_FROM);
    const securityEvents = new InMemorySecurityEventStore();
    const ipBlockList = new InMemoryIpBlockList();

    const securityAgent = new SecurityAgentService(
      securityEvents,
      ipBlockList,
      new GeminiSecurityDecisionAdapter(gemini, app.log),
      emailSender,
      {
        enabled: env.SECURITY_AGENT_ENABLED,
        alertEmail: env.SECURITY_AGENT_ALERT_EMAIL,
      },
      app.log,
    );

    const tokenSigner = new JoseTokenSigner(
      env.AUTH_JWT_SECRET,
      env.AUTH_ACCESS_TOKEN_TTL,
      env.AUTH_REFRESH_TOKEN_TTL,
    );

    const useCases = buildUseCases({
      orderRepo: new PostgresOrderRepository(app.db),
      userRepo: new PostgresUserRepository(app.db),
      refreshTokenRepo: new PostgresRefreshTokenRepository(app.db),
      productRepo: new PostgresProductRepository(app.db),
      productTypeRepo: new PostgresProductTypeRepository(app.db),
      productStockRepo: new PostgresProductStockRepository(app.db),
      emailSender,
      embedding: new GeminiMultimodalEmbeddingAdapter(gemini),
      transcription: new GeminiTranscriptionAdapter(gemini),
      chat: new GeminiChatAdapter(gemini),
      filterExtraction: new GeminiProductFilterExtractionAdapter(gemini, app.log),
      audioConverter: new FfmpegAudioConverterAdapter(),
      passwordHasher: new BcryptPasswordHasher(),
      tokenSigner,
      logger: app.log,
    });

    app.decorate('useCases', useCases);
    app.decorate('tokenSigner', tokenSigner);
    app.decorate('gemini', gemini);
    app.decorate('securityEvents', securityEvents);
    app.decorate('ipBlockList', ipBlockList);
    app.decorate('securityAgent', securityAgent);

    const cycleInterval = setInterval(() => {
      securityAgent.runCycle().catch((err: unknown) => {
        app.log.error({ err }, 'Security agent cycle failed');
      });
    }, SECURITY_AGENT_CYCLE_MS);
    cycleInterval.unref();
    app.addHook('onClose', () => {
      clearInterval(cycleInterval);
    });
  },
  { name: 'services', dependencies: ['db'] },
);
