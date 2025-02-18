/**
 * Simple script to test rate limiting in practice
 * Run with: pnpm tsx src/lib/utils/__tests__/test-rate-limit.ts
 */

async function testRateLimit() {
  const endpoint = 'http://localhost:3000/api/monitoring/history';
  const requests = 35; // Test with 35 requests
  const delayBetweenRequests = 50; // 50ms between requests
  let tooManyRequests = 0;
  let successful = 0;
  let errors = 0;

  console.log(`Making ${requests} requests to test rate limiting...`);
  console.log(`Rate limit should be 30 requests per minute\n`);

  for (let i = 0; i < requests; i++) {
    try {
      const response = await fetch(endpoint);
      const status = response.status;
      
      // Get rate limit headers
      const remaining = response.headers.get('x-ratelimit-remaining');
      const limit = response.headers.get('x-ratelimit-limit');
      const reset = response.headers.get('x-ratelimit-reset');
      
      if (status === 429) {
        tooManyRequests++;
        const retryAfter = response.headers.get('retry-after');
        console.log(`Request ${i + 1}: Rate limited (429) - Retry after ${retryAfter}s`);
      } else if (status === 200) {
        successful++;
        console.log(`Request ${i + 1}: Success (${remaining}/${limit} remaining)`);
      } else {
        errors++;
        console.log(`Request ${i + 1}: Unexpected status ${status}`);
      }

      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
    } catch (error: any) {
      errors++;
      console.error(`Request ${i + 1} failed:`, error?.message || 'Unknown error');
    }
  }

  console.log('\nTest Results:');
  console.log('=============');
  console.log(`Total requests: ${requests}`);
  console.log(`Successful: ${successful}`);
  console.log(`Rate limited: ${tooManyRequests}`);
  console.log(`Errors: ${errors}`);
  
  // Validate rate limiting behavior
  if (successful <= 30 && tooManyRequests > 0) {
    console.log('\n✅ Rate limiting is working as expected');
  } else {
    console.log('\n❌ Rate limiting may not be working correctly');
    console.log('Expected: ~30 successful requests and some rate limits');
    console.log(`Got: ${successful} successful, ${tooManyRequests} rate limited`);
  }
}

testRateLimit().catch(console.error); 