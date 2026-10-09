import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sabi Detective",
  description: "A daily Nigerian crime case. Question suspects, collect clues, crack the case.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c0a09",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans">
        <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col bg-noir-900 shadow-2xl shadow-black">
          {children}
        </main>
      </body>
    </html>
  );
}
