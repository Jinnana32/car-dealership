import Link from "next/link";
import { UserRound } from "lucide-react";
import type { ReactElement } from "react";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { SubmitButton } from "@/components/forms/submit-button";
import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  addInquiryNote,
  assignInquiry,
  markInquiryLost,
  markInquiryWon,
  setInquiryFollowUp,
  updateInquiry,
  updateInquiryStatus,
} from "@/features/inquiries/actions";
import { InquirySourceBadge } from "@/features/inquiries/components/inquiry-source-badge";
import { InquiryStatusBadge } from "@/features/inquiries/components/inquiry-status-badge";
import type {
  DealershipMemberOption,
  InquiryRecord,
  VehicleOption,
} from "@/features/inquiries/types";
import {
  formatCrmDate,
  formatCrmDateTime,
  getInquiryStatusLabel,
  getPaymentPreferenceLabel,
} from "@/features/inquiries/utils";
import {
  ACTIVE_PIPELINE_STATUSES,
  LOST_REASONS,
  LOST_REASON_LABELS,
} from "@/features/pipeline/constants";
import { FollowUpBadge } from "@/features/pipeline/components/follow-up-badge";
import { VEHICLE_SALE_PAYMENT_TYPES } from "@/features/sales/constants";
import { recordVehicleSale } from "@/features/sales/actions";
import type { VehicleSaleRecord } from "@/features/sales/types";
import { getVehicleSalePaymentTypeLabel } from "@/features/sales/utils";
import { getFollowUpBucket, getInquiryEventLabel, getLostReasonLabel } from "@/features/pipeline/utils";
import type { Json } from "@/lib/supabase/database.types";

type InquiryDetailViewProps = {
  canAssignInquiries: boolean;
  canManageInquiry: boolean;
  canRecordSale: boolean;
  memberOptions: DealershipMemberOption[];
  record: InquiryRecord;
  saleRecord: VehicleSaleRecord | null;
  vehicleOptions: VehicleOption[];
};

function getMetadataValue(metadata: Json, key: string): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = metadata[key];

  return typeof value === "string" ? value : null;
}

export function InquiryDetailView({
  canAssignInquiries,
  canManageInquiry,
  canRecordSale,
  memberOptions,
  record,
  saleRecord,
  vehicleOptions,
}: InquiryDetailViewProps): ReactElement {
  const { customer, events, inquiry, vehicle } = record;
  const isTerminal = inquiry.status === "won" || inquiry.status === "lost";
  const followUpBucket = getFollowUpBucket(inquiry.next_follow_up_at);
  const canShowSaleForm =
    canRecordSale &&
    canManageInquiry &&
    inquiry.status !== "won" &&
    inquiry.status !== "lost" &&
    Boolean(vehicle) &&
    !saleRecord;
  const canShowMarkWonButton =
    canManageInquiry &&
    inquiry.status !== "won" &&
    inquiry.status !== "lost" &&
    !vehicle;

  return (
    <PageContent
      title={customer.full_name}
      description="Inquiry details"
      actions={
        <>
          <InquirySourceBadge sourceType={inquiry.source_type} />
          <InquiryStatusBadge status={inquiry.status} />
          <Button asChild variant="outline">
            <Link href={`/admin/customers/${customer.id}`}>View Customer</Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="space-y-6">
          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Inquiry details</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateInquiry} className="space-y-4">
                <input name="inquiry_id" type="hidden" value={inquiry.id} />
                <input name="redirect_to" type="hidden" value={`/admin/inquiries/${inquiry.id}`} />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_id">Interested vehicle</Label>
                    <Select
                      defaultValue={inquiry.vehicle_id ?? ""}
                      disabled={!canManageInquiry}
                      id="vehicle_id"
                      name="vehicle_id"
                    >
                      <option value="">No vehicle linked</option>
                      {vehicleOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_preference">Payment preference</Label>
                    <Select
                      defaultValue={inquiry.payment_preference ?? ""}
                      disabled={!canManageInquiry}
                      id="payment_preference"
                      name="payment_preference"
                    >
                      <option value="">Not set</option>
                      <option value="cash">Cash</option>
                      <option value="financing">Financing</option>
                      <option value="undecided">Undecided</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget_range">Budget range</Label>
                    <Input
                      defaultValue={inquiry.budget_range ?? ""}
                      disabled={!canManageInquiry}
                      id="budget_range"
                      name="budget_range"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source_detail">Source detail</Label>
                    <Input
                      defaultValue={inquiry.source_detail ?? ""}
                      disabled={!canManageInquiry}
                      id="source_detail"
                      name="source_detail"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="original_message">Original message</Label>
                    <Textarea
                      defaultValue={inquiry.original_message ?? ""}
                      disabled={!canManageInquiry}
                      id="original_message"
                      name="original_message"
                      rows={5}
                    />
                  </div>
                </div>

                {canManageInquiry ? (
                  <SubmitButton pendingLabel="Saving inquiry..." type="submit">
                    Save inquiry
                  </SubmitButton>
                ) : (
                  <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-3 text-sm text-muted-foreground">
                    Only owners, admins, or the assigned sales agent can update this inquiry.
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canManageInquiry ? (
                <form action={addInquiryNote} className="space-y-3">
                  <input name="inquiry_id" type="hidden" value={inquiry.id} />
                  <input name="redirect_to" type="hidden" value={`/admin/inquiries/${inquiry.id}`} />
                  <div className="space-y-2">
                    <Label htmlFor="note">Add note</Label>
                    <Textarea id="note" name="note" rows={4} />
                  </div>
                  <SubmitButton pendingLabel="Saving note..." type="submit">
                    Add note
                  </SubmitButton>
                </form>
              ) : null}

              {events.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-8 text-center">
                  <p className="text-sm font-medium text-foreground">
                    No inquiry history yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Notes and stage changes will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => {
                    const lostReason = getMetadataValue(event.metadata, "lost_reason");

                    return (
                      <div
                        key={event.id}
                        className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">
                              {getInquiryEventLabel(event.event_type)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {event.createdByName ?? "Team member"} ·{" "}
                              {formatCrmDateTime(event.created_at)}
                            </p>
                          </div>
                          {event.new_status ? (
                            <InquiryStatusBadge status={event.new_status as never} />
                          ) : null}
                        </div>
                        {lostReason ? (
                          <p className="mt-3 text-sm text-foreground">
                            Lost reason: {getLostReasonLabel(lostReason)}
                          </p>
                        ) : null}
                        {event.note ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">
                            {event.note}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{customer.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.phone ?? customer.email ?? "No contact info"}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Vehicle
                </p>
                <p className="text-sm font-medium text-foreground">
                  {vehicle?.title ?? "Not linked"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Payment preference
                </p>
                <p className="text-sm font-medium text-foreground">
                  {getPaymentPreferenceLabel(inquiry.payment_preference)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Pipeline stage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <InquiryStatusBadge status={inquiry.status} />
                <FollowUpBadge
                  bucket={followUpBucket}
                  value={inquiry.next_follow_up_at}
                />
              </div>

              {!isTerminal ? (
                <form action={updateInquiryStatus} className="space-y-2">
                  <input name="inquiry_id" type="hidden" value={inquiry.id} />
                  <input name="redirect_to" type="hidden" value={`/admin/inquiries/${inquiry.id}`} />
                  <Label htmlFor="status">Change stage</Label>
                  <div className="flex gap-2">
                    <Select
                      defaultValue={inquiry.status}
                      disabled={!canManageInquiry}
                      id="status"
                      name="status"
                    >
                      {ACTIVE_PIPELINE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {getInquiryStatusLabel(status)}
                        </option>
                      ))}
                    </Select>
                    {canManageInquiry ? (
                      <SubmitButton pendingLabel="Saving..." size="sm" type="submit">
                        Save
                      </SubmitButton>
                    ) : null}
                  </div>
                </form>
              ) : (
                <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-3 text-sm text-muted-foreground">
                  This inquiry is closed. Use the list or board workflow later if it needs to be reopened.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Assignment &amp; follow-up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <form action={assignInquiry} className="space-y-2">
                <input name="inquiry_id" type="hidden" value={inquiry.id} />
                <input name="redirect_to" type="hidden" value={`/admin/inquiries/${inquiry.id}`} />
                <Label htmlFor="assigned_to">Assigned sales agent</Label>
                <div className="flex gap-2">
                  <Select
                    defaultValue={inquiry.assigned_to ?? ""}
                    disabled={!canAssignInquiries}
                    id="assigned_to"
                    name="assigned_to"
                  >
                    <option value="">Unassigned</option>
                    {memberOptions.map((option) => (
                      <option key={option.profileId} value={option.profileId}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  {canAssignInquiries ? (
                    <SubmitButton pendingLabel="Saving..." size="sm" type="submit">
                      Save
                    </SubmitButton>
                  ) : null}
                </div>
              </form>

              <form action={setInquiryFollowUp} className="space-y-2">
                <input name="inquiry_id" type="hidden" value={inquiry.id} />
                <input name="redirect_to" type="hidden" value={`/admin/inquiries/${inquiry.id}`} />
                <Label htmlFor="next_follow_up_at">Next follow-up</Label>
                <div className="flex gap-2">
                  <Input
                    defaultValue={inquiry.next_follow_up_at?.slice(0, 16) ?? ""}
                    disabled={!canManageInquiry}
                    id="next_follow_up_at"
                    name="next_follow_up_at"
                    type="datetime-local"
                  />
                  {canManageInquiry ? (
                    <SubmitButton pendingLabel="Saving..." size="sm" type="submit">
                      Save
                    </SubmitButton>
                  ) : null}
                </div>
              </form>

              {!canAssignInquiries ? (
                <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-3 text-sm text-muted-foreground">
                  Only owners and admins can reassign inquiries.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Close inquiry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {saleRecord ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                  <p className="font-semibold">Sale recorded</p>
                  <p className="mt-1">
                    Sold for {saleRecord.sold_price.toLocaleString("en-PH", {
                      currency: "PHP",
                      style: "currency",
                    })} on {formatCrmDateTime(saleRecord.sold_at)}.
                  </p>
                  <p className="mt-1">
                    Payment type: {getVehicleSalePaymentTypeLabel(saleRecord.payment_type)}
                  </p>
                </div>
              ) : null}

              {inquiry.status === "won" ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  This inquiry is marked as won.
                </div>
              ) : null}

              {inquiry.status === "lost" ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Lost reason: {getLostReasonLabel(inquiry.lost_reason)}
                </div>
              ) : null}

              {canShowSaleForm ? (
                <form action={recordVehicleSale} className="space-y-4">
                  <input name="asking_price" type="hidden" value={vehicle?.price ?? ""} />
                  <input name="confirm" type="hidden" value="record_sale" />
                  <input name="customer_id" type="hidden" value={customer.id} />
                  <input name="inquiry_id" type="hidden" value={inquiry.id} />
                  <input name="redirect_to" type="hidden" value={`/admin/inquiries/${inquiry.id}`} />
                  <input name="vehicle_id" type="hidden" value={vehicle?.id ?? ""} />

                  <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4 text-sm text-foreground">
                    <p className="font-semibold">Mark as Won / Record Sale</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Vehicle
                        </p>
                        <p className="mt-1">{vehicle?.title ?? "Not linked"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Customer
                        </p>
                        <p className="mt-1">{customer.full_name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Inquiry
                        </p>
                        <p className="mt-1">{inquiry.id}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Asking price
                        </p>
                        <p className="mt-1">
                          {vehicle?.price?.toLocaleString("en-PH", {
                            currency: "PHP",
                            style: "currency",
                          }) ?? "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="sold_price">Sold price</Label>
                      <Input id="sold_price" name="sold_price" required type="number" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sold_at">Sold date</Label>
                      <Input
                        defaultValue={new Date().toISOString().slice(0, 16)}
                        id="sold_at"
                        name="sold_at"
                        required
                        type="datetime-local"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment_type">Payment type</Label>
                      <Select defaultValue="" id="payment_type" name="payment_type">
                        <option value="">Not set</option>
                        {VEHICLE_SALE_PAYMENT_TYPES.map((paymentType) => (
                          <option key={paymentType} value={paymentType}>
                            {getVehicleSalePaymentTypeLabel(paymentType)}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="sale_notes">Notes</Label>
                      <Textarea
                        id="sale_notes"
                        name="notes"
                        placeholder="Optional sale context"
                        rows={4}
                      />
                    </div>
                  </div>

                  <ConfirmSubmitButton
                    confirmMessage="Record this sale and mark the inquiry as won?"
                    type="submit"
                  >
                    Record Sale
                  </ConfirmSubmitButton>
                </form>
              ) : null}

              {canShowMarkWonButton ? (
                <form action={markInquiryWon}>
                  <input name="confirm" type="hidden" value="won" />
                  <input name="inquiry_id" type="hidden" value={inquiry.id} />
                  <input name="redirect_to" type="hidden" value={`/admin/inquiries/${inquiry.id}`} />
                  <ConfirmSubmitButton
                    confirmMessage="Mark this inquiry as won?"
                    type="submit"
                  >
                    Mark as won
                  </ConfirmSubmitButton>
                </form>
              ) : null}

              {canManageInquiry && inquiry.status !== "lost" ? (
                <form action={markInquiryLost} className="space-y-2">
                  <input name="inquiry_id" type="hidden" value={inquiry.id} />
                  <input name="redirect_to" type="hidden" value={`/admin/inquiries/${inquiry.id}`} />
                  <Label htmlFor="lost_reason">Lost reason</Label>
                  <Select defaultValue="" id="lost_reason" name="lost_reason" required>
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
                    id="lost_note"
                    name="note"
                    placeholder="Add context if needed. Required when reason is Other."
                    rows={4}
                  />
                  <ConfirmSubmitButton
                    confirmMessage="Mark this inquiry as lost?"
                    type="submit"
                    variant="outline"
                  >
                    Mark as lost
                  </ConfirmSubmitButton>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[20px] border-border shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["Created", formatCrmDateTime(inquiry.created_at)],
                ["Follow-up", formatCrmDate(inquiry.next_follow_up_at)],
                [
                  "Assigned",
                  memberOptions.find((item) => item.profileId === inquiry.assigned_to)?.label ??
                    "Unassigned",
                ],
                ["Source detail", inquiry.source_detail ?? "Not set"],
                ["Lost reason", getLostReasonLabel(inquiry.lost_reason)],
              ].map(([label, value]) => (
                <div key={label} className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-sm font-medium text-foreground">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContent>
  );
}
