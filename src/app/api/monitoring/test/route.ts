import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import monitoringService from "@/lib/monitoring/service";
import type { NextRequest } from "next/server";
import type { TokenData } from "@/lib/monitoring/types";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test token data that should trigger alerts
    const testToken: TokenData = {
      address: "So11111111111111111111111111111111111111112",
      symbol: "TEST",
      name: "Test Token",
      decimals: 9,
      supply: {
        total: 1000000000,
        circulating: 1000000000,
      },
      holders: {
        total: 1000,
        distribution: [
          {
            address: "TestHolder1",
            percentage: 5.5, // Should trigger maxTopHolderPercentage
          },
        ],
      },
      liquidity: {
        total: 100000, // Should trigger minLiquidity (500,000)
        locked: false, // Should trigger requireLocked
      },
      trading: {
        volume24h: 50000, // Should trigger minDailyVolume (100,000)
        transactions24h: 5000,
        buyTax: 2.5, // Should trigger maxBuyTax (2.0)
        sellTax: 2.5, // Should trigger maxSellTax (2.0)
      },
      contract: {
        verified: false, // Should trigger requireVerified
        renounced: false, // Should trigger requireRenounced
        upgradeability: {
          proxy: false,
          admin: "TestAdmin",
        },
      },
    };

    // Process the test token
    const results = await monitoringService.testProcessToken(testToken);

    // Create alert history entries for triggered alerts
    for (const result of results) {
      if (result.triggered) {
        await monitoringService['handleTriggeredAlert'](result, 'test@example.com');
      }
    }

    return NextResponse.json({
      message: "Test completed",
      results,
    });
  } catch (error) {
    console.error("Error processing test:", error);
    return NextResponse.json(
      { error: "Failed to process test" },
      { status: 500 }
    );
  }
} 