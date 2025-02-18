# Development Guide

## Development Environment Setup

### Prerequisites
1. Install required software:
   ```bash
   # Install Node.js 18+ (using nvm)
   nvm install 18
   nvm use 18
   
   # Install pnpm
   npm install -g pnpm
   
   # Install Solana CLI tools
   sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
   ```

2. IDE Setup (VS Code recommended):
   ```json
   // Recommended extensions
   {
     "recommendations": [
       "dbaeumer.vscode-eslint",
       "esbenp.prettier-vscode",
       "bradlc.vscode-tailwindcss",
       "prisma.prisma",
       "ms-vscode.vscode-typescript-next"
     ]
   }
   ```

### Project Setup

1. Clone and Install:
   ```bash
   git clone https://github.com/yourusername/meme-found.git
   cd meme-found
   pnpm install
   ```

2. Environment Configuration:
   ```bash
   # Copy example env file
   cp .env.example .env.local
   
   # Configure required variables
   DATABASE_URL="postgres://..."
   NEXT_PUBLIC_SOLANA_RPC_URL="https://..."
   NEXT_PUBLIC_RAYDIUM_API_URL="https://..."
   ```

3. Database Setup:
   ```bash
   # Initialize Prisma
   pnpm prisma generate
   
   # Run migrations
   pnpm prisma migrate dev
   
   # Seed database (if needed)
   pnpm prisma db seed
   ```

## Development Workflow

### Branch Strategy
```
main           # Production branch
├── staging    # Staging environment
└── dev        # Development branch
    ├── feature/... # Feature branches
    └── fix/...     # Bug fix branches
```

### Commit Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add new alert type
fix: resolve WebSocket connection issue
docs: update API documentation
style: format code
refactor: restructure alert processing
test: add unit tests for alert validation
chore: update dependencies
```

### Code Style

#### TypeScript
```typescript
// Use explicit types
interface AlertConfig {
  name: string;
  conditions: AlertCondition[];
}

// Use functional components
const AlertWidget: React.FC<AlertWidgetProps> = ({ config }) => {
  // ...
};

// Use async/await
const fetchCoinData = async (address: string): Promise<CoinData> => {
  try {
    const response = await api.get(`/coins/${address}`);
    return response.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
};
```

#### React Components
```typescript
// components/AlertCard.tsx
import { type FC } from 'react';
import { useAlertData } from '@/hooks/useAlertData';

interface AlertCardProps {
  alertId: string;
}

export const AlertCard: FC<AlertCardProps> = ({ alertId }) => {
  const { data, isLoading, error } = useAlertData(alertId);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="p-4 rounded-lg shadow-md">
      {/* Component content */}
    </div>
  );
};
```

### Testing

#### Unit Tests
```typescript
// __tests__/components/AlertCard.test.tsx
import { render, screen } from '@testing-library/react';
import { AlertCard } from '@/components/AlertCard';

describe('AlertCard', () => {
  it('renders alert details correctly', () => {
    render(<AlertCard alertId="test-id" />);
    expect(screen.getByText(/Alert Details/i)).toBeInTheDocument();
  });
});
```

#### Integration Tests
```typescript
// __tests__/api/alerts.test.ts
import { createAlert, getAlert } from '@/lib/api/alerts';

describe('Alert API', () => {
  it('creates and retrieves alerts', async () => {
    const alert = await createAlert({ /* ... */ });
    const retrieved = await getAlert(alert.id);
    expect(retrieved).toEqual(alert);
  });
});
```

### Performance Optimization

1. **Code Splitting**
   ```typescript
   // Use dynamic imports for large components
   const AlertDashboard = dynamic(() => import('@/components/AlertDashboard'), {
     loading: () => <Spinner />,
   });
   ```

2. **Image Optimization**
   ```typescript
   // Use Next.js Image component
   import Image from 'next/image';
   
   export const CoinLogo = ({ src }: { src: string }) => (
     <Image
       src={src}
       width={48}
       height={48}
       alt="Coin logo"
       loading="lazy"
     />
   );
   ```

3. **API Route Optimization**
   ```typescript
   // Use Edge Runtime for performance-critical routes
   export const config = {
     runtime: 'edge',
   };
   ```

### Error Handling

```typescript
// lib/error.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500,
    public details?: any
  ) {
    super(message);
  }
}

// Middleware error handling
export const errorHandler = (
  err: Error,
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Handle unexpected errors
  return res.status(500).json({
    error: {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};
```

## Debugging

### Backend Debugging
```typescript
// Configure debug logging
const debug = require('debug')('app:alerts');

export const processAlert = async (alert: Alert) => {
  debug('Processing alert:', alert.id);
  // ... processing logic
  debug('Alert processed successfully');
};
```

### Frontend Debugging
```typescript
// Use React DevTools
import { useEffect } from 'react';

export const DebugComponent = () => {
  useEffect(() => {
    console.log('Component mounted');
    return () => console.log('Component unmounted');
  }, []);
};
```

## Deployment

### Development Deployment
```bash
# Deploy to development
vercel

# Deploy with environment variables
vercel --env DATABASE_URL=@database-url
```

### Production Deployment
```bash
# Deploy to production
vercel --prod

# Deploy with specific branch
vercel --prod --branch main
```

## Monitoring

### Application Monitoring
```typescript
// Configure Sentry
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Performance Monitoring
```typescript
// Add custom traces
export const CoinList = () => {
  const transaction = Sentry.startTransaction({
    name: 'fetch-coins',
  });

  // ... component logic

  transaction.finish();
};
``` 