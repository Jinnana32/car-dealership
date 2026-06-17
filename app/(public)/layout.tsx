import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({
  children,
}: PublicLayoutProps): ReactElement {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fffdf9_0%,_#f8f1e6_100%)]">
      <header className="border-b border-border/70 bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Public
            </p>
            <p className="text-base font-semibold text-foreground">
              Dealership website draft
            </p>
          </div>
          <Link
            href="/login"
            className="rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Back to admin
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
