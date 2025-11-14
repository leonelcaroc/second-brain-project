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
  title: {
    default: "Second Brain - AI-Powered Knowledge Base",
    template: "%s | Second Brain",
  },
  description:
    "Search transcripts and conversations with AI-powered semantic search. Your personal knowledge base, always accessible.",
  keywords: [
    "AI search",
    "knowledge base",
    "semantic search",
    "podcast transcripts",
    "vector database",
    "second brain",
    "Pinecone",
    "OpenAI",
    "Next.js",
  ],
  authors: [{ name: "Leonel Caroc" }],
  creator: "Leonel Caroc",
  publisher: "Leonel Caroc",
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
