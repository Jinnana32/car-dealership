"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ReactElement } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createManualLead } from "@/features/inquiries/actions";
import {
  INQUIRY_STATUSES,
  MANUAL_LEAD_SOURCE_TYPES,
  PAYMENT_PREFERENCES,
} from "@/features/inquiries/constants";
import type {
  DealershipMemberOption,
  ManualLeadFormState,
  VehicleOption,
} from "@/features/inquiries/types";
import {
  getInquirySourceLabel,
  getInquiryStatusLabel,
  getPaymentPreferenceLabel,
} from "@/features/inquiries/utils";

type ManualLeadFormProps = {
  memberOptions: DealershipMemberOption[];
  preselectedCustomer?: {
    email: string | null;
    full_name: string;
    id: string;
    phone: string | null;
  } | null;
  vehicleOptions: VehicleOption[];
};

const initialState: ManualLeadFormState = {
  fieldErrors: {},
};

function getManualLeadFormValues(
  state: ManualLeadFormState,
  preselectedCustomer?: {
    email: string | null;
    full_name: string;
    id: string;
    phone: string | null;
  } | null,
) {
  return {
    assigned_to: state.values?.assigned_to ?? "",
    budget_range: state.values?.budget_range ?? "",
    customer_name: state.values?.customer_name ?? preselectedCustomer?.full_name ?? "",
    duplicate_resolution: state.values?.duplicate_resolution ?? "",
    email: state.values?.email ?? preselectedCustomer?.email ?? "",
    existing_customer_id: state.values?.existing_customer_id ?? preselectedCustomer?.id ?? "",
    interested_vehicle_id: state.values?.interested_vehicle_id ?? "",
    message: state.values?.message ?? "",
    next_follow_up_at: state.values?.next_follow_up_at ?? "",
    payment_preference: state.values?.payment_preference ?? "",
    phone: state.values?.phone ?? preselectedCustomer?.phone ?? "",
    source_detail: state.values?.source_detail ?? "",
    source_type: state.values?.source_type ?? "manual_entry",
    status: state.values?.status ?? "new",
  };
}

function getSummaryMessages(state: ManualLeadFormState): string[] {
  if (state.formErrors && state.formErrors.length > 0) {
    return state.formErrors;
  }

  return Array.from(
    new Set(
      Object.values(state.fieldErrors ?? {})
        .flat()
        .filter((message): message is string => Boolean(message)),
    ),
  );
}

function getFieldError(
  state: ManualLeadFormState,
  field: string,
): string | undefined {
  return state.fieldErrors?.[field]?.[0];
}

function FieldError({
  message,
}: {
  message: string | undefined;
}): ReactElement | null {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-600">{message}</p>;
}

export function ManualLeadForm({
  memberOptions,
  preselectedCustomer,
  vehicleOptions,
}: ManualLeadFormProps): ReactElement {
  const [state, formAction] = useActionState(createManualLead, initialState);
  const values = getManualLeadFormValues(state, preselectedCustomer);
  const formKey = JSON.stringify(values);
  const hasDuplicateMatches = Boolean(state.duplicates && state.duplicates.length > 0);
  const summaryMessages = getSummaryMessages(state);

  return (
    <form action={formAction} className="space-y-6" key={formKey}>
      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{state.error}</p>
          {summaryMessages.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {summaryMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {preselectedCustomer ? (
        <>
          <input
            name="customer_name"
            type="hidden"
            value={values.customer_name}
          />
          <input
            name="email"
            type="hidden"
            value={values.email}
          />
          <input
            name="phone"
            type="hidden"
            value={values.phone}
          />
          <input
            name="existing_customer_id"
            type="hidden"
            value={values.existing_customer_id}
          />
        </>
      ) : null}

      <Card className="rounded-[20px] border-border shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Customer</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {preselectedCustomer ? (
            <div className="md:col-span-2 rounded-2xl border border-border bg-[#fafaf9] px-4 py-4">
              <p className="text-sm font-semibold text-foreground">
                Using existing customer
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {preselectedCustomer.full_name}
                {preselectedCustomer.phone ? ` · ${preselectedCustomer.phone}` : ""}
                {preselectedCustomer.email ? ` · ${preselectedCustomer.email}` : ""}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customer_name">Customer name</Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  defaultValue={values.customer_name}
                  required
                />
                <FieldError message={getFieldError(state, "customer_name")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={values.phone}
                />
                <FieldError message={getFieldError(state, "phone")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={values.email}
                />
                <FieldError message={getFieldError(state, "email")} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {hasDuplicateMatches ? (
        <Card className="rounded-[20px] border-red-200 bg-red-50 shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg text-red-700">
              Possible existing customer found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {state.duplicates?.map((duplicate) => (
                <label
                  key={duplicate.id}
                  className="flex items-start gap-3 rounded-2xl border border-red-200 bg-white px-4 py-3"
                >
                  <input
                    defaultChecked={values.existing_customer_id === duplicate.id}
                    name="existing_customer_id"
                    type="radio"
                    value={duplicate.id}
                  />
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-foreground">
                      {duplicate.full_name}
                    </p>
                    <p className="text-muted-foreground">
                      {duplicate.phone ?? "No phone"} · {duplicate.email ?? "No email"}
                    </p>
                    <p className="text-muted-foreground">
                      {duplicate.inquiryCount} existing inquiries
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <FieldError message={getFieldError(state, "existing_customer_id")} />

            <div className="flex flex-wrap gap-2">
              <SubmitButton
                name="duplicate_resolution"
                pendingLabel="Saving lead..."
                size="sm"
                type="submit"
                value="use_existing"
              >
                Use Existing Customer
              </SubmitButton>
              <SubmitButton
                name="duplicate_resolution"
                pendingLabel="Saving lead..."
                size="sm"
                type="submit"
                value="create_new"
                variant="outline"
              >
                Create New Customer Anyway
              </SubmitButton>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-[20px] border-border shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Inquiry</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="interested_vehicle_id">Interested vehicle</Label>
            <Select
              id="interested_vehicle_id"
              name="interested_vehicle_id"
              defaultValue={values.interested_vehicle_id}
            >
              <option value="">No vehicle linked</option>
              {vehicleOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError message={getFieldError(state, "interested_vehicle_id")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_type">Source</Label>
            <Select
              id="source_type"
              name="source_type"
              defaultValue={values.source_type}
            >
              {MANUAL_LEAD_SOURCE_TYPES.map((sourceType) => (
                <option key={sourceType} value={sourceType}>
                  {getInquirySourceLabel(sourceType)}
                </option>
              ))}
            </Select>
            <FieldError message={getFieldError(state, "source_type")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              name="status"
              defaultValue={values.status}
            >
              {INQUIRY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getInquiryStatusLabel(status)}
                </option>
              ))}
            </Select>
            <FieldError message={getFieldError(state, "status")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assigned to</Label>
            <Select
              id="assigned_to"
              name="assigned_to"
              defaultValue={values.assigned_to}
            >
              <option value="">Unassigned</option>
              {memberOptions.map((option) => (
                <option key={option.profileId} value={option.profileId}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError message={getFieldError(state, "assigned_to")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_preference">Payment preference</Label>
            <Select
              id="payment_preference"
              name="payment_preference"
              defaultValue={values.payment_preference}
            >
              <option value="">Not set</option>
              {PAYMENT_PREFERENCES.map((preference) => (
                <option key={preference} value={preference}>
                  {getPaymentPreferenceLabel(preference)}
                </option>
              ))}
            </Select>
            <FieldError message={getFieldError(state, "payment_preference")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget_range">Budget range</Label>
            <Input
              id="budget_range"
              name="budget_range"
              defaultValue={values.budget_range}
            />
            <FieldError message={getFieldError(state, "budget_range")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="source_detail">Source detail</Label>
            <Input
              id="source_detail"
              name="source_detail"
              defaultValue={values.source_detail}
              placeholder="Example: showroom walk-in, referral from past customer"
            />
            <FieldError message={getFieldError(state, "source_detail")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="next_follow_up_at">Next follow-up</Label>
            <Input
              id="next_follow_up_at"
              name="next_follow_up_at"
              type="datetime-local"
              defaultValue={values.next_follow_up_at}
            />
            <FieldError message={getFieldError(state, "next_follow_up_at")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="message">Message or notes</Label>
            <Textarea
              id="message"
              name="message"
              defaultValue={values.message}
              rows={6}
            />
            <FieldError message={getFieldError(state, "message")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton pendingLabel="Creating lead..." type="submit">
          Create lead
        </SubmitButton>
        <Button asChild type="button" variant="outline">
          <Link href="/admin/inquiries">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
