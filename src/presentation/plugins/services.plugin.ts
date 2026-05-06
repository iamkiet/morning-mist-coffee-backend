import fp from 'fastify-plugin';
import { ResendEmailSender } from '../../infrastructure/adapters/resend.email-sender.js';
import { GetCurrentUserUseCase } from '../../application/auth/get-current-user.use-case.js';
import { LoginUserUseCase } from '../../application/auth/login-user.use-case.js';
import { LogoutUseCase } from '../../application/auth/logout.use-case.js';
import { RefreshTokenUseCase } from '../../application/auth/refresh-token.use-case.js';
import { RegisterUserUseCase } from '../../application/auth/register-user.use-case.js';
import { ListUsersUseCase } from '../../application/user/list-users.use-case.js';
import { UpdateUserUseCase } from '../../application/user/update-user.use-case.js';
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
import { GetStockUseCase } from '../../application/product/get-stock.use-case.js';
import { IncreaseStockUseCase } from '../../application/product/increase-stock.use-case.js';
import { ListProductsUseCase } from '../../application/product/list-products.use-case.js';
import { UpdateProductUseCase } from '../../application/product/update-product.use-case.js';
import { env } from '../../config/env.js';
import type { TokenSigner } from '../../domain/ports/token-signer.port.js';
import { BcryptPasswordHasher } from '../../infrastructure/adapters/bcrypt.password-hasher.js';
import { JoseTokenSigner } from '../../infrastructure/adapters/jose.token-signer.js';
import { PostgresOrderRepository } from '../../infrastructure/repositories/order.repository.js';
import { PostgresProductRepository } from '../../infrastructure/repositories/product.repository.js';
import { PostgresProductStockRepository } from '../../infrastructure/repositories/product-stock.repository.js';
import { PostgresProductTypeRepository } from '../../infrastructure/repositories/product-type.repository.js';
import { PostgresRefreshTokenRepository } from '../../infrastructure/repositories/refresh-token.repository.js';
import { PostgresUserRepository } from '../../infrastructure/repositories/user.repository.js';
import type { AuthUseCases } from '../controllers/auth.controller.js';
import type { OrderUseCases } from '../controllers/order.controller.js';
import type { ProductUseCases } from '../controllers/product.controller.js';
import type { ProductTypeUseCases } from '../controllers/product-type.controller.js';
import type { UserUseCases } from '../controllers/user.controller.js';

export interface AppUseCases {
  auth: AuthUseCases;
  order: OrderUseCases;
  product: ProductUseCases;
  productType: ProductTypeUseCases;
  user: UserUseCases;
}

declare module 'fastify' {
  interface FastifyInstance {
    useCases: AppUseCases;
    tokenSigner: TokenSigner;
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
        create: new CreateOrderUseCase(orderRepo, productStockRepo, emailSender),
        updateStatus: new UpdateOrderStatusUseCase(orderRepo),
      },
      product: {
        list: new ListProductsUseCase(productRepo, productStockRepo),
        getById: new GetProductByIdUseCase(productRepo),
        create: new CreateProductUseCase(productRepo, productTypeRepo),
        update: new UpdateProductUseCase(productRepo, productTypeRepo),
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
      },
    };

    app.decorate('useCases', useCases);
    app.decorate('tokenSigner', tokenSigner);
  },
  { name: 'services', dependencies: ['db'] },
);
