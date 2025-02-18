import type { AlertCheckResult } from '@/lib/monitoring/types';

function formatAlertMessage(result: AlertCheckResult): string {
  const { alert, conditions, timestamp } = result;
  
  const triggeredConditions = Object.entries(conditions)
    .filter(([_, condition]) => condition.triggered)
    .map(([name, condition]) => {
      const formattedName = name.replace(/([A-Z])/g, ' $1').trim();
      return `- ${formattedName}: ${condition.reason}`;
    })
    .join('\n');

  return `
Alert Triggered: ${alert.name}
Time: ${new Date(timestamp).toLocaleString()}
${alert.tokenAddress ? `Token: ${alert.tokenAddress}` : 'Monitoring: All new tokens'}

Triggered Conditions:
${triggeredConditions}
  `.trim();
}

export async function sendAlertEmail(
  to: string,
  result: AlertCheckResult
): Promise<void> {
  // Log the alert for now
  console.log('\n=== Alert Notification ===');
  console.log(`Would send to: ${to}`);
  console.log(formatAlertMessage(result));
  console.log('========================\n');
} 