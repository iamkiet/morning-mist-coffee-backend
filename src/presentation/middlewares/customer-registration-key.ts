import { env } from '../../config/env.ts';
import { createRegistrationKeyChecker } from './registration-key.ts';

export const CUSTOMER_REGISTRATION_KEY_HEADER = 'x-customer-registration-key';

export const checkCustomerRegistrationKey = createRegistrationKeyChecker(
  CUSTOMER_REGISTRATION_KEY_HEADER,
  () => env.CUSTOMER_REGISTRATION_KEY,
);
