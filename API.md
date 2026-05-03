# Morning Mist Coffee — API Reference

Base URL: `https://morning-mist-coffee-backend.onrender.com`

Most `/api/v1/*` routes require a Bearer token (exceptions are noted per section):

```
Authorization: Bearer <accessToken>
```

Prices are in **cents** (e.g. `1800` = $18.00). Dates are ISO 8601 strings.

---

## Auth

### POST /api/v1/auth/register

Create a new user account. Requires the `x-user-registration-key` header.

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `x-user-registration-key` | Yes | Server-side registration secret |

**Body**

```json
{
  "firstName": "string (1–100)",
  "lastName": "string (1–100)",
  "email": "string (email)",
  "password": "string (8–128)"
}
```

**Response `201`**

```json
{
  "user": {
    "id": "uuid",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "role": "user | admin",
    "createdAt": "ISO datetime",
    "updatedAt": "ISO datetime"
  },
  "accessToken": "string",
  "refreshToken": "string"
}
```

---

### POST /api/v1/auth/login

**Body**

```json
{
  "email": "string",
  "password": "string (1–128)"
}
```

**Response `200`** — same shape as `/register`.

---

### POST /api/v1/auth/refresh

Exchange a refresh token for a new token pair.

**Body** — send either the `refreshToken` field or the `access_token` HttpOnly cookie (set automatically on login).

```json
{
  "refreshToken": "string (optional)"
}
```

**Response `200`**

```json
{
  "accessToken": "string",
  "refreshToken": "string"
}
```

---

### POST /api/v1/auth/logout

**Body**

```json
{
  "refreshToken": "string (optional)"
}
```

**Response `204`** — no body.

---

### GET /api/v1/auth/me

Returns the currently authenticated user. Requires Bearer token.

**Response `200`**

```json
{
  "id": "uuid",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "role": "user | admin",
  "createdAt": "ISO datetime",
  "updatedAt": "ISO datetime"
}
```

---

## Product Types

All endpoints require Bearer token.

### GET /api/v1/product-types

**Response `200`**

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "string",
      "createdAt": "ISO datetime",
      "updatedAt": "ISO datetime"
    }
  ]
}
```

---

### POST /api/v1/product-types

**Body**

```json
{
  "name": "string (1–100)"
}
```

**Response `201`**

```json
{
  "id": "uuid",
  "name": "string",
  "createdAt": "ISO datetime",
  "updatedAt": "ISO datetime"
}
```

---

## Products

`GET /api/v1/products` and `GET /api/v1/products/:id` are public — no authentication required. All other product endpoints require Bearer token.

### GET /api/v1/products

**Query parameters**

| Param | Type | Description | Default |
|-------|------|-------------|---------|
| `q` | string | Keyword search (1–200 chars) | — |
| `productTypeId` | uuid | Filter by product type | — |
| `currency` | `USD` \| `VND` | Filter by currency | — |
| `priceMin` | integer | Min price in cents | — |
| `priceMax` | integer | Max price in cents | — |
| `sortBy` | `createdAt` \| `name` \| `priceCents` | Sort field | `createdAt` |
| `sortDir` | `asc` \| `desc` | Sort direction | `desc` |
| `limit` | integer (1–100) | Page size | `20` |
| `offset` | integer (≥ 0) | Page offset | `0` |

**Response `200`**

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string | null",
      "priceCents": "integer",
      "currency": "USD | VND",
      "image": "string | null",
      "productTypeId": "uuid",
      "createdAt": "ISO datetime",
      "updatedAt": "ISO datetime"
    }
  ],
  "total": "integer",
  "limit": "integer",
  "offset": "integer"
}
```

---

### GET /api/v1/products/:id

**Response `200`** — single product object (same shape as items above).

---

### POST /api/v1/products

**Body**

```json
{
  "name": "string (1–200)",
  "description": "string (max 5000) | null",
  "priceCents": "integer (≥ 0)",
  "currency": "USD | VND",
  "image": "url (max 2048) | null",
  "productTypeId": "uuid"
}
```

**Response `201`** — created product object.

---

### PATCH /api/v1/products/:id

All fields optional; at least one required.

**Body**

```json
{
  "name": "string (1–200)",
  "description": "string (max 5000) | null",
  "priceCents": "integer (≥ 0)",
  "currency": "USD | VND",
  "image": "url (max 2048) | null",
  "productTypeId": "uuid"
}
```

**Response `200`** — updated product object.

---

### DELETE /api/v1/products/:id

**Response `204`** — no body.

---

### GET /api/v1/products/:id/stock

**Response `200`**

```json
{
  "productId": "uuid",
  "quantity": "integer"
}
```

---

### POST /api/v1/products/:id/stock/increase

**Body**

```json
{
  "quantity": "integer (≥ 1)"
}
```

**Response `200`** — updated stock object.

---

### POST /api/v1/products/:id/stock/decrease

**Body**

```json
{
  "quantity": "integer (≥ 1)"
}
```

**Response `200`** — updated stock object.

---

## Orders

All endpoints require Bearer token.

### GET /api/v1/orders

**Query parameters**

| Param | Type | Description | Default |
|-------|------|-------------|---------|
| `customerId` | uuid | Filter by customer | — |
| `status` | string | Filter by status (see below) | — |
| `currency` | `USD` \| `VND` | Filter by currency | — |
| `totalMin` | integer | Min total in cents | — |
| `totalMax` | integer | Max total in cents | — |
| `sortBy` | `createdAt` \| `totalCents` | Sort field | `createdAt` |
| `sortDir` | `asc` \| `desc` | Sort direction | `desc` |
| `limit` | integer (1–100) | Page size | `20` |
| `offset` | integer (≥ 0) | Page offset | `0` |

Order statuses: `pending`, `paid`, `shipped`, `delivered`, `cancelled`

**Response `200`**

```json
{
  "items": [
    {
      "id": "uuid",
      "customerId": "uuid",
      "status": "pending | paid | shipped | delivered | cancelled",
      "totalCents": "integer",
      "currency": "USD | VND",
      "createdAt": "ISO datetime",
      "updatedAt": "ISO datetime"
    }
  ],
  "total": "integer",
  "limit": "integer",
  "offset": "integer"
}
```

---

### GET /api/v1/orders/:id

**Response `200`** — single order object.

---

### POST /api/v1/orders

**Body**

```json
{
  "customerId": "uuid",
  "totalCents": "integer (≥ 0)",
  "currency": "USD | VND"
}
```

**Response `201`** — created order object.

---

### PATCH /api/v1/orders/:id/status

**Body**

```json
{
  "status": "pending | paid | shipped | delivered | cancelled"
}
```

**Response `200`** — updated order object.

---

## Health

No authentication required.

### GET /health

**Response `200`** (or `503` if DB is unreachable)

```json
{
  "status": "ok | degraded",
  "uptime": "number (seconds)",
  "timestamp": "ISO datetime",
  "checks": {
    "db": "ok | fail"
  }
}
```

---

### GET /ready

**Response `200`** (or `503` if DB is unreachable)

```json
{
  "status": "ok | fail",
  "checks": {
    "db": "ok | fail"
  }
}
```

---

## Error responses

All errors follow this shape:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

| Status | Code | Cause |
|--------|------|-------|
| `400` | `VALIDATION_ERROR` | Invalid request body or query params |
| `401` | `UNAUTHORIZED` | Missing or invalid Bearer token |
| `403` | `FORBIDDEN` | Insufficient permissions |
| `404` | `NOT_FOUND` | Resource not found |
| `409` | `CONFLICT` | Duplicate resource (e.g. email already registered) |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many requests |
| `500` | `INTERNAL_ERROR` | Unexpected server error |
