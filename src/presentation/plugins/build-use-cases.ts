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
import { CreateProductCategoryUseCase } from '../../application/product-category/create-product-category.use-case.ts';
import { ListProductCategoriesUseCase } from '../../application/product-category/list-product-categories.use-case.ts';
import { CreateProductPropertyUseCase } from '../../application/product-property/create-product-property.use-case.ts';
import { ListProductPropertiesUseCase } from '../../application/product-property/list-product-properties.use-case.ts';
import { CreateProductUseCase } from '../../application/product/create-product.use-case.ts';
import { CreateProductVariantUseCase } from '../../application/product/create-product-variant.use-case.ts';
import { DecreaseVariantStockUseCase } from '../../application/product/decrease-variant-stock.use-case.ts';
import { DeleteProductUseCase } from '../../application/product/delete-product.use-case.ts';
import { DeleteProductVariantUseCase } from '../../application/product/delete-product-variant.use-case.ts';
import { GetProductByIdUseCase } from '../../application/product/get-product-by-id.use-case.ts';
import { GetProductBySlugUseCase } from '../../application/product/get-product-by-slug.use-case.ts';
import { GetVariantStockUseCase } from '../../application/product/get-variant-stock.use-case.ts';
import { IncreaseVariantStockUseCase } from '../../application/product/increase-variant-stock.use-case.ts';
import { ListProductsUseCase } from '../../application/product/list-products.use-case.ts';
import { SearchProductsByVoiceUseCase } from '../../application/product/search-products-by-voice.use-case.ts';
import { SetProductCategoriesUseCase } from '../../application/product/set-product-categories.use-case.ts';
import { SetVariantPropertyValuesUseCase } from '../../application/product/set-variant-property-values.use-case.ts';
import { UpdateProductUseCase } from '../../application/product/update-product.use-case.ts';
import { UpdateProductVariantUseCase } from '../../application/product/update-product-variant.use-case.ts';
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
import type { ProductCategoryRepo } from '../../domain/product-category/product-category.repo.ts';
import type { ProductPropertyRepo } from '../../domain/product-property/product-property.repo.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import type { RefreshTokenRepo } from '../../domain/auth/refresh-token.repo.ts';
import type { UserRepo } from '../../domain/user/user.repo.ts';
import type { AuthUseCases } from '../controllers/auth.controller.ts';
import type { ChatUseCases } from '../controllers/chat.controller.ts';
import type { OrderUseCases } from '../controllers/order.controller.ts';
import type { ProductCategoryUseCases } from '../controllers/product-category.controller.ts';
import type { ProductPropertyUseCases } from '../controllers/product-property.controller.ts';
import type { ProductUseCases } from '../controllers/product.controller.ts';
import type { SearchUseCases } from '../controllers/search.controller.ts';
import type { UserUseCases } from '../controllers/user.controller.ts';

export interface AppUseCases {
  auth: AuthUseCases;
  chat: ChatUseCases;
  order: OrderUseCases;
  product: ProductUseCases;
  productCategory: ProductCategoryUseCases;
  productProperty: ProductPropertyUseCases;
  user: UserUseCases;
  search: SearchUseCases;
}

export interface UseCaseDeps {
  orderRepo: OrderRepo;
  userRepo: UserRepo;
  refreshTokenRepo: RefreshTokenRepo;
  productRepo: ProductRepo;
  productVariantRepo: ProductVariantRepo;
  productCategoryRepo: ProductCategoryRepo;
  productPropertyRepo: ProductPropertyRepo;
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
    deps.productVariantRepo,
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
        deps.productVariantRepo,
        deps.emailSender,
        deps.logger,
      ),
      updateStatus: new UpdateOrderStatusUseCase(deps.orderRepo),
    },
    chat: {
      send: chatSend,
    },
    product: {
      list: new ListProductsUseCase(deps.productRepo, deps.productVariantRepo),
      getById: new GetProductByIdUseCase(deps.productRepo, deps.productVariantRepo),
      getBySlug: new GetProductBySlugUseCase(deps.productRepo, deps.productVariantRepo),
      create: new CreateProductUseCase(
        deps.productRepo,
        deps.productVariantRepo,
        deps.productCategoryRepo,
        deps.embedding,
        deps.logger,
      ),
      update: new UpdateProductUseCase(
        deps.productRepo,
        deps.productVariantRepo,
        deps.embedding,
        deps.logger,
      ),
      delete: new DeleteProductUseCase(deps.productRepo),
      createVariant: new CreateProductVariantUseCase(
        deps.productRepo,
        deps.productVariantRepo,
      ),
      updateVariant: new UpdateProductVariantUseCase(deps.productVariantRepo),
      deleteVariant: new DeleteProductVariantUseCase(deps.productVariantRepo),
      getVariantStock: new GetVariantStockUseCase(deps.productVariantRepo),
      increaseVariantStock: new IncreaseVariantStockUseCase(deps.productVariantRepo),
      decreaseVariantStock: new DecreaseVariantStockUseCase(deps.productVariantRepo),
      setCategories: new SetProductCategoriesUseCase(
        deps.productRepo,
        deps.productCategoryRepo,
        deps.embedding,
        deps.logger,
      ),
      setVariantPropertyValues: new SetVariantPropertyValuesUseCase(
        deps.productRepo,
        deps.productVariantRepo,
        deps.productPropertyRepo,
        deps.embedding,
        deps.logger,
      ),
    },
    productCategory: {
      list: new ListProductCategoriesUseCase(deps.productCategoryRepo),
      create: new CreateProductCategoryUseCase(deps.productCategoryRepo),
    },
    productProperty: {
      list: new ListProductPropertiesUseCase(deps.productPropertyRepo),
      create: new CreateProductPropertyUseCase(deps.productPropertyRepo),
    },
    user: {
      list: new ListUsersUseCase(deps.userRepo),
      update: new UpdateUserUseCase(deps.userRepo),
      updatePassword: new UpdateUserPasswordUseCase(deps.userRepo, deps.passwordHasher),
    },
    search: {
      voiceSearch: new SearchProductsByVoiceUseCase(
        deps.productVariantRepo,
        deps.embedding,
        deps.transcription,
        deps.audioConverter,
        chatSend,
        env.SEARCH_VOICE_MAX_DURATION_SECONDS,
      ),
    },
  };
}
