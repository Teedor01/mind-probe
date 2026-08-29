import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindProbe",
  description: "Finds the exact concept you misunderstand. Proves whether it's fixed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-base-bg text-ink-primary font-sans antialiased">{children}</body>
    </html>
  );
}
