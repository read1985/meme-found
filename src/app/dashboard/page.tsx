'use client';

import React from "react";
// Remove unused useSession import
// import { useSession } from "next-auth/react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { Coin } from "@/types/coin";
import type { Alert } from "@/types/alert";

async function fetchCoins(): Promise<Coin[]> {
  const response = await fetch('/api/coins');
  if (!response.ok) {
    throw new Error('Failed to fetch coins');
  }
  return response.json();
}

async function fetchAlerts(): Promise<Alert[]> {
  const response = await fetch('/api/alerts');
  if (!response.ok) {
    throw new Error('Failed to fetch alerts');
  }
  return response.json();
}

export default function DashboardPage() {
  // Remove unused session variable
  // const { data: session } = useSession();
  const { data: coins, isLoading: isLoadingCoins, error: coinsError } = useQuery({
    queryKey: ['coins'],
    queryFn: fetchCoins,
  });

  const { data: alerts, isLoading: isLoadingAlerts, error: alertsError } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
  });

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Monitor new coins and manage your alerts
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Coins Section */}
        <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Recent Coins
          </h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Liquidity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Age
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoadingCoins ? (
                  <tr>
                    <td className="whitespace-nowrap px-6 py-4" colSpan={4}>
                      <div className="text-sm text-gray-900">Loading...</div>
                    </td>
                  </tr>
                ) : coinsError ? (
                  <tr>
                    <td className="whitespace-nowrap px-6 py-4 text-red-500" colSpan={4}>
                      Error loading coins
                    </td>
                  </tr>
                ) : coins?.length === 0 ? (
                  <tr>
                    <td className="whitespace-nowrap px-6 py-4" colSpan={4}>
                      <div className="text-sm text-gray-900">No coins found</div>
                    </td>
                  </tr>
                ) : (
                  coins?.map((coin) => (
                    <tr key={coin.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">{coin.name}</div>
                        <div className="text-sm text-gray-500">{coin.symbol}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">
                          ${coin.price.toFixed(3)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">{coin.liquidity}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">{coin.age}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Alerts
            </h2>
            <Link
              href="/dashboard/alerts/new"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Create New Alert
            </Link>
          </div>
          <div className="space-y-4">
            {isLoadingAlerts ? (
              <div className="text-sm text-gray-600">Loading alerts...</div>
            ) : alertsError ? (
              <div className="text-sm text-red-500">Error loading alerts</div>
            ) : alerts?.length === 0 ? (
              <div className="text-sm text-gray-600">No alerts configured</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {alerts?.map((alert) => (
                  <div key={alert.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{alert.name}</h3>
                        <p className="mt-1 text-xs text-gray-500">
                          Created {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        alert.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {Object.entries(alert.conditions).map(([key, condition]) => {
                        const typedCondition = condition as { enabled: boolean };
                        return typedCondition.enabled && (
                          <div key={key} className="mt-1">
                            • {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 