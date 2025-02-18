import { Connection, ConnectionConfig, Commitment } from '@solana/web3.js';

interface RPCEndpoint {
  url: string;
  weight: number;
  currentErrors: number;
  lastErrorTime?: number;
  rateLimit: {
    maxRequests: number;
    windowMs: number;
    requestTimestamps: number[]; // Track request timestamps for sliding window
    priorityQueue: PriorityRequest[];
  };
}

interface PriorityRequest {
  priority: number;
  timestamp: number;
  retryCount: number;
}

export class ConnectionManager {
  private endpoints: RPCEndpoint[];
  private currentEndpointIndex: number;
  private connection: Connection | null;
  private config: ConnectionConfig;
  private backoffStrategy: BackoffStrategy;

  constructor(
    endpoints: { url: string; weight: number; rateLimit: { maxRequests: number; windowMs: number } }[],
    config: Partial<ConnectionConfig> = {}
  ) {
    this.endpoints = endpoints.map(endpoint => ({
      ...endpoint,
      currentErrors: 0,
      rateLimit: {
        ...endpoint.rateLimit,
        requestTimestamps: [],
        priorityQueue: [],
      },
    }));
    this.currentEndpointIndex = 0;
    this.connection = null;
    this.config = {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
      ...config,
    };
    this.backoffStrategy = new ExponentialBackoff();
  }

  private cleanupOldRequests(endpoint: RPCEndpoint) {
    const now = Date.now();
    const windowMs = endpoint.rateLimit.windowMs;
    
    // Remove timestamps older than the window
    endpoint.rateLimit.requestTimestamps = endpoint.rateLimit.requestTimestamps.filter(
      timestamp => now - timestamp < windowMs
    );
    
    // Clean up old priority queue entries
    endpoint.rateLimit.priorityQueue = endpoint.rateLimit.priorityQueue.filter(
      request => now - request.timestamp < windowMs
    );
  }

  private canUseEndpoint(endpoint: RPCEndpoint, priority: number = 1): boolean {
    const now = Date.now();
    this.cleanupOldRequests(endpoint);
    
    const currentRequests = endpoint.rateLimit.requestTimestamps.length;
    
    // Check if within rate limits
    if (currentRequests >= endpoint.rateLimit.maxRequests) {
      // If high priority request, try to preempt lower priority ones
      if (priority > 1) {
        const lowestPriorityRequest = endpoint.rateLimit.priorityQueue
          .sort((a, b) => a.priority - b.priority)[0];
        
        if (lowestPriorityRequest && lowestPriorityRequest.priority < priority) {
          return true; // Allow high priority request to proceed
        }
      }
      return false;
    }
    
    return true;
  }

  private selectBestEndpoint(priority: number = 1): number {
    this.endpoints.forEach(endpoint => this.cleanupOldRequests(endpoint));

    // Sort endpoints by multiple criteria
    const sortedIndices = this.endpoints
      .map((endpoint, index) => ({ endpoint, index }))
      .sort((a, b) => {
        // First, check rate limits
        const aCanUse = this.canUseEndpoint(a.endpoint, priority);
        const bCanUse = this.canUseEndpoint(b.endpoint, priority);
        if (aCanUse !== bCanUse) return aCanUse ? -1 : 1;

        // Then consider error rate
        const aErrorRate = a.endpoint.currentErrors / Math.max(1, a.endpoint.rateLimit.requestTimestamps.length);
        const bErrorRate = b.endpoint.currentErrors / Math.max(1, b.endpoint.rateLimit.requestTimestamps.length);
        if (Math.abs(aErrorRate - bErrorRate) > 0.1) return aErrorRate - bErrorRate;

        // Finally, consider weight
        return b.endpoint.weight - a.endpoint.weight;
      });

    return sortedIndices[0].index;
  }

  private async createConnection(priority: number = 1): Promise<Connection> {
    const index = this.selectBestEndpoint(priority);
    const endpoint = this.endpoints[index];
    
    this.currentEndpointIndex = index;
    
    // Record request
    const now = Date.now();
    endpoint.rateLimit.requestTimestamps.push(now);
    endpoint.rateLimit.priorityQueue.push({
      priority,
      timestamp: now,
      retryCount: 0
    });

    return new Connection(endpoint.url, this.config);
  }

  async getConnection(priority: number = 1): Promise<Connection> {
    if (!this.connection) {
      this.connection = await this.createConnection(priority);
    }

    return this.connection;
  }

  async handleConnectionError(error: any): Promise<Connection> {
    console.error('Connection error:', error);

    const currentEndpoint = this.endpoints[this.currentEndpointIndex];
    currentEndpoint.currentErrors++;
    currentEndpoint.lastErrorTime = Date.now();

    // Reset connection and create a new one with the next best endpoint
    this.connection = null;
    return this.getConnection();
  }

  // Enhanced retry logic with priority
  async withRetry<T>(
    operation: (connection: Connection) => Promise<T>,
    options: {
      priority?: number;
      maxRetries?: number;
      retryableErrors?: string[];
    } = {}
  ): Promise<T> {
    const {
      priority = 1,
      maxRetries = 3,
      retryableErrors = ['429', 'rate limit', 'timeout']
    } = options;

    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const connection = await this.getConnection(priority);
        return await operation(connection);
      } catch (error: any) {
        lastError = error;
        
        const isRetryableError = retryableErrors.some(e => 
          error.message?.toLowerCase().includes(e.toLowerCase())
        );
        
        if (isRetryableError) {
          const delay = this.backoffStrategy.getDelay(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Increase priority for retry
          const newPriority = Math.min(priority + 1, 10);
          this.connection = null;
          continue;
        }
        
        throw error; // Non-retryable error
      }
    }

    throw lastError;
  }
}

class ExponentialBackoff {
  private readonly baseDelay: number = 1000;
  private readonly maxDelay: number = 30000;
  private readonly jitterFactor: number = 0.1;

  getDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      this.baseDelay * Math.pow(2, attempt),
      this.maxDelay
    );
    
    const jitter = exponentialDelay * this.jitterFactor * Math.random();
    return exponentialDelay + jitter;
  }
}

// Create singleton instance with default configuration
const defaultEndpoints = [
  {
    url: process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
    weight: 10,
    rateLimit: {
      maxRequests: 50,
      windowMs: 10000, // 10 seconds
    },
  },
  {
    url: 'https://api.mainnet-beta.solana.com',
    weight: 5,
    rateLimit: {
      maxRequests: 25,
      windowMs: 10000,
    },
  },
  {
    url: 'https://solana-api.projectserum.com',
    weight: 3,
    rateLimit: {
      maxRequests: 20,
      windowMs: 10000,
    },
  }
];

export const connectionManager = new ConnectionManager(defaultEndpoints);

// Example usage:
// const result = await connectionManager.withRetry(async (connection) => {
//   return connection.getAccountInfo(publicKey);
// }); 