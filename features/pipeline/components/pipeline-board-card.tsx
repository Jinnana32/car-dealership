import Link from "next/link";
import type { ReactElement } from "react";

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
import {
  formatCrmDate,
  getPaymentPreferenceLabel,
} from "@/features/inquiries/utils";
import { LOST_REASONS, LOST_REASON_LABELS } from "@/features/pipeline/constants";
import { FollowUpBadge } from "@/features/pipeline/components/follow-up-badge";
import {
  getNextPipelineStatus,
  getPreviousPipelineStatus,
} from "@/features/pipeline/utils";

type PipelineBoardCardProps = {
  canAssign: boolean;
  canManage: boolean;
  inquiry: InquiryListItem;
  memberOptions: DealershipMemberOption[];
  redirectPath: string;
};

export function PipelineBoardCard({
  canAssign,
  canManage,
  inquiry,
  memberOptions,
  redirectPath,
}: PipelineBoardCardProps): ReactElement {
  const previousStatus = canManage
    ? getPreviousPipelineStatus(inquiry.status)
    : null;
  const nextStatus = canManage ? getNextPipelineStatus(inquiry.status) : null;

  return (
    <div className="rounded-[18px] border border-border bg-white p-4">
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            {inquiry.customer?.full_name ?? "Customer unavailable"}
          </p>
          <p className="text-sm text-muted-foreground">
            {inquiry.vehicle?.title ?? "No vehicle linked"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <InquirySourceBadge sourceType={inquiry.source_type} />
          <FollowUpBadge
            bucket={inquiry.followUpBucket}
            value={inquiry.next_follow_up_at}
          />
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between gap-3">
            <span>Payment</span>
            <span className="font-medium text-foreground">
              {getPaymentPreferenceLabel(inquiry.payment_preference)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Budget</span>
            <span className="font-medium text-foreground">
              {inquiry.budget_range ?? "Not set"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Assigned</span>
            <span className="font-medium text-foreground">
              {inquiry.assignedToName ?? "Unassigned"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Created</span>
            <span className="font-medium text-foreground">
              {formatCrmDate(inquiry.created_at)}
            </span>
          </div>
        </div>

        {inquiry.lastNotePreview ? (
          <div className="rounded-2xl border border-border bg-[#fafaf9] px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Last note
            </p>
            <p className="mt-1 text-sm text-foreground">{inquiry.lastNotePreview}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/inquiries/${inquiry.id}`}>View details</Link>
          </Button>

          {canManage && previousStatus ? (
            <form action={moveInquiryToStage}>
              <input name="inquiry_id" type="hidden" value={inquiry.id} />
              <input name="redirect_to" type="hidden" value={redirectPath} />
              <input name="target_status" type="hidden" value={previousStatus} />
              <SubmitButton pendingLabel="Moving..." size="sm" type="submit" variant="outline">
                Previous
              </SubmitButton>
            </form>
          ) : null}

          {canManage && nextStatus ? (
            nextStatus === "won" ? (
              inquiry.vehicle ? (
                <Button asChild size="sm">
                  <Link href={`/admin/inquiries/${inquiry.id}`}>Record Sale</Link>
                </Button>
              ) : (
                <form action={markInquiryWon}>
                  <input name="confirm" type="hidden" value="won" />
                  <input name="inquiry_id" type="hidden" value={inquiry.id} />
                  <input name="redirect_to" type="hidden" value={redirectPath} />
                  <ConfirmSubmitButton
                    confirmMessage="Mark this inquiry as won?"
                    size="sm"
                    type="submit"
                  >
                    Mark Won
                  </ConfirmSubmitButton>
                </form>
              )
            ) : (
              <form action={moveInquiryToStage}>
                <input name="inquiry_id" type="hidden" value={inquiry.id} />
                <input name="redirect_to" type="hidden" value={redirectPath} />
                <input name="target_status" type="hidden" value={nextStatus} />
                <SubmitButton pendingLabel="Moving..." size="sm" type="submit">
                  Next stage
                </SubmitButton>
              </form>
            )
          ) : null}
        </div>

        {(canManage || canAssign) ? (
          <details className="rounded-2xl border border-border bg-[#fafaf9] px-3 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">
              Quick actions
            </summary>

            <div className="mt-4 space-y-4">
              {canAssign ? (
                <form action={assignInquiry} className="space-y-2">
                  <input name="inquiry_id" type="hidden" value={inquiry.id} />
                  <input name="redirect_to" type="hidden" value={redirectPath} />
                  <Label htmlFor={`${inquiry.id}-assigned_to`}>Assign</Label>
                  <div className="flex gap-2">
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
                    <SubmitButton pendingLabel="Saving..." size="sm" type="submit">
                      Save
                    </SubmitButton>
                  </div>
                </form>
              ) : null}

              {canManage ? (
                <>
                  <form action={setInquiryFollowUp} className="space-y-2">
                    <input name="inquiry_id" type="hidden" value={inquiry.id} />
                    <input name="redirect_to" type="hidden" value={redirectPath} />
                    <Label htmlFor={`${inquiry.id}-next_follow_up_at`}>
                      Next follow-up
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        defaultValue={inquiry.next_follow_up_at?.slice(0, 16) ?? ""}
                        id={`${inquiry.id}-next_follow_up_at`}
                        name="next_follow_up_at"
                        type="datetime-local"
                      />
                      <SubmitButton pendingLabel="Saving..." size="sm" type="submit">
                        Save
                      </SubmitButton>
                    </div>
                  </form>

                  <form action={addInquiryNote} className="space-y-2">
                    <input name="inquiry_id" type="hidden" value={inquiry.id} />
                    <input name="redirect_to" type="hidden" value={redirectPath} />
                    <Label htmlFor={`${inquiry.id}-note`}>Add note</Label>
                    <Textarea
                      id={`${inquiry.id}-note`}
                      name="note"
                      rows={3}
                    />
                    <SubmitButton pendingLabel="Saving..." size="sm" type="submit" variant="outline">
                      Save note
                    </SubmitButton>
                  </form>

                  {inquiry.status !== "won" && inquiry.status !== "lost" ? (
                    <form action={markInquiryLost} className="space-y-2">
                      <input name="inquiry_id" type="hidden" value={inquiry.id} />
                      <input name="redirect_to" type="hidden" value={redirectPath} />
                      <Label htmlFor={`${inquiry.id}-lost_reason`}>Mark lost</Label>
                      <Select
                        defaultValue=""
                        id={`${inquiry.id}-lost_reason`}
                        name="lost_reason"
                        required
                      >
                        <option value="" disabled>
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
                        placeholder="Add context if needed. Required when reason is Other."
                        rows={3}
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
          </details>
        ) : null}
      </div>
    </div>
  );
}
