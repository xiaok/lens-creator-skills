import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lens Forum Demo",
  description: "A node-based forum demo on Lens using groups as nodes.",
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
