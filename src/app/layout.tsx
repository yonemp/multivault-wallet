import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/brand";
import { Geist, Geist_Mono } from "next/font/google";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { HealthMonitor } from "@/components/layout/HealthMonitor";
import { PageTransition } from "@/components/layout/PageTransition";
import { RouteChrome } from "@/components/layout/RouteChrome";
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
  title: `${BRAND_NAME} | Multi-Chain Trading Terminal`,
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
      <body className="relative min-h-full flex flex-col text-[var(--foreground)]">
        <RouteChrome>
          <HealthMonitor />
          <ErrorBoundary>
            <PageTransition>{children}</PageTransition>
          </ErrorBoundary>
        </RouteChrome>
      </body>
    </html>
  );
}