import { env } from '../../config/env.ts';
import { createRegistrationKeyChecker } from './registration-key.ts';

export const EMPLOYEE_REGISTRATION_KEY_HEADER = 'x-employee-registration-key';

export const checkEmployeeRegistrationKey = createRegistrationKeyChecker(
  EMPLOYEE_REGISTRATION_KEY_HEADER,
  () => env.EMPLOYEE_REGISTRATION_KEY,
);
