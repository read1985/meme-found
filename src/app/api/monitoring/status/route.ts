import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import monitoringService from "@/lib/monitoring/service";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test token data
    const testToken = {
      address: "So11111111111111111111111111111111111111112", // SOL token
      symbol: "SOL",
      name: "Solana",
      decimals: 9,
      supply: {
        total: 1000000000,
        circulating: 1000000000,
      },
      holders: {
        total: 1000000,
        distribution: [
          {
            address: "TestHolder1",
            percentage: 5.5,
          },
        ],
      },
      liquidity: {
        total: 1000000,
        locked: true,
        lockExpiry: new Date(Date.now() + 86400000), // 24 hours from now
      },
      trading: {
        volume24h: 1000000,
        transactions24h: 5000,
        buyTax: 1.5,
        sellTax: 1.5,
      },
      contract: {
        verified: true,
        renounced: true,
        upgradeability: {
          proxy: false,
          admin: null,
        },
      },
    };

    // Test alert processing
    const testResult = await monitoringService.testProcessToken(testToken);

    return NextResponse.json({
      status: "running",
      lastCheck: new Date(),
      testResult,
    });
  } catch (error) {
    console.error("Error checking monitoring status:", error);
    return NextResponse.json(
      { error: "Failed to check monitoring status" },
      { status: 500 }
    );
  }
} 