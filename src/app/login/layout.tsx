import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Solana Raydium Coin Alert Service",
  description: "Sign in to your account",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 