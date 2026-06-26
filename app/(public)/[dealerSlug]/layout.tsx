import type { ReactElement, ReactNode } from "react";
import { notFound } from "next/navigation";

import {
  FACEBOOK_MESSENGER_FALLBACK_HREF,
  FACEBOOK_MESSENGER_PAGE_ID,
} from "@/features/facebook/constants";
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

  return (
    <>
      {children}
      <FacebookMessengerChat
        messengerHref={FACEBOOK_MESSENGER_FALLBACK_HREF}
        pageId={FACEBOOK_MESSENGER_PAGE_ID}
      />
    </>
  );
}
