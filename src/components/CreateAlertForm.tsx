'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { Alert } from "@/types/alert";

interface AlertFormData {
  name: string;
  tokenAddress?: string;
  conditions: {
    tokenDistribution: {
      enabled: boolean;
      maxTopHolderPercentage: number;
    };
    liquidityPool: {
      enabled: boolean;
      minLiquidity: number;
      requireLocked: boolean;
    };
    smartContract: {
      enabled: boolean;
      requireRenounced: boolean;
      requireVerified: boolean;
    };
    trading: {
      enabled: boolean;
      minDailyVolume: number;
      maxBuyTax: number;
      maxSellTax: number;
    };
  };
}

interface CreateAlertFormProps {
  initialData?: Alert;
  mode?: 'create' | 'edit';
}

export function CreateAlertForm({ initialData, mode = 'create' }: CreateAlertFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<AlertFormData>(() => {
    if (initialData) {
      return {
        name: initialData.name,
        tokenAddress: initialData.tokenAddress,
        conditions: initialData.conditions,
      };
    }
    return {
      name: "",
      tokenAddress: "",
      conditions: {
        tokenDistribution: {
          enabled: false,
          maxTopHolderPercentage: 0,
        },
        liquidityPool: {
          enabled: false,
          minLiquidity: 0,
          requireLocked: false,
        },
        smartContract: {
          enabled: false,
          requireRenounced: false,
          requireVerified: false,
        },
        trading: {
          enabled: false,
          minDailyVolume: 0,
          maxBuyTax: 0,
          maxSellTax: 0,
        },
      },
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = mode === 'edit' 
        ? `/api/alerts/${initialData?.id}`
        : "/api/alerts";
      
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${mode} alert`);
      }

      router.push("/dashboard/alerts");
      router.refresh();
    } catch (error) {
      console.error(`Error ${mode}ing alert:`, error);
      alert(`Failed to ${mode} alert. Please try again.`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Alert Name
        </label>
        <div className="mt-2">
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="tokenAddress"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Token Address (Optional)
        </label>
        <div className="mt-2">
          <input
            type="text"
            id="tokenAddress"
            value={formData.tokenAddress}
            onChange={(e) => setFormData({ ...formData, tokenAddress: e.target.value })}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Leave empty to monitor all new tokens"
            pattern="[1-9A-HJ-NP-Za-km-z]{32,44}"
            title="Enter a valid Solana token mint address or leave empty"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Leave this field empty to receive alerts for any new tokens that match your conditions. 
          Specify a token address to monitor a specific token only.
        </p>
      </div>

      <div className="space-y-4">
        {/* Token Distribution Section */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-900">
              Token Distribution
            </label>
            <input
              type="checkbox"
              checked={formData.conditions.tokenDistribution.enabled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  conditions: {
                    ...formData.conditions,
                    tokenDistribution: {
                      ...formData.conditions.tokenDistribution,
                      enabled: e.target.checked,
                    },
                  },
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
          </div>
          {formData.conditions.tokenDistribution.enabled && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Max Top Holder Percentage
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.conditions.tokenDistribution.maxTopHolderPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    conditions: {
                      ...formData.conditions,
                      tokenDistribution: {
                        ...formData.conditions.tokenDistribution,
                        maxTopHolderPercentage: Number(e.target.value) || 0,
                      },
                    },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          )}
        </div>

        {/* Liquidity Pool Section */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-900">
              Liquidity Pool
            </label>
            <input
              type="checkbox"
              checked={formData.conditions.liquidityPool.enabled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  conditions: {
                    ...formData.conditions,
                    liquidityPool: {
                      ...formData.conditions.liquidityPool,
                      enabled: e.target.checked,
                    },
                  },
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
          </div>
          {formData.conditions.liquidityPool.enabled && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Liquidity (SOL)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.conditions.liquidityPool.minLiquidity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        liquidityPool: {
                          ...formData.conditions.liquidityPool,
                          minLiquidity: Number(e.target.value) || 0,
                        },
                      },
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireLocked"
                  checked={formData.conditions.liquidityPool.requireLocked}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        liquidityPool: {
                          ...formData.conditions.liquidityPool,
                          requireLocked: e.target.checked,
                        },
                      },
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label
                  htmlFor="requireLocked"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Require Locked Liquidity
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Smart Contract Section */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-900">
              Smart Contract
            </label>
            <input
              type="checkbox"
              checked={formData.conditions.smartContract.enabled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  conditions: {
                    ...formData.conditions,
                    smartContract: {
                      ...formData.conditions.smartContract,
                      enabled: e.target.checked,
                    },
                  },
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
          </div>
          {formData.conditions.smartContract.enabled && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireRenounced"
                  checked={formData.conditions.smartContract.requireRenounced}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        smartContract: {
                          ...formData.conditions.smartContract,
                          requireRenounced: e.target.checked,
                        },
                      },
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label
                  htmlFor="requireRenounced"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Require Renounced Ownership
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireVerified"
                  checked={formData.conditions.smartContract.requireVerified}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        smartContract: {
                          ...formData.conditions.smartContract,
                          requireVerified: e.target.checked,
                        },
                      },
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label
                  htmlFor="requireVerified"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Require Verified Contract
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Trading Section */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-900">
              Trading Requirements
            </label>
            <input
              type="checkbox"
              checked={formData.conditions.trading.enabled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  conditions: {
                    ...formData.conditions,
                    trading: {
                      ...formData.conditions.trading,
                      enabled: e.target.checked,
                    },
                  },
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
          </div>
          {formData.conditions.trading.enabled && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Daily Volume (SOL)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.conditions.trading.minDailyVolume}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        trading: {
                          ...formData.conditions.trading,
                          minDailyVolume: Number(e.target.value) || 0,
                        },
                      },
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Maximum Buy Tax (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.conditions.trading.maxBuyTax}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        trading: {
                          ...formData.conditions.trading,
                          maxBuyTax: Number(e.target.value) || 0,
                        },
                      },
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Maximum Sell Tax (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.conditions.trading.maxSellTax}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        trading: {
                          ...formData.conditions.trading,
                          maxSellTax: Number(e.target.value) || 0,
                        },
                      },
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {mode === 'edit' ? 'Update Alert' : 'Create Alert'}
        </button>
      </div>
    </form>
  );
} 