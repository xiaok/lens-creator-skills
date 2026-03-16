import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slay the Spire Forum",
  description: "杀戮尖塔游戏论坛 - Slay the Spire Community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="header">
          <div className="header-inner">
            <Link href="/" className="logo">
              <span className="logo-icon">S</span>
              SlaySpire
            </Link>
          </div>
        </header>
        {children}
        <footer className="footer">
          <p>
            SlaySpire Forum © 2024 — 杀戮尖塔游戏社区
          </p>
        </footer>
      </body>
    </html>
  );
}
