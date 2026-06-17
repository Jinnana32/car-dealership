import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Best Wheels",
    template: "%s | Best Wheels",
  },
  description:
    "Dealership operations platform for inventory, inquiries, and marketing.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({
  children,
}: RootLayoutProps): ReactElement {
  return (
    <html lang="en">
      <body className="text-foreground">{children}</body>
    </html>
  );
}
