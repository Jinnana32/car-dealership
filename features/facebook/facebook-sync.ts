import "server-only";

import { syncFacebookPostComments } from "@/features/facebook/comment-sync";
import { syncFacebookMessengerConversations } from "@/features/facebook/messenger-sync";

export type FacebookIntegrationSyncSummary = {
  comments: Awaited<ReturnType<typeof syncFacebookPostComments>>;
  messenger: Awaited<ReturnType<typeof syncFacebookMessengerConversations>>;
};

export async function syncFacebookIntegrations(): Promise<FacebookIntegrationSyncSummary> {
  const [comments, messenger] = await Promise.all([
    syncFacebookPostComments(),
    syncFacebookMessengerConversations(),
  ]);

  return {
    comments,
    messenger,
  };
}
