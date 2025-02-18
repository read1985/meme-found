export interface AlertCondition {
  enabled: boolean;
}

export interface TokenDistributionCondition extends AlertCondition {
  maxTopHolderPercentage: number;
}

export interface LiquidityPoolCondition extends AlertCondition {
  minLiquidity: number;
  requireLocked: boolean;
}

export interface SmartContractCondition extends AlertCondition {
  requireRenounced: boolean;
  requireVerified: boolean;
}

export interface TradingCondition extends AlertCondition {
  minDailyVolume: number;
  maxBuyTax: number;
  maxSellTax: number;
}

export interface AlertConditions {
  tokenDistribution: TokenDistributionCondition;
  liquidityPool: LiquidityPoolCondition;
  smartContract: SmartContractCondition;
  trading: TradingCondition;
}

export interface AlertResult {
  tokenDistribution: {
    triggered: boolean;
    reason: string;
    currentValue?: number;
    threshold?: number;
  };
  liquidityPool: {
    triggered: boolean;
    reason?: string;
    currentValue?: any;
    threshold?: any;
  };
  smartContract: {
    triggered: boolean;
    reason: string;
    currentValue?: any;
    threshold?: any;
  };
  trading: {
    triggered: boolean;
    reason?: string;
    currentValue?: any;
    threshold?: any;
  };
}

export interface Alert {
  id: string;
  name: string;
  userId: string;
  tokenAddress?: string | null;
  conditions: AlertConditions | AlertResult;
  status: 'active' | 'inactive';
  createdAt: Date | string;
  updatedAt: Date | string;
  user?: {
    id: string;
    email: string;
    createdAt: Date;
  };
}

export interface AlertHistory {
  id: string;
  alertId: string;
  tokenAddress: string | null;
  triggeredConditions: AlertResult;
  timestamp: Date;
  alert?: Alert;
} 