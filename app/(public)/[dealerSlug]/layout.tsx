import type { ReactElement, ReactNode } from "react";
import { notFound } from "next/navigation";

import { getPublicFacebookChatPageId } from "@/features/facebook/queries";
import { FacebookMessengerChat } from "@/features/public/components/facebook-messenger-chat";
import { getPublicDealershipBySlug } from "@/features/public/queries";

type DealerPublicLayoutProps = {
  children: ReactNode;
  params: Promise<{
    dealerSlug: string;
  }>;
};

export default async function DealerPublicLayout({
  children,
  params,
}: DealerPublicLayoutProps): Promise<ReactElement> {
  const { dealerSlug } = await params;
  const dealership = await getPublicDealershipBySlug(dealerSlug);

  if (!dealership) {
    notFound();
  }

  const pageId = await getPublicFacebookChatPageId(dealership.id);
  const sdkVersion = process.env.META_GRAPH_API_VERSION?.trim() || "v23.0";

  return (
    <>
      {children}
      {pageId ? (
        <FacebookMessengerChat pageId={pageId} sdkVersion={sdkVersion} />
      ) : null}
    </>
  );
}
