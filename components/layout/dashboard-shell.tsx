import Link from "next/link";
import type { ReactNode } from "react";

import type { Session } from "next-auth";

import { ThemeToggle } from "@/components/ui/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/images", label: "Images" },
  { href: "/dashboard/api", label: "API" },
  { href: "/dashboard/billing", label: "Billing" }
];

export function DashboardShell({
  children,
  session
}: {
  children: ReactNode;
  session: Session;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="glass-card rounded-3xl p-5">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="font-display text-lg text-white">CompressAI Pro</p>
              <p className="text-sm text-muted-foreground">{session.user.plan} plan</p>
            </div>
            <ThemeToggle />
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl border border-transparent px-4 py-3 text-sm text-muted-foreground transition hover:border-white/10 hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="space-y-6">
          <header className="glass-card rounded-3xl p-6">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-primary">Dashboard</p>
                <h1 className="font-display text-3xl font-semibold text-white">
                  Hello, {session.user.name ?? session.user.email ?? "operator"}
                </h1>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/compressor"
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Open Compressor
                </Link>
                <Link
                  href="/"
                  className="rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-white"
                >
                  Marketing Site
                </Link>
              </div>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
