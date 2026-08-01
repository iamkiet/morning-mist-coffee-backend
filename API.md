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
    "status": "active | inactive | banned",
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
  "status": "active | inactive | banned",
  "createdAt": "ISO datetime",
  "updatedAt": "ISO datetime"
}
```

---

## Users

All endpoints require Bearer token with `admin` role.

### GET /api/v1/users

List all users with optional filtering, sorting, and pagination.

**Query parameters**

| Param | Type | Description | Default |
|-------|------|-------------|---------|
| `role` | `user` \| `admin` | Filter by role | — |
| `status` | `active` \| `inactive` \| `banned` | Filter by status | — |
| `q` | string | Keyword search (firstName, lastName, email) | — |
| `sortBy` | `createdAt` \| `firstName` \| `lastName` \| `email` | Sort field | `createdAt` |
| `sortDir` | `asc` \| `desc` | Sort direction | `desc` |
| `limit` | integer (1–100) | Page size | `20` |
| `offset` | integer (≥ 0) | Page offset | `0` |

**Response `200`**

```json
{
  "items": [
    {
      "id": "uuid",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "role": "user | admin",
      "status": "active | inactive | banned",
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
| `currency` | `VND` | Filter by currency | — |
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
      "currency": "VND",
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
  "currency": "VND",
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
  "currency": "VND",
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

`POST /api/v1/orders` is public — no authentication required. All other order endpoints require Bearer token.

### GET /api/v1/orders

**Query parameters**

| Param | Type | Description | Default |
|-------|------|-------------|---------|
| `email` | string | Filter by customer email | — |
| `status` | string | Filter by status (see below) | — |
| `currency` | `VND` | Filter by currency | — |
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
      "email": "string",
      "status": "pending | paid | shipped | delivered | cancelled",
      "totalCents": "integer",
      "currency": "VND",
      "items": [
        {
          "id": "uuid",
          "productId": "uuid | null",
          "name": "string",
          "priceCents": "integer",
          "quantity": "integer"
        }
      ],
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

### GET /api/v1/orders/lookup

Look up a single order by customer email **and** order code. Public — no authentication required (guest checkout has no account).

Access control on this route (A01 fix):

- Both `email` and `code` are required. `code` is the first 8 characters of the order id, printed on the customer's receipt. Only the order matching both is returned — knowing an email alone is no longer enough to read someone's order history.
- Rate-limited separately and much tighter than the app default (`ORDER_LOOKUP_RATE_MAX`/`ORDER_LOOKUP_RATE_WINDOW`, default 5 req/minute), keyed on **IP + email** so rotating IPs does not reset the counter for a given email.

**Query parameters**

| Param | Type | Description | Required |
|-------|------|-------------|----------|
| `email` | string | The customer email address to look up | Yes |
| `code` | string | 8-character hex order code from the receipt (first 8 chars of the order id) | Yes |

**Response `200`**

```json
{
  "items": [
    {
      "id": "uuid",
      "email": "string",
      "status": "pending | paid | shipped | delivered | cancelled",
      "totalCents": "integer",
      "currency": "VND",
      "items": [
        {
          "id": "uuid",
          "productId": "uuid | null",
          "name": "string",
          "priceCents": "integer",
          "quantity": "integer"
        }
      ],
      "createdAt": "ISO datetime",
      "updatedAt": "ISO datetime"
    }
  ]
}
```

---

### GET /api/v1/orders/:id

**Response `200`** — single order object.

---

### POST /api/v1/orders

Submit a new order. The backend automatically re-evaluates all item prices using database product records to guarantee price integrity.

**Body**

```json
{
  "email": "string",
  "totalCents": "integer (≥ 0)",
  "currency": "VND",
  "items": [
    {
      "productId": "uuid",
      "name": "string",
      "priceCents": "integer",
      "quantity": "integer (≥ 1)"
    }
  ]
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

## Search

### POST /api/v1/search/voice

Voice semantic search. Public — no authentication required, but rate-limited separately (see `SEARCH_VOICE_RATE_MAX`/`SEARCH_VOICE_RATE_WINDOW`, default 10 req/minute/IP).

Audio-native: the recorded voice query is embedded directly with `gemini-embedding-2` and matched against product-text embeddings in the same vector space — no transcription step in the primary match path. Transcript is generated separately, only for display.

**Request** — `multipart/form-data`, one file field containing the audio.

- Max size: 10MB
- Max duration: 60s
- Accepted content types: `audio/webm`, `audio/wav`, `audio/wave`, `audio/x-wav`, `audio/mpeg`, `audio/mp3`, `audio/ogg`

**Response `200`**

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string | null",
      "priceCents": "integer",
      "currency": "VND",
      "image": "string | null",
      "productTypeId": "uuid",
      "stockQuantity": "integer",
      "createdAt": "ISO datetime",
      "updatedAt": "ISO datetime",
      "score": "number (0-1, cosine similarity)"
    }
  ],
  "transcript": "string | null",
  "usedFallback": "boolean"
}
```

`usedFallback: true` means audio-native similarity was below `SEARCH_VOICE_SIMILARITY_THRESHOLD`, so results came from a keyword search over the transcript instead — `score` is `0` for those items (keyword search has no comparable similarity score).

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
