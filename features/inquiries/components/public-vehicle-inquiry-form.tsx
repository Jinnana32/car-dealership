"use client";

import { useRef, useState, useTransition } from "react";
import type { FormEvent, ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PublicVehicleInquiryFormProps = {
  dealerSlug: string;
  vehicleSlug: string;
};

type PublicInquiryResponse = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success: boolean;
};

function getFieldError(
  fieldErrors: Record<string, string[] | undefined>,
  field: string,
): string | undefined {
  return fieldErrors[field]?.[0];
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

export function PublicVehicleInquiryForm({
  dealerSlug,
  vehicleSlug,
}: PublicVehicleInquiryFormProps): ReactElement {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const payload = {
      budget_range: String(formData.get("budget_range") ?? ""),
      company_website: String(formData.get("company_website") ?? ""),
      dealerSlug,
      email: String(formData.get("email") ?? ""),
      full_name: String(formData.get("full_name") ?? ""),
      message: String(formData.get("message") ?? ""),
      payment_preference: String(formData.get("payment_preference") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      preferred_viewing_date: String(
        formData.get("preferred_viewing_date") ?? "",
      ),
      vehicleSlug,
    };

    setFieldErrors({});
    setFormError(null);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/public-inquiry", {
            body: JSON.stringify(payload),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          });
          const result = (await response.json()) as PublicInquiryResponse;

          if (!response.ok || !result.success) {
            setFieldErrors(result.fieldErrors ?? {});
            setFormError(
              result.error ?? "Unable to send your inquiry right now.",
            );
            return;
          }

          setIsSuccess(true);
          formRef.current?.reset();
        } catch {
          setFormError("Unable to send your inquiry right now.");
        }
      })();
    });
  }

  return (
    <Card className="rounded-[28px] border-border bg-white shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
          Interested in this vehicle?
        </CardTitle>
        <CardDescription>
          Send your details and the dealership will contact you about this vehicle.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
            Thank you! The dealership has received your inquiry and will contact you soon.
          </div>
        ) : (
          <form
            ref={formRef}
            className="space-y-4"
            onSubmit={handleSubmit}
          >
            {formError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            ) : null}

            <div className="hidden">
              <Label htmlFor="company_website">Company website</Label>
              <Input
                autoComplete="off"
                id="company_website"
                name="company_website"
                tabIndex={-1}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  disabled={isPending}
                  id="full_name"
                  name="full_name"
                  required
                />
                <FieldError message={getFieldError(fieldErrors, "full_name")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  disabled={isPending}
                  id="phone"
                  name="phone"
                  required
                />
                <FieldError message={getFieldError(fieldErrors, "phone")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  disabled={isPending}
                  id="email"
                  name="email"
                  type="email"
                />
                <FieldError message={getFieldError(fieldErrors, "email")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_preference">Payment preference</Label>
                <Select
                  defaultValue=""
                  disabled={isPending}
                  id="payment_preference"
                  name="payment_preference"
                >
                  <option value="">Select one</option>
                  <option value="cash">Cash</option>
                  <option value="financing">Financing</option>
                  <option value="undecided">Undecided</option>
                </Select>
                <FieldError
                  message={getFieldError(fieldErrors, "payment_preference")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget_range">Budget range</Label>
                <Input
                  disabled={isPending}
                  id="budget_range"
                  name="budget_range"
                  placeholder="Example: PHP 500k to 700k"
                />
                <FieldError message={getFieldError(fieldErrors, "budget_range")} />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="preferred_viewing_date">
                  Preferred viewing date
                </Label>
                <Input
                  disabled={isPending}
                  id="preferred_viewing_date"
                  name="preferred_viewing_date"
                  type="datetime-local"
                />
                <FieldError
                  message={getFieldError(fieldErrors, "preferred_viewing_date")}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  disabled={isPending}
                  id="message"
                  name="message"
                  placeholder="Share any questions or preferred financing details."
                  rows={5}
                />
                <FieldError message={getFieldError(fieldErrors, "message")} />
              </div>
            </div>

            <Button className="w-full" disabled={isPending} size="lg" type="submit">
              {isPending ? "Sending inquiry..." : "Inquire About This Vehicle"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
