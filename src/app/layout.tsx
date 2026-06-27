import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppBackground } from "@/components/layout/AppBackground";
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
  title: "MultiVault | Multi-Chain Web Wallet",
  description:
    "Create, import, or connect a multi-chain crypto wallet in your browser.",
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
        <AppBackground />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}