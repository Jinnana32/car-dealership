"use client";

import { useActionState } from "react";
import type { ReactElement } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { convertMessengerConversationToInquiry } from "@/features/facebook/messenger-actions";
import type {
  FacebookMessengerConversationRecord,
  MessengerConversationConversionFormState,
} from "@/features/facebook/types";
import {
  PAYMENT_PREFERENCES,
} from "@/features/inquiries/constants";
import type {
  DealershipMemberOption,
  VehicleOption,
} from "@/features/inquiries/types";
import {
  getInquiryStatusLabel,
  getPaymentPreferenceLabel,
} from "@/features/inquiries/utils";

type MessengerConversionFormProps = {
  canConvert: boolean;
  conversation: FacebookMessengerConversationRecord;
  memberOptions: DealershipMemberOption[];
  redirectPath: string;
  vehicleOptions: VehicleOption[];
};

const initialState: MessengerConversationConversionFormState = {
  fieldErrors: {},
};

function getFieldError(
  state: MessengerConversationConversionFormState,
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

export function MessengerConversionForm({
  canConvert,
  conversation,
  memberOptions,
  redirectPath,
  vehicleOptions,
}: MessengerConversionFormProps): ReactElement {
  const [state, formAction] = useActionState(
    convertMessengerConversationToInquiry,
    initialState,
  );
  const values = state.values;
  const hasDuplicateMatches = Boolean(state.duplicates?.length);
  const prefilledVehicleId =
    values?.interested_vehicle_id ?? conversation.vehicle_id ?? "";
  const prefilledMessage =
    values?.message ??
    conversation.last_message ??
    conversation.last_message_preview ??
    "";
  const prefilledCustomerName =
    values?.customer_name ??
    conversation.linkedCustomer?.full_name ??
    "";
  const prefilledEmail = values?.email ?? conversation.linkedCustomer?.email ?? "";
  const prefilledPhone = values?.phone ?? conversation.linkedCustomer?.phone ?? "";
  const isConverted = conversation.status === "converted" && Boolean(conversation.inquiry_id);

  return (
    <form action={formAction} className="space-y-6">
      <input name="conversation_id" type="hidden" value={conversation.id} />
      <input name="redirect_to" type="hidden" value={redirectPath} />

      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <Card className="rounded-[20px] border-border shadow-none" id="convert">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Convert to Lead</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="customer_name">Customer name</Label>
            <Input
              defaultValue={prefilledCustomerName}
              disabled={!canConvert || isConverted}
              id="customer_name"
              name="customer_name"
              required
            />
            <FieldError message={getFieldError(state, "customer_name")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              defaultValue={prefilledPhone}
              disabled={!canConvert || isConverted}
              id="phone"
              name="phone"
            />
            <FieldError message={getFieldError(state, "phone")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              defaultValue={prefilledEmail}
              disabled={!canConvert || isConverted}
              id="email"
              name="email"
              type="email"
            />
            <FieldError message={getFieldError(state, "email")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interested_vehicle_id">Interested vehicle</Label>
            <Select
              defaultValue={prefilledVehicleId}
              disabled={!canConvert || isConverted}
              id="interested_vehicle_id"
              name="interested_vehicle_id"
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
            <Label htmlFor="status">Inquiry status</Label>
            <Select
              defaultValue="new"
              disabled={!canConvert || isConverted}
              id="status"
              name="status"
            >
              <option value="new">{getInquiryStatusLabel("new")}</option>
            </Select>
            <FieldError message={getFieldError(state, "status")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assigned to</Label>
            <Select
              defaultValue={values?.assigned_to ?? ""}
              disabled={!canConvert || isConverted}
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
            <FieldError message={getFieldError(state, "assigned_to")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_preference">Payment preference</Label>
            <Select
              defaultValue={values?.payment_preference ?? ""}
              disabled={!canConvert || isConverted}
              id="payment_preference"
              name="payment_preference"
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
              defaultValue={values?.budget_range ?? ""}
              disabled={!canConvert || isConverted}
              id="budget_range"
              name="budget_range"
            />
            <FieldError message={getFieldError(state, "budget_range")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="source_detail">Source detail</Label>
            <Input
              defaultValue={values?.source_detail ?? "Facebook Messenger"}
              disabled={!canConvert || isConverted}
              id="source_detail"
              name="source_detail"
            />
            <FieldError message={getFieldError(state, "source_detail")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="next_follow_up_at">Next follow-up</Label>
            <Input
              defaultValue={values?.next_follow_up_at ?? ""}
              disabled={!canConvert || isConverted}
              id="next_follow_up_at"
              name="next_follow_up_at"
              type="datetime-local"
            />
            <FieldError message={getFieldError(state, "next_follow_up_at")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="message">Message or notes</Label>
            <Textarea
              defaultValue={prefilledMessage}
              disabled={!canConvert || isConverted}
              id="message"
              name="message"
              rows={6}
            />
            <FieldError message={getFieldError(state, "message")} />
          </div>
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
                    defaultChecked={values?.existing_customer_id === duplicate.id}
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
                disabled={!canConvert || isConverted}
                name="duplicate_resolution"
                pendingLabel="Converting..."
                size="sm"
                type="submit"
                value="use_existing"
              >
                Use Existing Customer
              </SubmitButton>
              <SubmitButton
                disabled={!canConvert || isConverted}
                name="duplicate_resolution"
                pendingLabel="Converting..."
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

      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton
          disabled={!canConvert || isConverted}
          pendingLabel="Converting..."
          type="submit"
        >
          Convert to Lead
        </SubmitButton>
      </div>
    </form>
  );
}
