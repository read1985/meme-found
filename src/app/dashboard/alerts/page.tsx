'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import type { Alert } from '@/types/alert';

async function fetchAlerts(): Promise<Alert[]> {
  const response = await fetch('/api/alerts');
  if (!response.ok) {
    throw new Error('Failed to fetch alerts');
  }
  return response.json();
}

async function deleteAlert(id: string) {
  const response = await fetch(`/api/alerts/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete alert');
  }
  return response.json();
}

async function toggleAlertStatus(id: string, status: 'active' | 'inactive') {
  const response = await fetch(`/api/alerts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error('Failed to update alert');
  }
  return response.json();
}

export default function AlertsPage() {
  const queryClient = useQueryClient();
  
  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      toggleAlertStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting alert:', error);
        alert('Failed to delete alert');
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: 'active' | 'inactive') => {
    try {
      await toggleStatusMutation.mutateAsync({
        id,
        status: currentStatus === 'active' ? 'inactive' : 'active',
      });
    } catch (error) {
      console.error('Error updating alert status:', error);
      alert('Failed to update alert status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
          <p className="mt-2 text-gray-600">
            Manage your coin monitoring alerts
          </p>
        </div>
        <Link
          href="/dashboard/alerts/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Create New Alert
        </Link>
      </div>

      {isLoading ? (
        <div className="text-gray-600">Loading alerts...</div>
      ) : error ? (
        <div className="text-red-500">Error loading alerts</div>
      ) : alerts?.length === 0 ? (
        <div className="rounded-lg bg-white p-6 text-center shadow-lg">
          <p className="text-gray-600">No alerts configured</p>
          <Link
            href="/dashboard/alerts/new"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-500"
          >
            Create your first alert
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {alerts?.map((alert) => (
            <div
              key={alert.id}
              className="rounded-lg bg-white p-6 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {alert.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Created {new Date(alert.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleToggleStatus(alert.id, alert.status)}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                      alert.status === 'active'
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {alert.status}
                  </button>
                  <Link
                    href={`/dashboard/alerts/${alert.id}/edit`}
                    className="rounded-md bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="rounded-md bg-white px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {Object.entries(alert.conditions).map(([key, condition]) => {
                  const typedCondition = condition as { enabled: boolean };
                  return typedCondition.enabled && (
                    <div key={key} className="rounded-md bg-gray-50 p-3">
                      <h4 className="font-medium text-gray-900">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <div className="mt-1 text-sm text-gray-600">
                        {Object.entries(condition)
                          .filter(([k]) => k !== 'enabled')
                          .map(([k, v]) => (
                            <div key={k}>
                              {k.replace(/([A-Z])/g, ' $1').trim()}: {String(v)}
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 