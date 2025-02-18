import { NextResponse } from "next/server";

// Mock data for now - we'll integrate with Raydium API later
const MOCK_COINS = [
  {
    id: "1",
    name: "MOCK/SOL",
    symbol: "MOCK",
    price: 0.542,
    liquidity: "125,000 SOL",
    age: "2 hours",
  },
  {
    id: "2",
    name: "TEST/USDC",
    symbol: "TEST",
    price: 0.123,
    liquidity: "250,000 USDC",
    age: "5 hours",
  },
  {
    id: "3",
    name: "NEW/SOL",
    symbol: "NEW",
    price: 1.234,
    liquidity: "75,000 SOL",
    age: "1 hour",
  },
];

export async function GET() {
  try {
    // TODO: Integrate with Raydium API to fetch real data
    // For now, return mock data
    return NextResponse.json(MOCK_COINS);
  } catch (error) {
    console.error("Error fetching coins:", error);
    return NextResponse.json(
      { error: "Failed to fetch coins" },
      { status: 500 }
    );
  }
} 