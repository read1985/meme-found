import { PublicKey } from '@solana/web3.js';
import { connectionManager } from '@/lib/solana/connection';
import { convertTokenSupply } from '@/lib/solana/utils';
import type { Alert, AlertCheckResult, TokenData, TokenDistributionResult, SmartContractResult, MonitoringServiceConfig, TokenSupplyInfo, TokenSupplyResponse } from '@/types';
import { sendAlertEmail } from '@/lib/notifications/email';
import prisma from '@/lib/prisma';

interface AlertConditions {
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
}

interface InstructionWithProgramIndex {
  programIdIndex: number;
  parsed?: {
    type: string;
    info?: {
      mint?: string;
    };
  };
}

export class MonitoringService {
  private config: MonitoringServiceConfig;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastCheckedSignature: string | null = null;
  private isProcessing: boolean = false;
  private consecutiveErrors: number = 0;
  private readonly maxConsecutiveErrors = 5;
  private readonly baseRetryDelay = 1000; // 1 second
  private readonly maxRetryDelay = 60000; // 1 minute

  constructor(config: MonitoringServiceConfig) {
    this.config = config;
  }

  async start() {
    if (this.checkInterval) {
      return;
    }

    this.checkInterval = setInterval(
      () => this.monitorNewTokens(),
      this.config.checkIntervalMs
    );

    await this.monitorNewTokens();
  }

  private async monitorNewTokens() {
    // Prevent concurrent processing
    if (this.isProcessing) {
      console.log('Already processing, skipping this iteration');
      return;
    }

    this.isProcessing = true;

    try {
      const tokenProgramId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
      
      // Get recent signatures for token program using connection manager with high priority
      const signatures = await connectionManager.withRetry(
        async (connection) => {
          return connection.getSignaturesForAddress(
            tokenProgramId,
            { limit: 10 }
          );
        },
        {
          priority: 5, // Higher priority for main monitoring task
          maxRetries: 3,
          retryableErrors: ['429', 'rate limit', 'timeout', 'network error']
        }
      );

      if (signatures.length === 0) {
        await this.delay(5000);
        return;
      }

      // Update last checked signature
      if (!this.lastCheckedSignature) {
        this.lastCheckedSignature = signatures[0].signature;
        await this.delay(5000);
        return;
      }

      // Find new transactions since last check
      const newSignatures = signatures
        .map(sig => sig.signature)
        .slice(0, signatures.findIndex(sig => sig.signature === this.lastCheckedSignature));

      // Update last checked signature
      this.lastCheckedSignature = signatures[0].signature;

      // Process new transactions with rate limiting
      for (const signature of newSignatures) {
        try {
          await this.delay(100); // Add small delay between transactions
          
          const tx = await connectionManager.withRetry(
            async (connection) => {
              return connection.getParsedTransaction(signature, {
                maxSupportedTransactionVersion: 0
              });
            },
            {
              priority: 3, // Medium priority for transaction fetching
              maxRetries: 2
            }
          );

          if (!tx?.meta) continue;

          // Look for token creation
          const createTokenIx = tx.transaction.message.instructions.find(ix => {
            if (!('programIdIndex' in ix)) return false;
            const instruction = ix as InstructionWithProgramIndex;
            
            const program = tx.transaction.message.accountKeys[instruction.programIdIndex];
            if (!program) return false;

            const programId = new PublicKey(program.toString());
            return programId.equals(tokenProgramId) &&
                   'parsed' in instruction &&
                   instruction.parsed?.type === 'initializeMint';
          });

          if (createTokenIx && 'parsed' in createTokenIx && createTokenIx.parsed?.info?.mint) {
            await this.checkNewToken(createTokenIx.parsed.info.mint);
          }

          // Reset consecutive errors on successful processing
          this.consecutiveErrors = 0;
        } catch (txError) {
          console.error('Error processing transaction:', txError);
          this.consecutiveErrors++;
          
          if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
            console.warn(`Too many consecutive errors (${this.consecutiveErrors}), pausing monitoring...`);
            await this.delay(this.maxRetryDelay);
          }
          
          continue;
        }
      }
    } catch (monitorError) {
      console.error('Error monitoring new tokens:', monitorError);
      this.consecutiveErrors++;
      
      const isRateLimit = monitorError instanceof Error && 
        monitorError.message.toLowerCase().includes('429');
      
      const retryDelay = isRateLimit
        ? Math.min(this.baseRetryDelay * Math.pow(2, this.consecutiveErrors), this.maxRetryDelay)
        : this.baseRetryDelay;
      
      await this.delay(retryDelay);
    } finally {
      this.isProcessing = false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async checkNewToken(tokenAddress: string) {
    try {
      // Get token data using connection manager
      const rawTokenData = await connectionManager.withRetry(
        async (connection) => {
          const mintInfo = await connection.getAccountInfo(new PublicKey(tokenAddress));
          const supply = await connection.getTokenSupply(new PublicKey(tokenAddress));
          
          const supplyResponse: TokenSupplyResponse = {
            context: {
              slot: supply.context.slot,
            },
            value: {
              amount: supply.value.amount,
              decimals: supply.value.decimals,
              uiAmount: supply.value.uiAmount,
              uiAmountString: supply.value.uiAmountString,
            },
          };
          
          const supplyInfo = convertTokenSupply(supplyResponse);
          
          return { 
            mintInfo, 
            supply: supplyInfo
          };
        },
        {
          priority: 4,
          maxRetries: 3
        }
      );

      if (!rawTokenData.mintInfo || !rawTokenData.supply) {
        console.log('Invalid token data for:', tokenAddress);
        return;
      }

      const tokenData: TokenData = {
        address: tokenAddress,
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: rawTokenData.supply.decimals,
        supply: {
          total: rawTokenData.supply.total,
          circulating: rawTokenData.supply.circulating,
          uiAmount: rawTokenData.supply.uiAmount,
          decimals: rawTokenData.supply.decimals,
          uiAmountString: rawTokenData.supply.uiAmountString
        },
        holders: {
          total: 0,
          distribution: []
        },
        liquidity: {
          total: 0,
          locked: false
        },
        trading: {
          volume24h: 0,
          transactions24h: 0,
          buyTax: 0,
          sellTax: 0
        },
        contract: {
          verified: false,
          renounced: rawTokenData.mintInfo.data[0] === 0,
          upgradeability: {
            proxy: false,
            admin: ''
          }
        }
      };

      // Get alerts monitoring all tokens
      const alerts = await prisma.alert.findMany({
        where: {
          status: 'active',
          tokenAddress: null, // Alerts monitoring all tokens
        },
        select: {
          id: true,
          name: true,
          userId: true,
          tokenAddress: true,
          conditions: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              createdAt: true,
            }
          }
        }
      });

      // Check each alert
      for (const alert of alerts) {
        const alertWithTypes: Alert = {
          ...alert,
          tokenAddress, // Use the new token's address
          updatedAt: new Date().toISOString(),
          createdAt: alert.createdAt.toISOString(),
          status: alert.status as 'active' | 'inactive',
          conditions: {
            tokenDistribution: {
              enabled: true,
              maxTopHolderPercentage: (alert.conditions as any).tokenDistribution?.maxTopHolderPercentage || 10
            },
            liquidityPool: {
              enabled: true,
              minLiquidity: (alert.conditions as any).liquidityPool?.minLiquidity || 1000,
              requireLocked: (alert.conditions as any).liquidityPool?.requireLocked || false
            },
            smartContract: {
              enabled: true,
              requireVerified: (alert.conditions as any).smartContract?.requireVerified || false,
              requireRenounced: (alert.conditions as any).smartContract?.requireRenounced || true
            },
            trading: {
              enabled: true,
              minDailyVolume: (alert.conditions as any).trading?.minDailyVolume || 1000,
              maxBuyTax: (alert.conditions as any).trading?.maxBuyTax || 10,
              maxSellTax: (alert.conditions as any).trading?.maxSellTax || 10
            }
          }
        };

        const result = await this.checkAlert(alertWithTypes);

        if (result.triggered && alert.user?.email) {
          await this.handleTriggeredAlert(result, alert.user.email);
        }
      }
    } catch (error) {
      console.error('Error checking new token:', error);
    }
  }

  private async handleTriggeredAlert(result: AlertCheckResult, userEmail: string) {
    try {
      // Send email notification
      await sendAlertEmail(userEmail, result);

      // Convert conditions to JSON-compatible format
      const jsonConditions = JSON.parse(JSON.stringify({
        tokenDistribution: {
          triggered: result.conditions.tokenDistribution.triggered,
          reason: result.conditions.tokenDistribution.reason,
          currentValue: result.conditions.tokenDistribution.currentValue,
          threshold: result.conditions.tokenDistribution.threshold,
        },
        liquidityPool: {
          triggered: result.conditions.liquidityPool.triggered,
          reason: result.conditions.liquidityPool.reason,
          currentValue: result.conditions.liquidityPool.currentValue,
          threshold: result.conditions.liquidityPool.threshold,
        },
        smartContract: {
          triggered: result.conditions.smartContract.triggered,
          reason: result.conditions.smartContract.reason,
          currentValue: result.conditions.smartContract.currentValue,
          threshold: result.conditions.smartContract.threshold,
        },
        trading: {
          triggered: result.conditions.trading.triggered,
          reason: result.conditions.trading.reason,
          currentValue: result.conditions.trading.currentValue,
          threshold: result.conditions.trading.threshold,
        },
      }));

      // Log the alert
      await prisma.alertHistory.create({
        data: {
          alertId: result.alert.id,
          tokenAddress: result.alert.tokenAddress || null,
          triggeredConditions: jsonConditions,
          timestamp: result.timestamp,
        },
      });

      console.log('Alert triggered:', {
        alertId: result.alert.id,
        conditions: result.conditions,
        timestamp: result.timestamp,
      });
    } catch (error) {
      console.error('Error handling triggered alert:', error);
    }
  }

  async stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkAlerts(): Promise<void> {
    // Fetch all active alerts with user data
    const alerts = await prisma.alert.findMany({
      where: { status: 'active' },
      include: {
        user: true,
      },
    });

    for (const alert of alerts) {
      try {
        const result = await this.checkAlert(alert);
        if (result.triggered) {
          await this.handleTriggeredAlert(result, alert.user.email);
        }
      } catch (error) {
        console.error(`Error checking alert ${alert.id}:`, error);
      }
    }
  }

  private async checkAlert(alert: Alert): Promise<AlertCheckResult> {
    try {
      let tokenData: TokenData | null = null;

      if (alert.tokenAddress) {
        const mintInfo = await connectionManager.withRetry(async (connection) => {
          return connection.getAccountInfo(new PublicKey(alert.tokenAddress!));
        });

        const tokenPubkey = new PublicKey(alert.tokenAddress!);
        
        // Get token supply using connection manager
        const supplyInfo = await connectionManager.withRetry(async (connection) => {
          const supply = await connection.getTokenSupply(tokenPubkey);
          const supplyResponse: TokenSupplyResponse = {
            context: {
              slot: supply.context.slot,
            },
            value: {
              amount: supply.value.amount,
              decimals: supply.value.decimals,
              uiAmount: supply.value.uiAmount,
              ...(supply.value.uiAmountString && {
                uiAmountString: supply.value.uiAmountString
              })
            }
          };
          return convertTokenSupply(supplyResponse);
        });

        const tokenMetadata = await this.fetchTokenMetadata(alert.tokenAddress!);
          
        if (mintInfo && supplyInfo) {
          tokenData = {
            address: alert.tokenAddress!,
            symbol: tokenMetadata?.symbol || 'UNKNOWN',
            name: tokenMetadata?.name || 'Unknown Token',
            decimals: mintInfo.data.length > 0 ? mintInfo.data[44] : 9,
            supply: {
              total: supplyInfo.total,
              circulating: supplyInfo.circulating
            },
            holders: {
              total: 0,
              distribution: []
            },
            liquidity: {
              total: 0,
              locked: false
            },
            trading: {
              volume24h: 0,
              transactions24h: 0,
              buyTax: 0,
              sellTax: 0
            },
            contract: {
              verified: false,
              renounced: mintInfo.data[0] === 0,
              upgradeability: {
                proxy: false,
                admin: ''
              }
            }
          };
        }
      }

      // Use mock data for testing if no token data
      if (!tokenData) {
        tokenData = {
          address: "So11111111111111111111111111111111111111112",
          symbol: "TEST",
          name: "Test Token",
          decimals: 9,
          supply: {
            total: 1000000000,
            circulating: 1000000000,
            uiAmount: 1000000000,
            decimals: 9,
            uiAmountString: "1000000000"
          },
          holders: {
            total: 1000,
            distribution: [{ address: "TestHolder1", percentage: 5.5 }]
          },
          liquidity: {
            total: 100000,
            locked: false
          },
          trading: {
            volume24h: 50000,
            transactions24h: 5000,
            buyTax: 2.5,
            sellTax: 2.5
          },
          contract: {
            verified: false,
            renounced: true,
            upgradeability: {
              proxy: false,
              admin: ''
            }
          }
        };
      }

      const conditions: AlertConditions = {
        tokenDistribution: await this.checkTokenDistribution(tokenData.address, alert.conditions.tokenDistribution.maxTopHolderPercentage),
        liquidityPool: {
          triggered: false,
          reason: 'Liquidity check not implemented'
        },
        smartContract: await this.checkSmartContract(tokenData.address),
        trading: {
          triggered: false,
          reason: 'Trading check not implemented'
        }
      };

      return {
        alert,
        triggered: Object.values(conditions).some(c => c.triggered),
        conditions,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error checking alert:', error);
      const emptyConditions: AlertConditions = {
        tokenDistribution: { triggered: false, reason: 'Error checking conditions' },
        liquidityPool: { triggered: false, reason: 'Error checking conditions' },
        smartContract: { triggered: false, reason: 'Error checking conditions' },
        trading: { triggered: false, reason: 'Error checking conditions' }
      };

      return {
        alert,
        triggered: false,
        conditions: emptyConditions,
        timestamp: new Date()
      };
    }
  }

  private async fetchTokenMetadata(tokenAddress: string) {
    try {
      // This is a placeholder - implement actual token metadata fetching
      // Could use Solana token list registry or other metadata sources
      return {
        symbol: 'UNKNOWN',
        name: 'Unknown Token'
      };
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return null;
    }
  }

  private async checkTokenDistribution(tokenAddress: string, maxPercentage: number): Promise<TokenDistributionResult> {
    try {
      const tokenPubkey = new PublicKey(tokenAddress);
      
      // Get token largest accounts using connection manager
      const largestAccounts = await connectionManager.withRetry(async (connection) => {
        return connection.getTokenLargestAccounts(tokenPubkey);
      });

      if (!largestAccounts?.value || largestAccounts.value.length === 0) {
        return {
          triggered: false,
          reason: 'No token accounts found'
        };
      }

      // Get token supply using connection manager
      const supplyInfo = await connectionManager.withRetry(async (connection) => {
        const supply = await connection.getTokenSupply(tokenPubkey);
        const supplyResponse: TokenSupplyResponse = {
          context: {
            slot: supply.context.slot,
          },
          value: {
            amount: supply.value.amount,
            decimals: supply.value.decimals,
            uiAmount: supply.value.uiAmount,
            ...(supply.value.uiAmountString && {
              uiAmountString: supply.value.uiAmountString
            })
          }
        };
        return convertTokenSupply(supplyResponse);
      });

      if (!supplyInfo.uiAmount) {
        return {
          triggered: false,
          reason: 'Could not fetch token supply'
        };
      }

      // Calculate percentage held by largest holder
      const largestHolderAmount = largestAccounts.value[0].uiAmount || 0;
      const percentageHeld = (largestHolderAmount / supplyInfo.uiAmount) * 100;

      return {
        triggered: percentageHeld > maxPercentage,
        reason: `Top holder owns ${percentageHeld.toFixed(1)}% of supply (max: ${maxPercentage}%)`,
        currentValue: percentageHeld,
        threshold: maxPercentage
      };
    } catch (error) {
      console.error('Error checking token distribution:', error);
      return {
        triggered: false,
        reason: 'Error checking token distribution'
      };
    }
  }

  private async checkSmartContract(tokenAddress: string): Promise<SmartContractResult> {
    try {
      const tokenPubkey = new PublicKey(tokenAddress);
      
      // Get mint info using connection manager
      const mintInfo = await connectionManager.withRetry(async (connection) => {
        return connection.getAccountInfo(tokenPubkey);
      });

      if (!mintInfo?.data) {
        return {
          triggered: false,
          reason: 'Could not fetch mint info'
        };
      }

      // Check if mint authority is disabled
      const mintAuthorityEnabled = mintInfo.data[0] !== 0;
      
      return {
        triggered: mintAuthorityEnabled,
        reason: mintAuthorityEnabled ? 'Mint authority is still enabled' : 'Mint authority is disabled',
        currentValue: mintAuthorityEnabled,
        threshold: false
      };
    } catch (error) {
      console.error('Error checking smart contract:', error);
      return {
        triggered: false,
        reason: 'Error checking smart contract'
      };
    }
  }

  async testProcessToken(tokenData: TokenData): Promise<AlertCheckResult[]> {
    // Fetch all active alerts
    const alerts = await prisma.alert.findMany({
      where: { status: 'active' },
      include: {
        user: true,
      },
    });

    const results: AlertCheckResult[] = [];

    // Test each alert against the token data
    for (const alert of alerts) {
      try {
        const result = await this.checkAlert({
          ...alert,
          tokenAddress: tokenData.address,
        });
        
        if (result.triggered) {
          // Don't actually send emails or create history entries during test
          console.log('Alert would be triggered:', {
            alertId: result.alert.id,
            conditions: result.conditions,
            timestamp: result.timestamp,
          });
        }
        
        results.push(result);
      } catch (error) {
        console.error(`Error testing alert ${alert.id}:`, error);
      }
    }

    return results;
  }
}

// Initialize the monitoring service
const monitoringService = new MonitoringService({
  checkIntervalMs: 60000, // Check every minute
  rpcEndpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
  raydiumApiEndpoint: process.env.NEXT_PUBLIC_RAYDIUM_API_URL!,
  solscanApiKey: process.env.NEXT_PUBLIC_SOLSCAN_API_KEY!
});

// Export the singleton instance
export default monitoringService; 