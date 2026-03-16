import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lens Blog",
  description: "A minimal blog powered by Lens Protocol posts tagged with blog.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
