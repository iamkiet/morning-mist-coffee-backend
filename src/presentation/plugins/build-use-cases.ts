import { GetCurrentUserUseCase } from '../../application/auth/get-current-user.use-case.ts';
import { LoginUserUseCase } from '../../application/auth/login-user.use-case.ts';
import { LogoutUseCase } from '../../application/auth/logout.use-case.ts';
import { RefreshTokenUseCase } from '../../application/auth/refresh-token.use-case.ts';
import { RegisterUserUseCase } from '../../application/auth/register-user.use-case.ts';
import { SendChatMessageUseCase } from '../../application/chat/send-chat-message.use-case.ts';
import { CreateOrderUseCase } from '../../application/order/create-order.use-case.ts';
import { GetOrderByIdUseCase } from '../../application/order/get-order-by-id.use-case.ts';
import { ListOrdersUseCase } from '../../application/order/list-orders.use-case.ts';
import { LookupOrderUseCase } from '../../application/order/lookup-order.use-case.ts';
import { UpdateOrderStatusUseCase } from '../../application/order/update-order-status.use-case.ts';
import { CreateProductTypeUseCase } from '../../application/product-type/create-product-type.use-case.ts';
import { ListProductTypesUseCase } from '../../application/product-type/list-product-types.use-case.ts';
import { CreateProductUseCase } from '../../application/product/create-product.use-case.ts';
import { DecreaseStockUseCase } from '../../application/product/decrease-stock.use-case.ts';
import { DeleteProductUseCase } from '../../application/product/delete-product.use-case.ts';
import { GetProductByIdUseCase } from '../../application/product/get-product-by-id.use-case.ts';
import { GetProductBySlugUseCase } from '../../application/product/get-product-by-slug.use-case.ts';
import { GetStockUseCase } from '../../application/product/get-stock.use-case.ts';
import { IncreaseStockUseCase } from '../../application/product/increase-stock.use-case.ts';
import { ListProductsUseCase } from '../../application/product/list-products.use-case.ts';
import { SearchProductsByVoiceUseCase } from '../../application/product/search-products-by-voice.use-case.ts';
import { UpdateProductUseCase } from '../../application/product/update-product.use-case.ts';
import { ListUsersUseCase } from '../../application/user/list-users.use-case.ts';
import { UpdateUserPasswordUseCase } from '../../application/user/update-user-password.use-case.ts';
import { UpdateUserUseCase } from '../../application/user/update-user.use-case.ts';
import { env } from '../../config/env.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { AudioConverterPort } from '../../domain/ports/audio-converter.port.ts';
import type { ChatPort } from '../../domain/ports/chat.port.ts';
import type { EmailSender } from '../../domain/ports/email-sender.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port.ts';
import type { ProductFilterExtractionPort } from '../../domain/ports/product-filter-extraction.port.ts';
import type { TokenSigner } from '../../domain/ports/token-signer.port.ts';
import type { TranscriptionPort } from '../../domain/ports/transcription.port.ts';
import type { OrderRepo } from '../../domain/order/order.repo.ts';
import type { ProductTypeRepo } from '../../domain/product-type/product-type.repo.ts';
import type { ProductStockRepo } from '../../domain/product/product-stock.repo.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import type { RefreshTokenRepo } from '../../domain/auth/refresh-token.repo.ts';
import type { UserRepo } from '../../domain/user/user.repo.ts';
import type { AuthUseCases } from '../controllers/auth.controller.ts';
import type { ChatUseCases } from '../controllers/chat.controller.ts';
import type { OrderUseCases } from '../controllers/order.controller.ts';
import type { ProductTypeUseCases } from '../controllers/product-type.controller.ts';
import type { ProductUseCases } from '../controllers/product.controller.ts';
import type { SearchUseCases } from '../controllers/search.controller.ts';
import type { UserUseCases } from '../controllers/user.controller.ts';

export interface AppUseCases {
  auth: AuthUseCases;
  chat: ChatUseCases;
  order: OrderUseCases;
  product: ProductUseCases;
  productType: ProductTypeUseCases;
  user: UserUseCases;
  search: SearchUseCases;
}

export interface UseCaseDeps {
  orderRepo: OrderRepo;
  userRepo: UserRepo;
  refreshTokenRepo: RefreshTokenRepo;
  productRepo: ProductRepo;
  productTypeRepo: ProductTypeRepo;
  productStockRepo: ProductStockRepo;
  emailSender: EmailSender;
  embedding: MultimodalEmbeddingPort;
  transcription: TranscriptionPort;
  chat: ChatPort;
  filterExtraction: ProductFilterExtractionPort;
  audioConverter: AudioConverterPort;
  passwordHasher: PasswordHasher;
  tokenSigner: TokenSigner;
  logger: AppLogger;
}

export function buildUseCases(deps: UseCaseDeps): AppUseCases {
  const chatSend = new SendChatMessageUseCase(
    deps.productRepo,
    deps.embedding,
    deps.chat,
    deps.filterExtraction,
    deps.logger,
  );

  return {
    auth: {
      register: new RegisterUserUseCase(
        deps.userRepo,
        deps.refreshTokenRepo,
        deps.passwordHasher,
        deps.tokenSigner,
      ),
      login: new LoginUserUseCase(
        deps.userRepo,
        deps.refreshTokenRepo,
        deps.passwordHasher,
        deps.tokenSigner,
      ),
      refresh: new RefreshTokenUseCase(
        deps.userRepo,
        deps.refreshTokenRepo,
        deps.tokenSigner,
      ),
      logout: new LogoutUseCase(deps.refreshTokenRepo, deps.tokenSigner),
      me: new GetCurrentUserUseCase(deps.userRepo),
    },
    order: {
      list: new ListOrdersUseCase(deps.orderRepo),
      getById: new GetOrderByIdUseCase(deps.orderRepo),
      lookup: new LookupOrderUseCase(deps.orderRepo),
      create: new CreateOrderUseCase(
        deps.orderRepo,
        deps.productRepo,
        deps.productStockRepo,
        deps.emailSender,
        deps.logger,
      ),
      updateStatus: new UpdateOrderStatusUseCase(deps.orderRepo),
    },
    chat: {
      send: chatSend,
    },
    product: {
      list: new ListProductsUseCase(deps.productRepo, deps.productStockRepo),
      getById: new GetProductByIdUseCase(deps.productRepo, deps.productStockRepo),
      getBySlug: new GetProductBySlugUseCase(deps.productRepo, deps.productStockRepo),
      create: new CreateProductUseCase(
        deps.productRepo,
        deps.productTypeRepo,
        deps.embedding,
        deps.logger,
      ),
      update: new UpdateProductUseCase(
        deps.productRepo,
        deps.productTypeRepo,
        deps.productStockRepo,
        deps.embedding,
        deps.logger,
      ),
      delete: new DeleteProductUseCase(deps.productRepo),
      getStock: new GetStockUseCase(deps.productRepo, deps.productStockRepo),
      increaseStock: new IncreaseStockUseCase(deps.productRepo, deps.productStockRepo),
      decreaseStock: new DecreaseStockUseCase(deps.productRepo, deps.productStockRepo),
    },
    productType: {
      list: new ListProductTypesUseCase(deps.productTypeRepo),
      create: new CreateProductTypeUseCase(deps.productTypeRepo),
    },
    user: {
      list: new ListUsersUseCase(deps.userRepo),
      update: new UpdateUserUseCase(deps.userRepo),
      updatePassword: new UpdateUserPasswordUseCase(deps.userRepo, deps.passwordHasher),
    },
    search: {
      voiceSearch: new SearchProductsByVoiceUseCase(
        deps.productStockRepo,
        deps.embedding,
        deps.transcription,
        deps.audioConverter,
        chatSend,
        env.SEARCH_VOICE_MAX_DURATION_SECONDS,
      ),
    },
  };
}
