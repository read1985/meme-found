import type { Alert } from '@/types/alert';

export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  supply: {
    total: number;
    circulating: number;
  };
  holders: {
    total: number;
    distribution: {
      address: string;
      percentage: number;
    }[];
  };
  liquidity: {
    total: number;
    locked: boolean;
    lockExpiry?: Date;
  };
  trading: {
    volume24h: number;
    transactions24h: number;
    buyTax: number;
    sellTax: number;
  };
  contract: {
    verified: boolean;
    renounced: boolean;
    upgradeability: {
      proxy: boolean;
      admin: string | null;
    };
  };
}

export interface AlertCheckResult {
  alert: Alert;
  triggered: boolean;
  conditions: {
    [K in keyof Alert['conditions']]: {
      triggered: boolean;
      reason?: string;
      currentValue?: any;
      threshold?: any;
    };
  };
  timestamp: Date;
}

export interface MonitoringServiceConfig {
  checkInterval: number; // milliseconds
  rpcEndpoint: string;
  raydiumApiEndpoint: string;
  solscanApiKey: string;
} 