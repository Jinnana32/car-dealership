import type { ReactElement } from "react";

import { PageContent } from "@/components/layout/page-content";
import { UnauthorizedState } from "@/components/layout/unauthorized-state";
import { Card, CardContent } from "@/components/ui/card";
import { AiSalesAnalystWorkspace } from "@/features/ai/components/ai-sales-analyst-workspace";
import {
  getAiChatMessages,
  getAiChatSessions,
  getAiContextSummary,
  getAiSuggestedQuestions,
} from "@/features/ai/actions";
import { canUseAiSalesAnalyst } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

type AiSalesAnalystPageProps = {
  searchParams: Promise<{
    session?: string | string[];
  }>;
};

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AiSalesAnalystPage({
  searchParams,
}: AiSalesAnalystPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  if (!canUseAiSalesAnalyst(access.membership.role)) {
    return (
      <UnauthorizedState
        title="AI Sales Analyst access denied"
        description="Only owners and admins can use AI Sales Analyst."
      />
    );
  }

  const resolvedSearchParams = await searchParams;
  const sessionId = getSearchParam(resolvedSearchParams.session) ?? null;
  const [contextResult, sessions, suggestedQuestions, initialMessagesResult] =
    await Promise.all([
      getAiContextSummary(),
      getAiChatSessions(),
      getAiSuggestedQuestions(),
      sessionId
        ? getAiChatMessages({
            sessionId,
          })
        : Promise.resolve({
            messages: [],
            sessionId: null,
          }),
    ]);

  return (
    <PageContent
      title="AI Sales Analyst"
      description="Ask questions about your inventory, leads, sales, pipeline, and Facebook performance."
    >
      {contextResult.error && !contextResult.summary ? (
        <Card className="rounded-[20px] border-border shadow-none">
          <CardContent className="px-6 py-8">
            <p className="text-sm font-semibold text-foreground">
              AI Sales Analyst is unavailable
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {contextResult.error}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <AiSalesAnalystWorkspace
        context={contextResult.context}
        initialMessages={initialMessagesResult.messages}
        initialSessionId={initialMessagesResult.sessionId}
        sessions={sessions}
        setupRequired={contextResult.summary?.configured === false}
        suggestedQuestions={suggestedQuestions}
        summary={contextResult.summary}
      />
    </PageContent>
  );
}
