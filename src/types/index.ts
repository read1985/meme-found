// import { PublicKey } from '@solana/web3.js';

export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  supply: {
    total: number;
    circulating: number;
    uiAmount: number;
    decimals: number;
    uiAmountString: string;
  };
  holders: {
    total: number;
    distribution: Array<{ address: string; percentage: number }>;
  };
  liquidity: {
    total: number;
    locked: boolean;
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
      admin: string;
    };
  };
}

export interface TokenDistributionCondition {
  enabled: boolean;
  maxTopHolderPercentage: number;
}

export interface LiquidityPoolCondition {
  enabled: boolean;
  minLiquidity: number;
  requireLocked: boolean;
}

export interface SmartContractCondition {
  enabled: boolean;
  requireVerified: boolean;
  requireRenounced: boolean;
}

export interface TradingCondition {
  enabled: boolean;
  minDailyVolume: number;
  maxBuyTax: number;
  maxSellTax: number;
}

export interface Alert {
  id: string;
  name: string;
  userId: string;
  status: 'active' | 'inactive';
  tokenAddress?: string;
  conditions: {
    tokenDistribution: TokenDistributionCondition;
    liquidityPool: LiquidityPoolCondition;
    smartContract: SmartContractCondition;
    trading: TradingCondition;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TokenDistributionResult {
  triggered: boolean;
  reason: string;
  currentValue?: number;
  threshold?: number;
}

export interface SmartContractResult {
  triggered: boolean;
  reason: string;
  currentValue?: unknown;
  threshold?: unknown;
}

export interface AlertCheckResult {
  alert: Alert;
  triggered: boolean;
  conditions: {
    tokenDistribution: TokenDistributionResult;
    liquidityPool: {
      triggered: boolean;
      reason?: string;
      currentValue?: unknown;
      threshold?: unknown;
    };
    smartContract: SmartContractResult;
    trading: {
      triggered: boolean;
      reason?: string;
      currentValue?: unknown;
      threshold?: unknown;
    };
  };
  timestamp: Date;
}

export interface TokenSupplyResponse {
  context: {
    slot: number;
  };
  value: {
    amount: string;
    decimals: number;
    uiAmount: number | null;
    uiAmountString?: string;
    circulatingSupply?: number;
  };
}

export interface TokenSupplyInfo {
  total: number;
  circulating: number;
  uiAmount: number;
  decimals: number;
  uiAmountString: string;
}

export interface MonitoringServiceConfig {
  checkIntervalMs: number;
  rpcEndpoint: string;
  raydiumApiEndpoint: string;
  solscanApiKey: string;
  maxAlertsPerUser?: number;
  mockMode?: boolean;
} 