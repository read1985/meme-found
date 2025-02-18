import React, { useState } from "react";

interface AlertFormData {
  name: string;
  conditions: {
    tokenDistribution?: {
      enabled: boolean;
      maxTopHolderPercentage?: number;
    };
    liquidityPool?: {
      enabled: boolean;
      minLiquidity?: number;
    };
    smartContract?: {
      enabled: boolean;
      requireRenounced?: boolean;
    };
  };
}

export function CreateAlertForm() {
  const [formData, setFormData] = useState<AlertFormData>({
    name: "",
    conditions: {
      tokenDistribution: {
        enabled: false,
      },
      liquidityPool: {
        enabled: false,
      },
      smartContract: {
        enabled: false,
      },
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create alert");
      }

      // Reset form or show success message
    } catch (error) {
      console.error("Error creating alert:", error);
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

      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-900">
              Token Distribution
            </label>
            <input
              type="checkbox"
              checked={formData.conditions.tokenDistribution?.enabled}
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
          {formData.conditions.tokenDistribution?.enabled && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Max Top Holder Percentage
              </label>
              <input
                type="number"
                value={formData.conditions.tokenDistribution?.maxTopHolderPercentage || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    conditions: {
                      ...formData.conditions,
                      tokenDistribution: {
                        ...formData.conditions.tokenDistribution,
                        maxTopHolderPercentage: Number(e.target.value),
                      },
                    },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          )}
        </div>

        {/* Add similar sections for Liquidity Pool and Smart Contract conditions */}
      </div>

      <div>
        <button
          type="submit"
          className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Create Alert
        </button>
      </div>
    </form>
  );
} 