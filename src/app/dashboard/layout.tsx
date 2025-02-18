import { Navigation } from "@/components/Navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Solana Raydium Coin Alert Service",
  description: "Monitor new coins and manage your alerts",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Navigation />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
} 