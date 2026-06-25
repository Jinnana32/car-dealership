import type { ReactElement, ReactNode } from "react";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({
  children,
}: PublicLayoutProps): ReactElement {
  return <div className="min-h-screen bg-[#f6f3ee] text-foreground">{children}</div>;
}
