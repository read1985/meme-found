import { RpcResponseAndContext, TokenAmount } from '@solana/web3.js';
import type { TokenSupplyInfo, TokenSupplyResponse } from '@/types';

export function convertTokenSupply(response: TokenSupplyResponse): TokenSupplyInfo {
  // Handle cases where amount is a string or bigint
  const rawAmount = response.value.amount;
  const amount = typeof rawAmount === 'string' ? 
    Number(rawAmount) : 
    typeof rawAmount === 'bigint' ? 
      Number(rawAmount) : rawAmount;

  // Handle cases where uiAmount is null or undefined
  const uiAmountString = response.value.uiAmountString;
  const uiAmount = response.value.uiAmount ?? 
    (uiAmountString ? Number(uiAmountString) : 
    amount / Math.pow(10, response.value.decimals));

  // Calculate circulating supply (if available)
  const circulatingAmount = response.value.circulatingSupply ?? amount;
  
  return {
    total: amount,
    circulating: circulatingAmount,
    uiAmount,
    decimals: response.value.decimals,
    uiAmountString: uiAmountString || uiAmount.toString()
  };
}

// Helper function to validate token supply response
export function isValidTokenSupplyResponse(response: any): response is TokenSupplyResponse {
  return (
    response &&
    response.value &&
    (typeof response.value.amount === 'string' || 
     typeof response.value.amount === 'number' || 
     typeof response.value.amount === 'bigint') &&
    typeof response.value.decimals === 'number'
  );
}

// Helper function to format token amounts for display
export function formatTokenAmount(
  amount: number,
  decimals: number,
  options: { 
    maxDecimals?: number;
    minDecimals?: number;
    notation?: 'standard' | 'compact';
  } = {}
): string {
  const { 
    maxDecimals = decimals,
    minDecimals = 0,
    notation = 'standard'
  } = options;

  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
    notation: notation as any,
  });

  const value = amount / Math.pow(10, decimals);
  return formatter.format(value);
} 