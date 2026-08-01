import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dante",
  description: "Italiaanse cursussen — aanmelden en aanwezigheid",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body>
        <div className="shell">
          <header className="site-header">
            <Link href="/" className="brand">
              Dante
            </Link>
            <nav className="nav">
              <Link href="/#cursussen">Cursussen</Link>
              <Link href="/docenten">Docenten</Link>
              <Link href="/docent">Aanwezigheid</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
