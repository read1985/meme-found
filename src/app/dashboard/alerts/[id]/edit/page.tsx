'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreateAlertForm } from '@/components/CreateAlertForm';
import type { Alert } from '@/types/alert';

async function fetchAlert(id: string): Promise<Alert> {
  const response = await fetch(`/api/alerts/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch alert');
  }
  return response.json();
}

export default function EditAlertPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { data: alert, isLoading, error } = useQuery({
    queryKey: ['alert', resolvedParams.id],
    queryFn: () => fetchAlert(resolvedParams.id),
  });

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Alert</h1>
        <p className="mt-2 text-gray-600">
          Modify alert conditions and settings
        </p>
      </div>

      {isLoading ? (
        <div className="text-gray-600">Loading alert...</div>
      ) : error ? (
        <div className="text-red-500">Error loading alert</div>
      ) : alert ? (
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <CreateAlertForm initialData={alert} mode="edit" />
        </div>
      ) : null}
    </div>
  );
} 