import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
});

export const metadata: Metadata = {
  title: "Sabi Detective",
  description: "A daily Nigerian crime case. Question suspects, collect clues, crack the case.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d0c0b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${sourceSans.variable}`}>
      <body className="min-h-dvh overflow-x-hidden font-sans" suppressHydrationWarning>
        <main className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-ink-900 shadow-2xl shadow-black">
          {children}
        </main>
      </body>
    </html>
  );
}
