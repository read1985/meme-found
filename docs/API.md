# API Documentation

## Base URL
```
Production: https://your-app.vercel.app/api
Development: http://localhost:3000/api
```

## Authentication
All API routes except `/auth/*` require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Authentication

#### POST /auth/register
Create a new user account.

**Request Body:**
```typescript
{
  email: string;
  password: string;
  username: string;
}
```

**Response:**
```typescript
{
  user: {
    id: string;
    email: string;
    username: string;
    createdAt: string;
  };
  token: string;
}
```

#### POST /auth/login
Authenticate user and get token.

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  token: string;
  user: UserProfile;
}
```

### Coins

#### GET /coins/recent
Get recently launched coins (past 6 hours).

**Query Parameters:**
```typescript
{
  limit?: number;    // default: 50
  offset?: number;   // default: 0
  sort?: string;     // default: "createdAt:desc"
}
```

**Response:**
```typescript
{
  coins: Array<{
    address: string;
    name: string;
    symbol: string;
    createdAt: string;
    liquidity: number;
    holders: number;
    price: number;
    marketCap: number;
  }>;
  total: number;
}
```

#### GET /coins/:address
Get detailed information about a specific coin.

**Response:**
```typescript
{
  address: string;
  name: string;
  symbol: string;
  createdAt: string;
  metrics: {
    price: number;
    marketCap: number;
    liquidity: number;
    holders: number;
    volume24h: number;
  };
  contract: {
    mintAuthority: string;
    freezeAuthority: string;
    isVerified: boolean;
  };
  distribution: {
    topHolders: Array<{
      address: string;
      balance: number;
      percentage: number;
    }>;
  };
}
```

### Alerts

#### POST /alerts
Create a new alert.

**Request Body:**
```typescript
{
  name: string;
  conditions: Array<{
    metric: "price" | "liquidity" | "holders" | "volume";
    operator: "gt" | "lt" | "eq";
    value: number;
  }>;
  notification: {
    type: "email" | "webhook";
    target: string;
  };
}
```

**Response:**
```typescript
{
  id: string;
  name: string;
  conditions: Array<AlertCondition>;
  createdAt: string;
  status: "active" | "paused";
}
```

#### GET /alerts
List user's alerts.

**Query Parameters:**
```typescript
{
  status?: "active" | "paused";
  limit?: number;
  offset?: number;
}
```

**Response:**
```typescript
{
  alerts: Array<Alert>;
  total: number;
}
```

#### PUT /alerts/:id
Update an existing alert.

**Request Body:**
```typescript
{
  name?: string;
  conditions?: Array<AlertCondition>;
  status?: "active" | "paused";
}
```

**Response:**
```typescript
{
  id: string;
  name: string;
  conditions: Array<AlertCondition>;
  updatedAt: string;
  status: "active" | "paused";
}
```

#### DELETE /alerts/:id
Delete an alert.

**Response:**
```typescript
{
  success: true;
}
```

### WebSocket Events

Connect to WebSocket:
```typescript
const socket = io('wss://your-app.vercel.app');
```

#### Available Events

##### coin:new
Emitted when a new coin is detected.
```typescript
{
  address: string;
  name: string;
  symbol: string;
  initialMetrics: {
    price: number;
    liquidity: number;
  };
}
```

##### coin:update
Emitted when coin metrics are updated.
```typescript
{
  address: string;
  metrics: {
    price: number;
    liquidity: number;
    holders: number;
    volume24h: number;
  };
}
```

##### alert:triggered
Emitted when an alert condition is met.
```typescript
{
  alertId: string;
  coinAddress: string;
  condition: AlertCondition;
  timestamp: string;
}
```

## Error Handling

All endpoints return standard error responses:

```typescript
{
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### Common Error Codes
- `AUTH_REQUIRED`: Authentication required
- `INVALID_TOKEN`: Invalid or expired token
- `RATE_LIMIT`: Too many requests
- `VALIDATION_ERROR`: Invalid request data
- `NOT_FOUND`: Resource not found
- `SERVER_ERROR`: Internal server error

## Rate Limiting

- Authentication endpoints: 20 requests per minute
- Coin data endpoints: 100 requests per minute
- Alert management: 60 requests per minute

## Webhook Format

When configuring webhook notifications, your endpoint will receive POST requests with this format:

```typescript
{
  type: "alert_triggered";
  alertId: string;
  timestamp: string;
  data: {
    coinAddress: string;
    condition: AlertCondition;
    metrics: CoinMetrics;
  };
}
``` 