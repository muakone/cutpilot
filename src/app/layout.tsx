import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "CutPilot - AI Video Editor",
  description:
    "AI-powered video editing with natural language. Turn raw videos into platform-ready content.",
  icons: {
    icon: "/favicon.svg",
    apple: "/cutpilot-logo.svg",
  },
  openGraph: {
    title: "CutPilot - AI Video Editor",
    description:
      "Transform your videos with AI-powered editing using natural language",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
