import "server-only";

import { FACEBOOK_MESSENGER_PAGE_ID } from "@/features/facebook/constants";

type PublicMessengerConnection = {
  page_id: string | null;
} | null;

/** Numeric Facebook Page ID used for m.me links and the Customer Chat plugin. */
export function resolvePublicMessengerPageId(
  connection: PublicMessengerConnection,
): string {
  const fromConnection = connection?.page_id?.trim() || null;
  const fromEnv = process.env.META_PAGE_ID?.trim() || null;

  return fromConnection ?? fromEnv ?? FACEBOOK_MESSENGER_PAGE_ID;
}

export function buildPublicMessengerHref(pageId: string): string {
  return `https://m.me/${encodeURIComponent(pageId.trim())}`;
}
