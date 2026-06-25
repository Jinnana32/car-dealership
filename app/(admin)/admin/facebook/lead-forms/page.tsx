import Link from "next/link";
import type { ReactElement } from "react";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { SubmitButton } from "@/components/forms/submit-button";
import { PageContent } from "@/components/layout/page-content";
import { UnauthorizedState } from "@/components/layout/unauthorized-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusToast } from "@/components/ui/status-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  deactivateFacebookLeadFormMapping,
  upsertFacebookLeadFormMapping,
} from "@/features/facebook/leadgen-actions";
import { getFacebookLeadFormMappings } from "@/features/facebook/leadgen-queries";
import { DEFAULT_FACEBOOK_LEAD_FIELD_MAP } from "@/features/facebook/constants";
import { formatCrmDateTime } from "@/features/inquiries/utils";
import {
  canManageFacebookSettings,
} from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

type FacebookLeadFormsPageProps = {
  searchParams: Promise<{
    edit?: string | string[];
    error?: string | string[];
    success?: string | string[];
  }>;
};

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatFieldMapJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function getFieldMapPreview(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "No field mapping configured.";
  }

  const lines = Object.entries(value)
    .map(([key, aliases]) => {
      if (!Array.isArray(aliases)) {
        return null;
      }

      const aliasValues = aliases
        .filter((alias): alias is string => typeof alias === "string")
        .join(", ");

      return aliasValues ? `${key}: ${aliasValues}` : null;
    })
    .filter((line): line is string => Boolean(line));

  return lines.length > 0 ? lines.join(" · ") : "No field mapping configured.";
}

export default async function FacebookLeadFormsPage({
  searchParams,
}: FacebookLeadFormsPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  if (!canManageFacebookSettings(access.membership.role)) {
    return (
      <UnauthorizedState
        title="Lead form mapping access denied"
        description="Only owners and admins can configure Facebook Lead Form mappings."
      />
    );
  }

  const resolvedSearchParams = await searchParams;
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const result = await getFacebookLeadFormMappings(access, resolvedSearchParams);
  const editingMapping = result.editingMapping;

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Facebook Lead Form Mappings"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/facebook">Back to Hub</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/facebook/leads">Imported Leads</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/facebook/settings">Facebook Settings</Link>
            </Button>
          </>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="rounded-[20px] border border-border bg-white p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                {editingMapping ? "Edit mapping" : "Add mapping"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Manually connect a Facebook Lead Form to a vehicle and field aliases for this dealership.
              </p>
            </div>

            <form action={upsertFacebookLeadFormMapping} className="mt-6 space-y-4">
              <input
                name="mapping_id"
                type="hidden"
                value={editingMapping?.id ?? ""}
              />
              <input
                name="redirect_to"
                type="hidden"
                value="/admin/facebook/lead-forms"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="form_id">
                    Form ID
                  </label>
                  <Input
                    defaultValue={editingMapping?.form_id ?? ""}
                    id="form_id"
                    name="form_id"
                    placeholder="123456789012345"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="form_name">
                    Form name
                  </label>
                  <Input
                    defaultValue={editingMapping?.form_name ?? ""}
                    id="form_name"
                    name="form_name"
                    placeholder="Toyota Vios Lead Form"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="vehicle_id">
                    Linked vehicle
                  </label>
                  <Select
                    defaultValue={editingMapping?.vehicle_id ?? ""}
                    id="vehicle_id"
                    name="vehicle_id"
                  >
                    <option value="">No linked vehicle</option>
                    {result.vehicleOptions.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="is_active">
                    Status
                  </label>
                  <Select
                    defaultValue={editingMapping?.is_active === false ? "false" : "true"}
                    id="is_active"
                    name="is_active"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="field_map_json"
                >
                  Field mapping JSON
                </label>
                <Textarea
                  className="min-h-[220px] font-mono text-xs"
                  defaultValue={formatFieldMapJson(
                    editingMapping?.field_map ?? DEFAULT_FACEBOOK_LEAD_FIELD_MAP,
                  )}
                  id="field_map_json"
                  name="field_map_json"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <SubmitButton pendingLabel="Saving..." type="submit">
                  {editingMapping ? "Save Changes" : "Add Mapping"}
                </SubmitButton>
                {editingMapping ? (
                  <Button asChild type="button" variant="ghost">
                    <Link href="/admin/facebook/lead-forms">Cancel</Link>
                  </Button>
                ) : null}
              </div>
            </form>
          </div>

          <div className="rounded-[20px] border border-border bg-white p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                Mapping guide
              </h2>
              <p className="text-sm text-muted-foreground">
                Use aliases that match the field names configured in the Facebook Lead Form. Unknown fields stay in the raw lead record for review later.
              </p>
            </div>

            <div className="mt-6 space-y-4 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4">
                <p className="font-medium text-foreground">Recommended keys</p>
                <p className="mt-2">
                  `full_name`, `phone`, `email`, `budget_range`, `payment_preference`, `message`
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-4">
                <p className="font-medium text-foreground">Vehicle linking</p>
                <p className="mt-2">
                  Link the form directly to a vehicle when the ad is for one specific unit. If left empty, the importer only links a vehicle when the form name safely matches an existing stock number, slug, or title.
                </p>
              </div>
            </div>
          </div>
        </div>

        {result.mappings.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-border bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">
              No lead form mappings yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add the first mapping above to connect a Facebook Lead Form to a vehicle or custom field aliases.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-[20px] border border-border bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Form</TableHead>
                    <TableHead>Linked Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Field Mapping Preview</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.mappings.map((mapping) => (
                    <TableRow key={mapping.id}>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {mapping.form_name || "Unnamed form"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {mapping.form_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        {mapping.vehicle ? (
                          <Link
                            className="font-medium text-primary hover:underline"
                            href={`/admin/vehicles/${mapping.vehicle.id}`}
                          >
                            {mapping.vehicle.title}
                          </Link>
                        ) : (
                          "Not linked"
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
                          {mapping.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[420px] align-top text-sm text-muted-foreground">
                        {getFieldMapPreview(mapping.field_map)}
                      </TableCell>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        {formatCrmDateTime(mapping.updated_at)}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/facebook/lead-forms?edit=${mapping.id}`}>
                              Edit
                            </Link>
                          </Button>
                          {mapping.is_active ? (
                            <form action={deactivateFacebookLeadFormMapping}>
                              <input name="mapping_id" type="hidden" value={mapping.id} />
                              <input
                                name="redirect_to"
                                type="hidden"
                                value="/admin/facebook/lead-forms"
                              />
                              <ConfirmSubmitButton
                                confirmMessage="Deactivate this lead form mapping?"
                                pendingLabel="Saving..."
                                size="sm"
                                type="submit"
                                variant="outline"
                              >
                                Deactivate
                              </ConfirmSubmitButton>
                            </form>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="px-1 text-sm text-muted-foreground">
              Showing {result.mappings.length} of {result.totalCount}
            </div>
          </>
        )}
      </PageContent>
    </>
  );
}
