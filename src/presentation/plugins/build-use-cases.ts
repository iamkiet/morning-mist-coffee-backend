import { GetCurrentUserUseCase } from '../../application/auth/get-current-user.use-case.ts';
import { EmployeeLoginUseCase } from '../../application/auth/employee-login.use-case.ts';
import { CustomerLoginUseCase } from '../../application/auth/customer-login.use-case.ts';
import { LogoutUseCase } from '../../application/auth/logout.use-case.ts';
import { RefreshTokenUseCase } from '../../application/auth/refresh-token.use-case.ts';
import { AnswerQueryService } from '../../application/chat/answer-query.service.ts';
import { SendChatMessageUseCase } from '../../application/chat/send-chat-message.use-case.ts';
import { CreateOrderUseCase } from '../../application/order/create-order.use-case.ts';
import { GetOrderByIdUseCase } from '../../application/order/get-order-by-id.use-case.ts';
import { ListOrdersUseCase } from '../../application/order/list-orders.use-case.ts';
import { LookupOrderUseCase } from '../../application/order/lookup-order.use-case.ts';
import { UpdateOrderStatusUseCase } from '../../application/order/update-order-status.use-case.ts';
import { CreateProductReviewUseCase } from '../../application/product-review/create-product-review.use-case.ts';
import { CreateProductReviewReplyUseCase } from '../../application/product-review/create-product-review-reply.use-case.ts';
import { GetProductReviewByIdUseCase } from '../../application/product-review/get-product-review-by-id.use-case.ts';
import { ListProductReviewsUseCase } from '../../application/product-review/list-product-reviews.use-case.ts';
import { ListPublicProductReviewsUseCase } from '../../application/product-review/list-public-product-reviews.use-case.ts';
import { UpdateProductReviewStatusUseCase } from '../../application/product-review/update-product-review-status.use-case.ts';
import { CreateProductCategoryUseCase } from '../../application/product-category/create-product-category.use-case.ts';
import { UpdateProductCategoryUseCase } from '../../application/product-category/update-product-category.use-case.ts';
import { DeleteProductCategoryUseCase } from '../../application/product-category/delete-product-category.use-case.ts';
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
import { SetProductCategoriesUseCase } from '../../application/product/set-product-categories.use-case.ts';
import { SetVariantPropertyValuesUseCase } from '../../application/product/set-variant-property-values.use-case.ts';
import { UpdateProductUseCase } from '../../application/product/update-product.use-case.ts';
import { UpdateProductVariantUseCase } from '../../application/product/update-product-variant.use-case.ts';
import { CreateEmployeeUseCase } from '../../application/employee/create-employee.use-case.ts';
import { DeleteEmployeeUseCase } from '../../application/employee/delete-employee.use-case.ts';
import { ListEmployeesUseCase } from '../../application/employee/list-employees.use-case.ts';
import { UpdateEmployeePasswordUseCase } from '../../application/employee/update-employee-password.use-case.ts';
import { UpdateEmployeeUseCase } from '../../application/employee/update-employee.use-case.ts';
import { CreateCustomerUseCase } from '../../application/customer/create-customer.use-case.ts';
import { DeleteCustomerUseCase } from '../../application/customer/delete-customer.use-case.ts';
import { GetCustomerByIdUseCase } from '../../application/customer/get-customer-by-id.use-case.ts';
import { ListCustomersUseCase } from '../../application/customer/list-customers.use-case.ts';
import { UpdateCustomerPasswordUseCase } from '../../application/customer/update-customer-password.use-case.ts';
import { UpdateCustomerUseCase } from '../../application/customer/update-customer.use-case.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { AudioConverterPort } from '../../domain/ports/audio-converter.port.ts';
import type { ChatPort } from '../../domain/ports/chat.port.ts';
import type { EmailSender } from '../../domain/ports/email-sender.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port.ts';
import type { ChatFilterExtractionPort } from '../../domain/ports/chat-filter-extraction.port.ts';
import type { ReviewClassificationPort } from '../../domain/ports/review-classification.port.ts';
import type { TokenSigner } from '../../domain/ports/token-signer.port.ts';
import type { TranscriptionPort } from '../../domain/ports/transcription.port.ts';
import type { OrderRepo } from '../../domain/order/order.repo.ts';
import type { ProductReviewRepo } from '../../domain/product-review/product-review.repo.ts';
import type { ProductCategoryRepo } from '../../domain/product-category/product-category.repo.ts';
import type { ProductPropertyRepo } from '../../domain/product-property/product-property.repo.ts';
import type { ProductVariantRepo } from '../../domain/product/product-variant.repo.ts';
import type { ProductRepo } from '../../domain/product/product.repo.ts';
import type { RefreshTokenRepo } from '../../domain/auth/refresh-token.repo.ts';
import type { EmployeeRepo } from '../../domain/employee/employee.repo.ts';
import type { CustomerRepo } from '../../domain/customer/customer.repo.ts';
import type { AuthUseCases } from '../controllers/auth.controller.ts';
import type { ChatUseCases } from '../controllers/chat.controller.ts';
import type { OrderUseCases } from '../controllers/order.controller.ts';
import type { ProductReviewUseCases } from '../controllers/product-review.controller.ts';
import type { ProductCategoryUseCases } from '../controllers/product-category.controller.ts';
import type { ProductPropertyUseCases } from '../controllers/product-property.controller.ts';
import type { ProductUseCases } from '../controllers/product.controller.ts';
import type { EmployeeUseCases } from '../controllers/employee.controller.ts';
import type { CustomerUseCases } from '../controllers/customer.controller.ts';

export interface AppUseCases {
  auth: AuthUseCases;
  chat: ChatUseCases;
  order: OrderUseCases;
  productReview: ProductReviewUseCases;
  product: ProductUseCases;
  productCategory: ProductCategoryUseCases;
  productProperty: ProductPropertyUseCases;
  employee: EmployeeUseCases;
  customer: CustomerUseCases;
}

export interface UseCaseDeps {
  orderRepo: OrderRepo;
  productReviewRepo: ProductReviewRepo;
  employeeRepo: EmployeeRepo;
  customerRepo: CustomerRepo;
  refreshTokenRepo: RefreshTokenRepo;
  productRepo: ProductRepo;
  productVariantRepo: ProductVariantRepo;
  productCategoryRepo: ProductCategoryRepo;
  productPropertyRepo: ProductPropertyRepo;
  emailSender: EmailSender;
  embedding: MultimodalEmbeddingPort;
  transcription: TranscriptionPort;
  chat: ChatPort;
  filterExtraction: ChatFilterExtractionPort;
  reviewClassification: ReviewClassificationPort;
  audioConverter: AudioConverterPort;
  passwordHasher: PasswordHasher;
  tokenSigner: TokenSigner;
  logger: AppLogger;
}

export function buildUseCases(deps: UseCaseDeps): AppUseCases {
  const answerQuery = new AnswerQueryService(
    deps.productRepo,
    deps.productVariantRepo,
    deps.productCategoryRepo,
    deps.chat,
    deps.filterExtraction,
    deps.logger,
  );

  const chatSend = new SendChatMessageUseCase(
    deps.embedding,
    deps.transcription,
    deps.audioConverter,
    answerQuery,
    deps.logger,
  );

  return {
    auth: {
      employeeLogin: new EmployeeLoginUseCase(
        deps.employeeRepo,
        deps.refreshTokenRepo,
        deps.passwordHasher,
        deps.tokenSigner,
      ),
      customerLogin: new CustomerLoginUseCase(
        deps.customerRepo,
        deps.refreshTokenRepo,
        deps.passwordHasher,
        deps.tokenSigner,
      ),
      refresh: new RefreshTokenUseCase(
        deps.employeeRepo,
        deps.customerRepo,
        deps.refreshTokenRepo,
        deps.tokenSigner,
      ),
      logout: new LogoutUseCase(deps.refreshTokenRepo, deps.tokenSigner),
      me: new GetCurrentUserUseCase(deps.employeeRepo, deps.customerRepo),
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
      updateStatus: new UpdateOrderStatusUseCase(deps.orderRepo, deps.productVariantRepo),
    },
    productReview: {
      list: new ListProductReviewsUseCase(deps.productReviewRepo),
      listPublic: new ListPublicProductReviewsUseCase(deps.productReviewRepo),
      getById: new GetProductReviewByIdUseCase(deps.productReviewRepo),
      create: new CreateProductReviewUseCase(
        deps.productReviewRepo,
        deps.productRepo,
        deps.reviewClassification,
        deps.logger,
      ),
      createReply: new CreateProductReviewReplyUseCase(deps.productReviewRepo),
      updateStatus: new UpdateProductReviewStatusUseCase(deps.productReviewRepo),
    },
    chat: {
      send: chatSend,
    },
    product: {
      list: new ListProductsUseCase(
        deps.productRepo,
        deps.productVariantRepo,
        deps.productCategoryRepo,
      ),
      getById: new GetProductByIdUseCase(
        deps.productRepo,
        deps.productVariantRepo,
        deps.productCategoryRepo,
      ),
      getBySlug: new GetProductBySlugUseCase(
        deps.productRepo,
        deps.productVariantRepo,
        deps.productCategoryRepo,
      ),
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
        deps.productPropertyRepo,
        deps.embedding,
        deps.logger,
      ),
      updateVariant: new UpdateProductVariantUseCase(deps.productVariantRepo),
      deleteVariant: new DeleteProductVariantUseCase(
        deps.productRepo,
        deps.productVariantRepo,
        deps.embedding,
        deps.logger,
      ),
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
      update: new UpdateProductCategoryUseCase(
        deps.productCategoryRepo,
        deps.productRepo,
        deps.embedding,
        deps.logger,
      ),
      delete: new DeleteProductCategoryUseCase(
        deps.productCategoryRepo,
        deps.productRepo,
        deps.embedding,
        deps.logger,
      ),
    },
    productProperty: {
      list: new ListProductPropertiesUseCase(deps.productPropertyRepo),
      create: new CreateProductPropertyUseCase(deps.productPropertyRepo),
    },
    employee: {
      list: new ListEmployeesUseCase(deps.employeeRepo),
      create: new CreateEmployeeUseCase(deps.employeeRepo, deps.passwordHasher),
      update: new UpdateEmployeeUseCase(deps.employeeRepo),
      updatePassword: new UpdateEmployeePasswordUseCase(
        deps.employeeRepo,
        deps.passwordHasher,
      ),
      delete: new DeleteEmployeeUseCase(deps.employeeRepo),
    },
    customer: {
      list: new ListCustomersUseCase(deps.customerRepo),
      getById: new GetCustomerByIdUseCase(deps.customerRepo),
      create: new CreateCustomerUseCase(deps.customerRepo, deps.passwordHasher),
      update: new UpdateCustomerUseCase(deps.customerRepo),
      updatePassword: new UpdateCustomerPasswordUseCase(
        deps.customerRepo,
        deps.passwordHasher,
      ),
      delete: new DeleteCustomerUseCase(deps.customerRepo),
    },
  };
}
