import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import Providers from "./providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Using a system-font stack (see globals.css --font-display / --font-body)
// instead of next/font/google, so the build never depends on network access
// to fonts.googleapis.com. Swap in next/font/google or self-hosted font
// files any time — nothing else in the app needs to change.

export const metadata: Metadata = {
  title: "Threadloop — Wear Your Own Story",
  description: "A style catalog built entirely from your own product dataset.",
};

export const viewport: Viewport = {
  themeColor: "#14151A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
