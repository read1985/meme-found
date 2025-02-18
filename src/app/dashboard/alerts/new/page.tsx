'use client';

import React from 'react';
import { CreateAlertForm } from '@/components/CreateAlertForm';

export default function NewAlertPage() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Alert</h1>
        <p className="mt-2 text-gray-600">
          Configure alert conditions for new coins
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-lg">
        <CreateAlertForm />
      </div>
    </div>
  );
} 