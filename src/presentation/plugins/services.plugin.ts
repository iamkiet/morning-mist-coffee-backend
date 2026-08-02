import fp from 'fastify-plugin';
import { ResendEmailSender } from '../../infrastructure/adapters/resend.email-sender.js';
import { GetCurrentUserUseCase } from '../../application/auth/get-current-user.use-case.js';
import { LoginUserUseCase } from '../../application/auth/login-user.use-case.js';
import { LogoutUseCase } from '../../application/auth/logout.use-case.js';
import { RefreshTokenUseCase } from '../../application/auth/refresh-token.use-case.js';
import { RegisterUserUseCase } from '../../application/auth/register-user.use-case.js';
import { ListUsersUseCase } from '../../application/user/list-users.use-case.js';
import { UpdateUserUseCase } from '../../application/user/update-user.use-case.js';
import { UpdateUserPasswordUseCase } from '../../application/user/update-user-password.use-case.js';
import { CreateOrderUseCase } from '../../application/order/create-order.use-case.js';
import { GetOrderByIdUseCase } from '../../application/order/get-order-by-id.use-case.js';
import { ListOrdersUseCase } from '../../application/order/list-orders.use-case.js';
import { UpdateOrderStatusUseCase } from '../../application/order/update-order-status.use-case.js';
import { CreateProductTypeUseCase } from '../../application/product-type/create-product-type.use-case.js';
import { ListProductTypesUseCase } from '../../application/product-type/list-product-types.use-case.js';
import { CreateProductUseCase } from '../../application/product/create-product.use-case.js';
import { DecreaseStockUseCase } from '../../application/product/decrease-stock.use-case.js';
import { DeleteProductUseCase } from '../../application/product/delete-product.use-case.js';
import { GetProductByIdUseCase } from '../../application/product/get-product-by-id.use-case.js';
import { GetProductBySlugUseCase } from '../../application/product/get-product-by-slug.use-case.js';
import { SendChatMessageUseCase } from '../../application/chat/send-chat-message.use-case.js';
import { GetStockUseCase } from '../../application/product/get-stock.use-case.js';
import { IncreaseStockUseCase } from '../../application/product/increase-stock.use-case.js';
import { ListProductsUseCase } from '../../application/product/list-products.use-case.js';
import { SearchProductsByVoiceUseCase } from '../../application/product/search-products-by-voice.use-case.js';
import { UpdateProductUseCase } from '../../application/product/update-product.use-case.js';
import { env } from '../../config/env.js';
import type { TokenSigner } from '../../domain/ports/token-signer.port.js';
import { BcryptPasswordHasher } from '../../infrastructure/adapters/bcrypt.password-hasher.js';
import { FfmpegAudioConverterAdapter } from '../../infrastructure/adapters/ffmpeg.audio-converter.js';
import { GeminiMultimodalEmbeddingAdapter } from '../../infrastructure/adapters/gemini.multimodal-embedding.js';
import { GeminiTranscriptionAdapter } from '../../infrastructure/adapters/gemini.transcription.js';
import { JoseTokenSigner } from '../../infrastructure/adapters/jose.token-signer.js';
import { PostgresOrderRepository } from '../../infrastructure/repositories/order.repository.js';
import { GeminiChatAdapter } from '../../infrastructure/adapters/gemini.chat.js';
import { PostgresProductRepository } from '../../infrastructure/repositories/product.repository.js';
import { PostgresProductStockRepository } from '../../infrastructure/repositories/product-stock.repository.js';
import { PostgresProductTypeRepository } from '../../infrastructure/repositories/product-type.repository.js';
import { PostgresRefreshTokenRepository } from '../../infrastructure/repositories/refresh-token.repository.js';
import { PostgresUserRepository } from '../../infrastructure/repositories/user.repository.js';
import { AiSecurityService } from '../../application/ai/ai-security.service.js';
import { SecurityAgentService } from '../../application/security/security-agent.service.js';
import type { IpBlockList } from '../../domain/security/ip-block-list.port.js';
import type { SecurityEventStore } from '../../domain/security/security-event-store.port.js';
import { GeminiSecurityDecisionAdapter } from '../../infrastructure/adapters/gemini.security-decision.js';
import { InMemoryIpBlockList } from '../../infrastructure/security/in-memory-ip-block-list.js';
import { InMemorySecurityEventStore } from '../../infrastructure/security/in-memory-security-event-store.js';
import type { AuthUseCases } from '../controllers/auth.controller.js';
import type { OrderUseCases } from '../controllers/order.controller.js';
import type { ProductUseCases } from '../controllers/product.controller.js';
import type { ChatUseCases } from '../controllers/chat.controller.js';
import type { ProductTypeUseCases } from '../controllers/product-type.controller.js';
import type { SearchUseCases } from '../controllers/search.controller.js';
import type { UserUseCases } from '../controllers/user.controller.js';

const SECURITY_AGENT_CYCLE_MS = 60_000;

export interface AppUseCases {
  auth: AuthUseCases;
  chat: ChatUseCases;
  order: OrderUseCases;
  product: ProductUseCases;
  productType: ProductTypeUseCases;
  user: UserUseCases;
  search: SearchUseCases;
}

declare module 'fastify' {
  interface FastifyInstance {
    useCases: AppUseCases;
    tokenSigner: TokenSigner;
    aiSecurity: AiSecurityService;
    securityEvents: SecurityEventStore;
    ipBlockList: IpBlockList;
    securityAgent: SecurityAgentService;
  }
}

export const servicesPlugin = fp(
  async (app) => {
    const orderRepo = new PostgresOrderRepository(app.db);
    const userRepo = new PostgresUserRepository(app.db);
    const refreshTokenRepo = new PostgresRefreshTokenRepository(app.db);
    const productRepo = new PostgresProductRepository(app.db);
    const productTypeRepo = new PostgresProductTypeRepository(app.db);
    const productStockRepo = new PostgresProductStockRepository(app.db);
    const emailSender = new ResendEmailSender(env.RESEND_API_KEY, env.RESEND_FROM);
    const securityEvents = new InMemorySecurityEventStore();
    const aiSecurity = new AiSecurityService(app.log, securityEvents);
    const ipBlockList = new InMemoryIpBlockList();
    const securityDecision = new GeminiSecurityDecisionAdapter(env.GEMINI_API_KEY || 'dummy', app.log);
    const securityAgent = new SecurityAgentService(
      securityEvents,
      ipBlockList,
      securityDecision,
      emailSender,
      app.log,
    );
    const multimodalEmbedding = new GeminiMultimodalEmbeddingAdapter(env.GEMINI_API_KEY || 'dummy');
    const transcription = new GeminiTranscriptionAdapter(env.GEMINI_API_KEY || 'dummy');
    const chatAdapter = new GeminiChatAdapter(env.GEMINI_API_KEY || 'dummy');
    const audioConverter = new FfmpegAudioConverterAdapter();
    const passwordHasher = new BcryptPasswordHasher();
    const tokenSigner = new JoseTokenSigner(
      env.AUTH_JWT_SECRET,
      env.AUTH_ACCESS_TOKEN_TTL,
      env.AUTH_REFRESH_TOKEN_TTL,
    );

    const useCases: AppUseCases = {
      auth: {
        register: new RegisterUserUseCase(
          userRepo,
          refreshTokenRepo,
          passwordHasher,
          tokenSigner,
        ),
        login: new LoginUserUseCase(
          userRepo,
          refreshTokenRepo,
          passwordHasher,
          tokenSigner,
        ),
        refresh: new RefreshTokenUseCase(
          userRepo,
          refreshTokenRepo,
          tokenSigner,
        ),
        logout: new LogoutUseCase(refreshTokenRepo, tokenSigner),
        me: new GetCurrentUserUseCase(userRepo),
      },
      order: {
        list: new ListOrdersUseCase(orderRepo),
        getById: new GetOrderByIdUseCase(orderRepo),
        create: new CreateOrderUseCase(orderRepo, productRepo, productStockRepo, emailSender, app.log),
        updateStatus: new UpdateOrderStatusUseCase(orderRepo),
      },
      chat: {
        send: new SendChatMessageUseCase(
          productRepo,
          multimodalEmbedding,
          chatAdapter,
          app.log,
        ),
      },
      product: {
        list: new ListProductsUseCase(productRepo, productStockRepo),
        getById: new GetProductByIdUseCase(productRepo),
        getBySlug: new GetProductBySlugUseCase(productRepo, productStockRepo),
        create: new CreateProductUseCase(productRepo, productTypeRepo, multimodalEmbedding, app.log),
        update: new UpdateProductUseCase(
          productRepo,
          productTypeRepo,
          productStockRepo,
          multimodalEmbedding,
          app.log,
        ),
        delete: new DeleteProductUseCase(productRepo),
        getStock: new GetStockUseCase(productRepo, productStockRepo),
        increaseStock: new IncreaseStockUseCase(productRepo, productStockRepo),
        decreaseStock: new DecreaseStockUseCase(productRepo, productStockRepo),
      },
      productType: {
        list: new ListProductTypesUseCase(productTypeRepo),
        create: new CreateProductTypeUseCase(productTypeRepo),
      },
      user: {
        list: new ListUsersUseCase(userRepo),
        update: new UpdateUserUseCase(userRepo),
        updatePassword: new UpdateUserPasswordUseCase(userRepo, passwordHasher),
      },
      search: {
        voiceSearch: new SearchProductsByVoiceUseCase(
          productRepo,
          productStockRepo,
          multimodalEmbedding,
          transcription,
          audioConverter,
          env.SEARCH_VOICE_SIMILARITY_THRESHOLD,
          env.SEARCH_VOICE_MAX_DURATION_SECONDS,
        ),
      },
    };

    app.decorate('useCases', useCases);
    app.decorate('tokenSigner', tokenSigner);
    app.decorate('aiSecurity', aiSecurity);
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
