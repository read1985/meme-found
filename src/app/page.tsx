import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-lg">
        <div>
          <h1 className="text-center text-4xl font-bold tracking-tight text-gray-900">
            Solana Raydium Coin Alert
          </h1>
          <p className="mt-4 text-center text-gray-600">
            Monitor new coins and receive alerts based on custom criteria
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/login"
            className="block w-full rounded-md bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="block w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Create Account
          </Link>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">Features</h2>
          <ul className="mt-4 space-y-2 text-gray-600">
            <li className="flex items-center">
              <span className="mr-2">•</span>
              Real-time coin monitoring
            </li>
            <li className="flex items-center">
              <span className="mr-2">•</span>
              Custom alert conditions
            </li>
            <li className="flex items-center">
              <span className="mr-2">•</span>
              Token distribution analysis
            </li>
            <li className="flex items-center">
              <span className="mr-2">•</span>
              Liquidity pool tracking
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
