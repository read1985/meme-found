import { Inter } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { initializeMonitoring } from "@/lib/monitoring/init";

// Initialize monitoring service
initializeMonitoring();

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | Solana Raydium Coin Alert Service",
    default: "Solana Raydium Coin Alert Service",
  },
  description:
    "Monitor new coins on Raydium DEX and receive alerts based on custom criteria",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
