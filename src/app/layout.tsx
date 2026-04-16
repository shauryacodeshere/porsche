import type { Metadata } from "next";
import { Syncopate } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";

const syncopate = Syncopate({
  variable: "--font-syncopate",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Porsche After Dark | Experience the 911",
  description: "A cinematic 3D experience for the Porsche 911 GT3 — configure, explore, and feel the machine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${syncopate.variable} antialiased bg-black`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
