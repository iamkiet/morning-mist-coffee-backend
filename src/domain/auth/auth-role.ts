export const AUTH_ROLES = ['customer', 'staff', 'admin'] as const;
export type AuthRole = (typeof AUTH_ROLES)[number];

export const ACCOUNT_TYPES = ['employee', 'customer'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_EMPLOYEE: AccountType = 'employee';
export const ACCOUNT_TYPE_CUSTOMER: AccountType = 'customer';

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
