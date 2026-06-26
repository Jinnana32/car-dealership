import type { ReactElement, ReactNode } from "react";
import { notFound } from "next/navigation";

import {
  getPublicFacebookChatPageId,
  getPublicMessengerFallbackHref,
} from "@/features/facebook/queries";
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

  const [pageId, messengerHref] = await Promise.all([
    getPublicFacebookChatPageId(dealership.id),
    getPublicMessengerFallbackHref(dealership.id),
  ]);

  return (
    <>
      {children}
      {pageId || messengerHref ? (
        <FacebookMessengerChat messengerHref={messengerHref} pageId={pageId} />
      ) : null}
    </>
  );
}
