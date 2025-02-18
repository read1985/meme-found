import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db/prisma";
import type { NextRequest } from "next/server";
import { RateLimiter } from "@/lib/utils/rate-limiter";

// Create a rate limiter instance for this endpoint
const rateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute
});

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const clientIp = getClientIp(req);
    const userId = token.sub;
    const rateLimitKey = `history:${userId}:${clientIp}`;
    
    const { success, timeToReset, remaining } = await rateLimiter.check(rateLimitKey);
    
    if (!success) {
      return NextResponse.json(
        { 
          error: "Too many requests",
          timeToReset,
          remaining
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(timeToReset / 1000).toString(),
            'X-RateLimit-Limit': rateLimiter.maxRequests.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(Date.now() + timeToReset).toString()
          }
        }
      );
    }

    // Get alert history for the user's alerts from the last 24 hours
    const history = await prisma.alertHistory.findMany({
      where: {
        alert: {
          userId: token.sub,
        },
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: {
        alert: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    const response = NextResponse.json(history);
    
    // Add rate limit headers to successful response
    response.headers.set('X-RateLimit-Limit', rateLimiter.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(Date.now() + timeToReset).toString());
    
    return response;
  } catch (error) {
    console.error("Error fetching alert history:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert history" },
      { status: 500 }
    );
  }
} 