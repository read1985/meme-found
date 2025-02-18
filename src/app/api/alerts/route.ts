import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db/prisma";
import type { NextRequest } from "next/server";

const headers = { 'Content-Type': 'application/json' };

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('Request body:', body);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { name, conditions, tokenAddress } = body;

    // Validate required fields
    if (!name || !conditions) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate conditions structure
    if (typeof conditions !== 'object' || conditions === null) {
      return NextResponse.json({ error: "Invalid conditions format" }, { status: 400 });
    }

    // Create alert
    const alert = await prisma.alert.create({
      data: {
        name,
        conditions,
        tokenAddress: tokenAddress === '' ? null : tokenAddress,
        userId: token.sub,
      },
    });

    return NextResponse.json(alert, { status: 201 });

  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = await prisma.alert.findMany({
      where: {
        userId: token.sub,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
} 