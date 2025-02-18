import { Connection, PublicKey, ParsedAccountData } from '@solana/web3.js';
import type { TokenData } from './types';

interface RaydiumPoolInfo {
  id: string;
  baseMint: string;
  quoteMint: string;
  lpMint: string;
  baseDecimals: number;
  quoteDecimals: number;
  lpDecimals: number;
  version: number;
  programId: string;
  authority: string;
  openOrders: string;
  targetOrders: string;
  baseVault: string;
  quoteVault: string;
  withdrawQueue: string;
  lpVault: string;
  marketVersion: number;
  marketProgramId: string;
  marketId: string;
  marketAuthority: string;
  marketBaseVault: string;
  marketQuoteVault: string;
  marketBids: string;
  marketAsks: string;
  marketEventQueue: string;
  lookupTableAccount: string;
}

interface RaydiumPoolData {
  price: number;
  volume24h: number;
  volume24hQuote: number;
  volume7d: number;
  volume7dQuote: number;
  volume30d: number;
  volume30dQuote: number;
  tvl: number;
  lookupTableAccount: string;
}

interface SolscanTokenInfo {
  success: boolean;
  data: {
    symbol: string;
    name: string;
    decimals: number;
    tokenAuthority: string | null;
    supply: string;
    type: string;
    holders: number;
    volume24h: string;
    volumeAll: string;
    price: number;
  };
}

interface SolscanHolderInfo {
  success: boolean;
  data: {
    address: string;
    amount: string;
    owner: string;
    rank: number;
    share: number;
  }[];
}

interface LockInfo {
  isLocked: boolean;
  expiry?: Date;
  lockedAmount: number;
  totalSupply: number;
}

interface SolscanError {
  code: number;
  message: string;
  details?: any;
}

class SolscanAPIError extends Error {
  code: number;
  details?: any;

  constructor(error: SolscanError) {
    super(error.message);
    this.name = 'SolscanAPIError';
    this.code = error.code;
    this.details = error.details;
  }
}

async function fetchFromSolscan<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = process.env.NEXT_PUBLIC_SOLSCAN_API_KEY;
  if (!apiKey) {
    throw new Error('Solscan API key not configured');
  }

  const baseUrl = 'https://public-api.solscan.io';
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'token': apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorData: SolscanError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          code: response.status,
          message: response.statusText || 'Unknown error',
        };
      }

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        errorData.details = { retryAfter: retryAfter ? parseInt(retryAfter) : 60 };
      }

      throw new SolscanAPIError(errorData);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof SolscanAPIError) {
      throw error;
    }

    // Handle network errors
    throw new SolscanAPIError({
      code: 0,
      message: error instanceof Error ? error.message : 'Network error',
    });
  }
}

async function fetchRaydiumPool(tokenAddress: string): Promise<{
  poolInfo: RaydiumPoolInfo | null;
  poolData: RaydiumPoolData | null;
}> {
  try {
    // Fetch pool info
    const poolInfoResponse = await fetch(
      `${process.env.NEXT_PUBLIC_RAYDIUM_API_URL}/v2/pools?baseMint=${tokenAddress}`
    );
    
    if (!poolInfoResponse.ok) {
      throw new Error(`Failed to fetch pool info: ${poolInfoResponse.statusText}`);
    }

    const poolInfoData = await poolInfoResponse.json();
    const poolInfo = poolInfoData.data?.[0] || null;

    if (!poolInfo) {
      return { poolInfo: null, poolData: null };
    }

    // Fetch pool data
    const poolDataResponse = await fetch(
      `${process.env.NEXT_PUBLIC_RAYDIUM_API_URL}/v2/pools/${poolInfo.id}/stats`
    );

    if (!poolDataResponse.ok) {
      throw new Error(`Failed to fetch pool data: ${poolDataResponse.statusText}`);
    }

    const poolData = await poolDataResponse.json();

    return {
      poolInfo,
      poolData: poolData.data || null
    };
  } catch (error) {
    console.error('Error fetching Raydium pool data:', error);
    return { poolInfo: null, poolData: null };
  }
}

export async function fetchSolanaTokenInfo(
  connection: Connection,
  tokenAddress: string
): Promise<{
  decimals: number;
  supply: number;
  authority: string | null;
}> {
  try {
    const publicKey = new PublicKey(tokenAddress);
    const accountInfo = await connection.getParsedAccountInfo(publicKey);
    
    if (!accountInfo.value || !('parsed' in accountInfo.value.data)) {
      throw new Error('Invalid token account');
    }

    const parsedData = accountInfo.value.data as ParsedAccountData;
    return {
      decimals: parsedData.parsed.info.decimals,
      supply: Number(parsedData.parsed.info.supply),
      authority: parsedData.parsed.info.mintAuthority || null,
    };
  } catch (error) {
    console.error('Error fetching Solana token info:', error);
    throw error;
  }
}

export async function fetchTokenLiquidity(
  tokenAddress: string
): Promise<{
  total: number;
  locked: boolean;
  lockExpiry?: Date;
}> {
  try {
    const { poolInfo, poolData } = await fetchRaydiumPool(tokenAddress);

    if (!poolInfo || !poolData) {
      return {
        total: 0,
        locked: false
      };
    }

    // Check if liquidity is locked by querying token vesting accounts
    // This is a placeholder - implement actual vesting contract check
    const locked = false;
    const lockExpiry = undefined;

    return {
      total: poolData.tvl,
      locked,
      lockExpiry
    };
  } catch (error) {
    console.error('Error fetching token liquidity:', error);
    return {
      total: 0,
      locked: false
    };
  }
}

export async function fetchTradingMetrics(
  tokenAddress: string
): Promise<{
  volume24h: number;
  transactions24h: number;
  buyTax: number;
  sellTax: number;
}> {
  try {
    const { poolData } = await fetchRaydiumPool(tokenAddress);

    if (!poolData) {
      return {
        volume24h: 0,
        transactions24h: 0,
        buyTax: 0,
        sellTax: 0
      };
    }

    // Estimate buy/sell tax by analyzing recent transactions
    // This is a placeholder - implement actual tax calculation
    const { buyTax, sellTax } = await estimateTokenTaxes(tokenAddress);

    return {
      volume24h: poolData.volume24h,
      transactions24h: await fetchDailyTransactions(tokenAddress),
      buyTax,
      sellTax
    };
  } catch (error) {
    console.error('Error fetching trading metrics:', error);
    return {
      volume24h: 0,
      transactions24h: 0,
      buyTax: 0,
      sellTax: 0
    };
  }
}

async function estimateTokenTaxes(
  tokenAddress: string
): Promise<{ buyTax: number; sellTax: number }> {
  try {
    // Analyze recent swap transactions to estimate taxes
    // This would involve:
    // 1. Fetching recent swap transactions
    // 2. Comparing input/output amounts
    // 3. Accounting for slippage and fees
    // 4. Calculating average tax rates
    
    // Placeholder implementation
    return {
      buyTax: 0,
      sellTax: 0
    };
  } catch (error) {
    console.error('Error estimating token taxes:', error);
    return {
      buyTax: 0,
      sellTax: 0
    };
  }
}

export async function fetchDailyTransactions(
  tokenAddress: string
): Promise<number> {
  try {
    const data = await fetchFromSolscan<{ total: number }>(
      `/token/transfers?token=${tokenAddress}&limit=1&offset=0`
    );
    return data.total || 0;
  } catch (error) {
    if (error instanceof SolscanAPIError) {
      if (error.code === 429) {
        // Handle rate limiting
        console.warn(`Rate limited by Solscan API. Retry after ${error.details?.retryAfter || 60} seconds`);
        return 0;
      }
      if (error.code === 404) {
        // Handle token not found
        console.warn(`Token ${tokenAddress} not found on Solscan`);
        return 0;
      }
    }
    console.error('Error counting daily transactions:', error);
    return 0;
  }
}

export async function fetchSolscanTokenInfo(
  apiKey: string,
  tokenAddress: string
): Promise<{
  tokenInfo: SolscanTokenInfo['data'];
  holders: SolscanHolderInfo['data'];
}> {
  try {
    // For now, return mock data
    return {
      tokenInfo: {
        symbol: "TEST",
        name: "Test Token",
        decimals: 9,
        tokenAuthority: null,
        supply: "1000000000",
        type: "verified",
        holders: 1000,
        volume24h: "1000000",
        volumeAll: "5000000",
        price: 1.0,
      },
      holders: [
        {
          address: "TestHolder1",
          amount: "55000000",
          owner: "TestHolder1",
          rank: 1,
          share: 5.5,
        }
      ],
    };
  } catch (error) {
    console.error('Error fetching Solscan info:', error);
    throw error;
  }
}

export async function fetchTokenTaxInfo(
  tokenAddress: string,
  connection: Connection
): Promise<{
  buyTax: number;
  sellTax: number;
}> {
  try {
    // For now, return mock data
    return {
      buyTax: 1.5,
      sellTax: 1.5,
    };
  } catch (error) {
    console.error('Error calculating token taxes:', error);
    return { buyTax: 0, sellTax: 0 };
  }
}

export async function fetchTokenHolders(
  tokenAddress: string
): Promise<{
  total: number;
  distribution: Array<{ address: string; percentage: number }>;
}> {
  try {
    const data = await fetchFromSolscan<{
      total: number;
      data: Array<{ address: string; amount: string; owner: string; }>;
    }>(`/token/holders?token=${tokenAddress}&limit=20&offset=0`);

    // Calculate total supply from all holders
    const totalSupply = data.data.reduce(
      (sum, holder) => sum + parseFloat(holder.amount),
      0
    );

    // Calculate percentage for each holder
    const distribution = data.data.map(holder => ({
      address: holder.owner,
      percentage: (parseFloat(holder.amount) / totalSupply) * 100
    }));

    return {
      total: data.total,
      distribution
    };
  } catch (error) {
    if (error instanceof SolscanAPIError) {
      if (error.code === 429) {
        console.warn(`Rate limited by Solscan API. Retry after ${error.details?.retryAfter || 60} seconds`);
      } else if (error.code === 404) {
        console.warn(`Token ${tokenAddress} not found on Solscan`);
      }
    }
    console.error('Error fetching token holders:', error);
    return {
      total: 0,
      distribution: []
    };
  }
} 