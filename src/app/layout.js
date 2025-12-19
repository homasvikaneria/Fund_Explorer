// fund_explorer - Copy/src/app/layout.js
// src/app/layout.js

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/lib/startup"; // Auto-initialize cron jobs
// import { AuthProvider } from "@/context/AuthContext";
// import Navbar from "../components/Navbar";
// import { Toaster } from 'react-hot-toast';

// Load Google Fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Mutual Fund Explorer",
  description: "A Next.js app for mutual fund calculations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}
        suppressHydrationWarning
      >
        {/* <AuthProvider> */}
          <div className="min-h-screen flex flex-col">
            {/* <Navbar /> */}
            <main className="flex-grow">
              {children}
            </main>
            {/* <Toaster position="top-right" /> */}
          </div>
        {/* </AuthProvider> */}
      </body>
    </html>
  );
}
