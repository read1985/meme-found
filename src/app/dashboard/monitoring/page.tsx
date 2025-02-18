'use client';

import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { AlertHistory } from '@prisma/client';

interface AlertHistoryWithAlert extends AlertHistory {
  alert: {
    name: string;
  };
}

async function fetchAlertHistory(): Promise<AlertHistoryWithAlert[]> {
  const response = await fetch('/api/monitoring/history');
  if (!response.ok) {
    throw new Error('Failed to fetch alert history');
  }
  return response.json();
}

async function triggerTestAlert() {
  const response = await fetch('/api/monitoring/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to trigger test alert');
  }
  return response.json();
}

export default function MonitoringPage() {
  const { data: history, isLoading, error, refetch } = useQuery({
    queryKey: ['alertHistory'],
    queryFn: fetchAlertHistory,
  });

  const testMutation = useMutation({
    mutationFn: triggerTestAlert,
    onSuccess: () => {
      // Refetch history after successful test
      refetch();
    },
  });

  const handleTestClick = () => {
    testMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitoring Dashboard</h1>
          <p className="mt-2 text-gray-600">
            View alert history and monitoring status
          </p>
        </div>
        <button
          onClick={handleTestClick}
          disabled={testMutation.isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {testMutation.isPending ? 'Testing...' : 'Test Alerts'}
        </button>
      </div>

      {testMutation.isError && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error triggering test alert
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {testMutation.error.message}
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-gray-600">Loading history...</div>
      ) : error ? (
        <div className="text-red-500">Error loading history</div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900">Recent Alerts</h2>
            <div className="mt-4">
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Alert Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Token
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Triggered Conditions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {history?.map((entry) => (
                      <tr key={entry.id}>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {entry.alert.name}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {entry.tokenAddress || 'New Token'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {Object.entries(
                              entry.triggeredConditions as Record<
                                string,
                                { triggered: boolean; reason?: string }
                              >
                            )
                              .filter(([_, condition]) => condition.triggered)
                              .map(([name, condition]) => (
                                <div key={name} className="mb-1">
                                  <span className="font-medium">
                                    {name.replace(/([A-Z])/g, ' $1').trim()}:
                                  </span>{' '}
                                  {condition.reason}
                                </div>
                              ))}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {new Date(entry.timestamp).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h3 className="text-lg font-medium text-gray-900">
                Monitoring Status
              </h3>
              <div className="mt-4">
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                  <span className="ml-2 text-sm text-gray-600">
                    Service Active
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Checking new tokens every 10 seconds
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h3 className="text-lg font-medium text-gray-900">
                Active Alerts
              </h3>
              <div className="mt-4">
                <p className="text-3xl font-bold text-gray-900">
                  {history?.length || 0}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Alerts triggered in the last 24 hours
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h3 className="text-lg font-medium text-gray-900">
                API Status
              </h3>
              <div className="mt-4 space-y-2">
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                  <span className="ml-2 text-sm text-gray-600">
                    Solana RPC
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                  <span className="ml-2 text-sm text-gray-600">
                    Raydium API
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                  <span className="ml-2 text-sm text-gray-600">
                    Solscan API
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 