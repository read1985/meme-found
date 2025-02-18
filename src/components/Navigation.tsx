import React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

export function Navigation() {
  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
                Raydium Alert
              </Link>
            </div>
            <div className="ml-6 flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/alerts"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                Alerts
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => signOut()}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 