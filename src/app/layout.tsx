"use client";

import localFont from "next/font/local";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

type NavItem = {
  label: string;
  href: string;
  isActive: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    isActive: (pathname) => pathname === "/",
  },
  {
    label: "Fields",
    href: "/#fields",
    isActive: (pathname) => pathname.startsWith("/field"),
  },
  {
    label: "Upload",
    href: "/upload",
    isActive: (pathname) => pathname === "/upload",
  },
  {
    label: "Compare",
    href: "/compare",
    isActive: (pathname) => pathname === "/compare",
  },
];

function navLinkClass(active: boolean): string {
  const base =
    "rounded-lg border px-3 py-2 text-sm transition-colors duration-150";
  if (active) {
    return `${base} border-[#22C55E] bg-[#22C55E]/10 text-[#22C55E]`;
  }
  return `${base} border-zinc-800 bg-[#111111] text-zinc-300 hover:border-zinc-700 hover:text-zinc-100`;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://api.mapbox.com/mapbox-gl-js/v3.18.1/mapbox-gl.css"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[#0a0a0a] text-zinc-100 antialiased`}
      >
        <div className="min-h-screen bg-[#0a0a0a]">
          <div className="mx-auto flex min-h-screen max-w-[1680px]">
            <aside className="hidden w-64 shrink-0 border-r border-zinc-800 p-6 md:flex md:flex-col">
              <Link href="/" className="mb-10 flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-[#22C55E]" />
                <div>
                  <p className="text-lg font-semibold tracking-wide text-zinc-100">
                    CropScan
                  </p>
                  <p className="text-xs text-zinc-400">
                    Drone Crop Intelligence
                  </p>
                </div>
              </Link>

              <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const active = item.isActive(pathname);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={navLinkClass(active)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto rounded-lg border border-zinc-800 bg-[#111111] p-4">
                <p className="text-xs text-zinc-300">Live Monitoring</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Track field health, flights, and alerts from one dashboard.
                </p>
              </div>
            </aside>

            <div className="flex min-h-screen flex-1 flex-col">
              <header className="sticky top-0 z-20 border-b border-zinc-800 bg-[#0a0a0a]/95 px-4 py-4 backdrop-blur md:hidden">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
                  <p className="text-sm font-semibold tracking-wide text-zinc-100">
                    CropScan
                  </p>
                </div>
                <nav className="grid grid-cols-4 gap-2">
                  {navItems.map((item) => {
                    const active = item.isActive(pathname);
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={navLinkClass(active)}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </header>

              <main className="flex-1 p-4 md:p-8">{children}</main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
