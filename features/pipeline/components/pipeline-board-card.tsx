"use client";

import { CalendarDays, Car, MoreHorizontal, Phone } from "lucide-react";
import type { KeyboardEvent, MouseEvent, ReactElement } from "react";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  addInquiryNote,
  assignInquiry,
  markInquiryLost,
  markInquiryWon,
  moveInquiryToStage,
  setInquiryFollowUp,
} from "@/features/inquiries/actions";
import { InquirySourceBadge } from "@/features/inquiries/components/inquiry-source-badge";
import type {
  DealershipMemberOption,
  InquiryListItem,
} from "@/features/inquiries/types";
import { formatCrmDate } from "@/features/inquiries/utils";
import { LOST_REASONS, LOST_REASON_LABELS } from "@/features/pipeline/constants";
import { FollowUpBadge } from "@/features/pipeline/components/follow-up-badge";
import { usePipelineInquiryPanel } from "@/features/pipeline/components/pipeline-inquiry-panel-provider";
import type { PipelineStageKey } from "@/features/pipeline/types";
import {
  getAssigneeInitials,
  getAssignedDisplayName,
  getNextPipelineStatus,
  getPipelineStageColors,
  getPreviousPipelineStatus,
} from "@/features/pipeline/utils";
import { formatVehicleCurrency } from "@/features/vehicles/utils";
import { cn } from "@/lib/utils";

type PipelineBoardCardProps = {
  canAssign: boolean;
  canManage: boolean;
  inquiry: InquiryListItem;
  memberOptions: DealershipMemberOption[];
  redirectPath: string;
  stageKey: PipelineStageKey;
};

function getFollowUpDisplayValue(inquiry: InquiryListItem): string {
  if (inquiry.next_follow_up_at) {
    return formatCrmDate(inquiry.next_follow_up_at);
  }

  return `Added ${formatCrmDate(inquiry.created_at)}`;
}

export function PipelineBoardCard({
  canAssign,
  canManage,
  inquiry,
  memberOptions,
  redirectPath,
  stageKey,
}: PipelineBoardCardProps): ReactElement {
  const { openInquiry } = usePipelineInquiryPanel();
  const previousStatus = canManage
    ? getPreviousPipelineStatus(inquiry.status)
    : null;
  const nextStatus = canManage ? getNextPipelineStatus(inquiry.status) : null;
  const showActionsMenu = canManage || canAssign;
  const stageColors = getPipelineStageColors(stageKey);
  const vehiclePrice = inquiry.vehicle?.price ?? null;
  const customerPhone = inquiry.customer?.phone?.trim();

  function handleCardActivate(): void {
    openInquiry(inquiry.id);
  }

  function stopCardActivation(event: MouseEvent | KeyboardEvent): void {
    event.stopPropagation();
  }

  return (
    <article
      className="min-w-0 cursor-pointer overflow-hidden rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md hover:ring-primary/20"
      onClick={handleCardActivate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardActivate();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {inquiry.customer?.full_name ?? "Customer unavailable"}
          </p>
        </div>

        <div
          className="flex shrink-0 items-start gap-1"
          onClick={stopCardActivation}
          onKeyDown={stopCardActivation}
        >
          {vehiclePrice !== null ? (
            <span
              className={cn(
                "max-w-[7.5rem] truncate rounded-lg px-1.5 py-0.5 text-[11px] font-semibold leading-tight",
                stageColors.priceBadge,
              )}
              title={formatVehicleCurrency(vehiclePrice)}
            >
              {formatVehicleCurrency(vehiclePrice)}
            </span>
          ) : null}

          {showActionsMenu ? (
            <details className="relative">
              <summary className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-lg text-muted-foreground hover:bg-zinc-100 [&::-webkit-details-marker]:hidden">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Card actions</span>
              </summary>
              <div className="absolute right-0 z-10 mt-1 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border bg-white p-3 shadow-lg">
                <div className="space-y-3">
                  {canManage && previousStatus ? (
                    <form action={moveInquiryToStage}>
                      <input name="inquiry_id" type="hidden" value={inquiry.id} />
                      <input name="redirect_to" type="hidden" value={redirectPath} />
                      <input name="target_status" type="hidden" value={previousStatus} />
                      <SubmitButton
                        className="w-full justify-start"
                        pendingLabel="Moving..."
                        size="sm"
                        type="submit"
                        variant="ghost"
                      >
                        Move to previous stage
                      </SubmitButton>
                    </form>
                  ) : null}

                  {canManage && nextStatus ? (
                    nextStatus === "won" ? (
                      inquiry.vehicle ? (
                        <Button
                          className="w-full justify-start"
                          onClick={() => openInquiry(inquiry.id)}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          Record sale
                        </Button>
                      ) : (
                        <form action={markInquiryWon}>
                          <input name="confirm" type="hidden" value="won" />
                          <input name="inquiry_id" type="hidden" value={inquiry.id} />
                          <input name="redirect_to" type="hidden" value={redirectPath} />
                          <ConfirmSubmitButton
                            className="w-full justify-start"
                            confirmMessage="Mark this inquiry as won?"
                            size="sm"
                            type="submit"
                            variant="ghost"
                          >
                            Mark won
                          </ConfirmSubmitButton>
                        </form>
                      )
                    ) : (
                      <form action={moveInquiryToStage}>
                        <input name="inquiry_id" type="hidden" value={inquiry.id} />
                        <input name="redirect_to" type="hidden" value={redirectPath} />
                        <input name="target_status" type="hidden" value={nextStatus} />
                        <SubmitButton
                          className="w-full justify-start"
                          pendingLabel="Moving..."
                          size="sm"
                          type="submit"
                          variant="ghost"
                        >
                          Move to next stage
                        </SubmitButton>
                      </form>
                    )
                  ) : null}

                  {canAssign ? (
                    <form action={assignInquiry} className="space-y-2 border-t border-border pt-3">
                      <input name="inquiry_id" type="hidden" value={inquiry.id} />
                      <input name="redirect_to" type="hidden" value={redirectPath} />
                      <Label htmlFor={`${inquiry.id}-assigned_to`}>Assign</Label>
                      <Select
                        defaultValue={inquiry.assigned_to ?? ""}
                        id={`${inquiry.id}-assigned_to`}
                        name="assigned_to"
                      >
                        <option value="">Unassigned</option>
                        {memberOptions.map((option) => (
                          <option key={option.profileId} value={option.profileId}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                      <SubmitButton pendingLabel="Saving..." size="sm" type="submit" variant="outline">
                        Save assignment
                      </SubmitButton>
                    </form>
                  ) : null}

                  {canManage ? (
                    <>
                      <form
                        action={setInquiryFollowUp}
                        className="space-y-2 border-t border-border pt-3"
                      >
                        <input name="inquiry_id" type="hidden" value={inquiry.id} />
                        <input name="redirect_to" type="hidden" value={redirectPath} />
                        <Label htmlFor={`${inquiry.id}-next_follow_up_at`}>Next follow-up</Label>
                        <Input
                          defaultValue={inquiry.next_follow_up_at?.slice(0, 16) ?? ""}
                          id={`${inquiry.id}-next_follow_up_at`}
                          name="next_follow_up_at"
                          type="datetime-local"
                        />
                        <SubmitButton pendingLabel="Saving..." size="sm" type="submit" variant="outline">
                          Save follow-up
                        </SubmitButton>
                      </form>

                      <form action={addInquiryNote} className="space-y-2 border-t border-border pt-3">
                        <input name="inquiry_id" type="hidden" value={inquiry.id} />
                        <input name="redirect_to" type="hidden" value={redirectPath} />
                        <Label htmlFor={`${inquiry.id}-note`}>Add note</Label>
                        <Textarea id={`${inquiry.id}-note`} name="note" rows={2} />
                        <SubmitButton pendingLabel="Saving..." size="sm" type="submit" variant="outline">
                          Save note
                        </SubmitButton>
                      </form>

                      {inquiry.status !== "won" && inquiry.status !== "lost" ? (
                        <form action={markInquiryLost} className="space-y-2 border-t border-border pt-3">
                          <input name="inquiry_id" type="hidden" value={inquiry.id} />
                          <input name="redirect_to" type="hidden" value={redirectPath} />
                          <Label htmlFor={`${inquiry.id}-lost_reason`}>Mark lost</Label>
                          <Select
                            defaultValue=""
                            id={`${inquiry.id}-lost_reason`}
                            name="lost_reason"
                            required
                          >
                            <option disabled value="">
                              Select a reason
                            </option>
                            {LOST_REASONS.map((reason) => (
                              <option key={reason} value={reason}>
                                {LOST_REASON_LABELS[reason]}
                              </option>
                            ))}
                          </Select>
                          <Textarea
                            id={`${inquiry.id}-lost-note`}
                            name="note"
                            placeholder="Required when reason is Other."
                            rows={2}
                          />
                          <ConfirmSubmitButton
                            confirmMessage="Mark this inquiry as lost?"
                            size="sm"
                            type="submit"
                            variant="outline"
                          >
                            Mark lost
                          </ConfirmSubmitButton>
                        </form>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            </details>
          ) : null}
        </div>
      </div>

      <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Car className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{inquiry.vehicle?.title ?? "No vehicle linked"}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{getFollowUpDisplayValue(inquiry)}</span>
          </div>

          {customerPhone ? (
            <a
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-zinc-100 hover:text-foreground"
              href={`tel:${customerPhone}`}
              onClick={stopCardActivation}
              title={`Call ${customerPhone}`}
            >
              <Phone className="h-3.5 w-3.5" />
              <span className="sr-only">Call customer</span>
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-1">
          <InquirySourceBadge sourceType={inquiry.source_type} />
          <FollowUpBadge
            bucket={inquiry.followUpBucket}
            compact
            value={inquiry.next_follow_up_at}
          />
        </div>

        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white"
          title={getAssignedDisplayName(inquiry.assignedToName)}
        >
          {getAssigneeInitials(inquiry.assignedToName)}
        </div>
      </div>
    </article>
  );
}
