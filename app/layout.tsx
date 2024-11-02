"use client";

import localFont from "next/font/local";
import "./globals.css";
import Header from "components/header";
import Footer from "components/footer";
import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from '../contexts/AuthContext';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <AuthProvider>
        <html lang="en">
          <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#e0e7ff] min-h-screen`}>
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer />
          </body>
        </html>
      </AuthProvider>
    </ClerkProvider>
  );
}
