import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | Solana Raydium Coin Alert Service",
  description: "Create a new account",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 