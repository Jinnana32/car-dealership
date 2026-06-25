"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  AlertCircle,
  BrainCircuit,
  LoaderCircle,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import type { ReactElement } from "react";

import { askAiSalesAnalyst, getAiChatMessages } from "@/features/ai/actions";
import type {
  AiChatMessageRecord,
  AiChatSessionListItem,
  AiContextSummary,
  DealershipAiContext,
} from "@/features/ai/types";
import { ReportMetricCard } from "@/features/reports/components/report-metric-card";
import { formatCrmDateTime } from "@/features/inquiries/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AiSalesAnalystWorkspaceProps = {
  context: DealershipAiContext | null;
  initialMessages: AiChatMessageRecord[];
  initialSessionId: string | null;
  sessions: AiChatSessionListItem[];
  setupRequired: boolean;
  suggestedQuestions: string[];
  summary: AiContextSummary | null;
};

function getSelectedSession(
  sessions: AiChatSessionListItem[],
  sessionId: string | null,
): AiChatSessionListItem | null {
  if (!sessionId) {
    return null;
  }

  return sessions.find((session) => session.id === sessionId) ?? null;
}

export function AiSalesAnalystWorkspace({
  context,
  initialMessages,
  initialSessionId,
  sessions: initialSessions,
  setupRequired: initialSetupRequired,
  suggestedQuestions,
  summary,
}: AiSalesAnalystWorkspaceProps): ReactElement {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [sessions, setSessions] = useState(initialSessions);
  const [selectedSessionId, setSelectedSessionId] = useState(initialSessionId);
  const [setupRequired, setSetupRequired] = useState(initialSetupRequired);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedSession = getSelectedSession(sessions, selectedSessionId);

  function applyAskResult(result: Awaited<ReturnType<typeof askAiSalesAnalyst>>) {
    setSetupRequired(result.setupRequired);
    setSessions(result.sessions);
    setMessages(result.messages);
    setSelectedSessionId(result.sessionId);
    setError(result.error ?? null);
    setFieldError(result.fieldErrors?.question?.[0] ?? null);

    if (!result.error) {
      setQuestion("");
    }
  }

  function handleAsk(nextQuestion: string) {
    const trimmedQuestion = nextQuestion.trim();

    if (!trimmedQuestion) {
      setFieldError("Enter a question for AI Sales Analyst.");
      return;
    }

    setError(null);
    setFieldError(null);

    startTransition(async () => {
      const result = await askAiSalesAnalyst({
        question: trimmedQuestion,
        sessionId: selectedSessionId,
      });

      applyAskResult(result);
    });
  }

  function handleLoadSession(sessionId: string) {
    setError(null);
    setFieldError(null);

    startTransition(async () => {
      const result = await getAiChatMessages({
        sessionId,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSelectedSessionId(result.sessionId);
      setMessages(result.messages);
      setQuestion("");
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card className="rounded-[20px] border-border shadow-none">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg">Setup status</CardTitle>
              <Badge
                variant={setupRequired ? "outline" : "default"}
                className={cn(
                  setupRequired
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-transparent bg-primary/10 text-primary",
                )}
              >
                {setupRequired ? "Setup required" : "Configured"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              {setupRequired
                ? "AI is not configured yet. Add OPENAI_API_KEY to enable AI Sales Analyst."
                : "AI can read dealership data and answer business questions. It cannot update records or publish anything."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Read-only</Badge>
              <Badge variant="outline">Inventory</Badge>
              <Badge variant="outline">Leads</Badge>
              <Badge variant="outline">Sales</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[20px] border-border shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Suggested questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestedQuestions.map((suggestion) => (
              <Button
                key={suggestion}
                className="h-auto w-full justify-start whitespace-normal text-left"
                disabled={setupRequired || isPending}
                onClick={() => {
                  setQuestion(suggestion);
                  handleAsk(suggestion);
                }}
                type="button"
                variant="outline"
              >
                {suggestion}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[20px] border-border shadow-none">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg">Recent chats</CardTitle>
              <Button
                disabled={isPending}
                onClick={() => {
                  setSelectedSessionId(null);
                  setMessages([]);
                  setQuestion("");
                  setError(null);
                  setFieldError(null);
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                New chat
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-8 text-center">
                <p className="text-sm font-semibold text-foreground">
                  No AI chat history yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your recent dealership questions will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => {
                  const isActive = session.id === selectedSessionId;

                  return (
                    <button
                      key={session.id}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-3 text-left transition-colors",
                        isActive
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-white hover:bg-muted/20",
                      )}
                      disabled={isPending}
                      onClick={() => handleLoadSession(session.id)}
                      type="button"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {session.title || "Untitled chat"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {session.lastMessagePreview || "No reply stored yet."}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {session.messageCount} messages · {formatCrmDateTime(session.updated_at)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {summary ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summary.metricCards.map((metric) => (
              <ReportMetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
              />
            ))}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">
                    {selectedSession?.title || "AI conversation"}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ask about inventory, leads, follow-ups, sales, or Facebook performance.
                  </p>
                </div>
                {isPending ? (
                  <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!summary?.hasOperationalData ? (
                <div className="rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-6 text-sm text-muted-foreground">
                  No dealership activity is available yet. AI can still explain readiness gaps and what data to capture first.
                </div>
              ) : null}

              {error ? (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              <div className="space-y-3 rounded-[20px] border border-border bg-[#fafaf9] p-4">
                {messages.length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                    <BrainCircuit className="h-10 w-10 text-muted-foreground/70" />
                    <p className="mt-4 text-sm font-semibold text-foreground">
                      Ask AI Sales Analyst a dealership question
                    </p>
                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                      Try a question about slow-moving vehicles, follow-up priorities, lead sources, or Facebook-ready inventory.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "rounded-2xl border px-4 py-3",
                          message.role === "assistant"
                            ? "border-border bg-white"
                            : "border-primary/20 bg-primary/5",
                        )}
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {message.role === "assistant" ? (
                            <Sparkles className="h-3.5 w-3.5" />
                          ) : (
                            <MessageSquareText className="h-3.5 w-3.5" />
                          )}
                          {message.role === "assistant" ? "AI Sales Analyst" : "You"}
                          <span className="normal-case tracking-normal">
                            {formatCrmDateTime(message.created_at)}
                          </span>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
                          {message.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleAsk(question);
                }}
              >
                <Textarea
                  disabled={setupRequired || isPending}
                  name="question"
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask a question about inventory, leads, sales, pipeline, brochures, or Facebook performance."
                  rows={5}
                  value={question}
                />
                {fieldError ? (
                  <p className="text-sm text-red-700">{fieldError}</p>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Read-only analysis only. AI will not change records or send messages.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      disabled={setupRequired || isPending}
                      type="submit"
                    >
                      {isPending ? "Thinking..." : "Ask AI"}
                    </Button>
                    <Button
                      disabled={isPending}
                      onClick={() => {
                        setQuestion("");
                        setFieldError(null);
                      }}
                      type="button"
                      variant="ghost"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[20px] border-border shadow-none">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">Priority follow-ups</CardTitle>
              </CardHeader>
              <CardContent>
                {context?.topOverdueFollowUps.length ? (
                  <div className="space-y-3">
                    {context.topOverdueFollowUps.slice(0, 4).map((followUp) => (
                      <div
                        key={followUp.inquiryId}
                        className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-3"
                      >
                        <Link
                          className="text-sm font-semibold text-foreground hover:text-primary"
                          href={followUp.adminPath}
                        >
                          {followUp.customerName}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {followUp.vehicleTitle || "Vehicle not linked"} · {followUp.status}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {followUp.followUpAt
                            ? `Follow-up ${formatCrmDateTime(followUp.followUpAt)}`
                            : "No follow-up scheduled"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No overdue follow-ups right now.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[20px] border-border shadow-none">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">Promotion candidates</CardTitle>
              </CardHeader>
              <CardContent>
                {context?.promotionCandidates.length ? (
                  <div className="space-y-3">
                    {context.promotionCandidates.slice(0, 4).map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-3"
                      >
                        <Link
                          className="text-sm font-semibold text-foreground hover:text-primary"
                          href={vehicle.adminPath}
                        >
                          {vehicle.title}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {vehicle.price !== null ? `${vehicle.price.toLocaleString()} PHP` : "Price missing"} · {vehicle.inquiryCount} inquiries
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={vehicle.adminPath}>Open vehicle</Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link href={vehicle.publicPath}>Public listing</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No promotion candidates have enough public listing data yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[20px] border-border shadow-none">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">Current snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between gap-3">
                  <span>Top lead source</span>
                  <span className="font-semibold text-foreground">
                    {summary?.topLeadSource ?? "No inquiries yet"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Facebook lead forms</span>
                  <span className="font-semibold text-foreground">
                    {summary?.totalFacebookLeadForms ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Brochures generated</span>
                  <span className="font-semibold text-foreground">
                    {summary?.totalBrochures ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Won inquiries</span>
                  <span className="font-semibold text-foreground">
                    {summary?.totalWonInquiries ?? 0}
                  </span>
                </div>
                <div className="pt-1">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/reports">Open reports</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
