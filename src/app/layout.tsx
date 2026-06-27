import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppBackground } from "@/components/layout/AppBackground";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { HealthMonitor } from "@/components/layout/HealthMonitor";
import { StatusBar } from "@/components/layout/StatusBar";
import { PageTransition } from "@/components/layout/PageTransition";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MultiVault | Enterprise Digital Asset Infrastructure",
  description:
    "Institutional-grade multi-chain trading, portfolio management, and self-custody wallet infrastructure for modern operators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col pb-[var(--status-h)] text-[var(--foreground)]">
        <AppBackground />
        <HealthMonitor />
        <ErrorBoundary>
          <PageTransition>{children}</PageTransition>
        </ErrorBoundary>
        <StatusBar />
      </body>
    </html>
  );
}