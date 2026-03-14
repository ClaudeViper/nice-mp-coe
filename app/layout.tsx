import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SkipNav } from "@/components/skip-nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NICE Agentic CoE — Media Processing",
  description: "NICE AI-first Agentic Center of Excellence for Speech & Voice Evaluation",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Skip-nav must be the very first focusable element */}
        <SkipNav />
        {children}
      </body>
    </html>
  );
}
