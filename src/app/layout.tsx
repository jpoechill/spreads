import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SpreadMaster - Strategy Simulator",
  description: "Calculate net profit after margin interest and capital gains tax. Advanced tools for stocks and options trading strategies.",
  keywords: ["trading", "margin calculator", "capital gains tax", "options spreads", "stock trading", "ROI calculator"],
  authors: [{ name: "SpreadMaster Team" }],
  openGraph: {
    title: "SpreadMaster - Strategy Simulator",
    description: "Calculate net profit after margin interest and capital gains tax. Advanced tools for stocks and options trading strategies.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpreadMaster - Strategy Simulator",
    description: "Calculate net profit after margin interest and capital gains tax. Advanced tools for stocks and options trading strategies.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
