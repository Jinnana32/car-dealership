import type { ReactElement } from "react";

import { PageContent } from "@/components/layout/page-content";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateDealershipSettingsAction,
  updateProfileAction,
} from "@/lib/auth/actions";
import { canManageDealership, getRoleLabel } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";
import { serializeTextList } from "@/features/vehicles/pricing";

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
};

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const dealershipCanBeManaged = canManageDealership(access.membership.role);

  return (
    <PageContent
      title="Settings"
      actions={
        <Badge
          variant="outline"
          className="rounded-full border-border bg-white px-3 py-1 text-xs font-semibold"
        >
          {getRoleLabel(access.membership.role)}
        </Badge>
      }
      tabs={
        <>
          <Button size="sm" type="button">
            Dealership Profile
          </Button>
          <Button disabled size="sm" type="button" variant="outline">
            Users &amp; Roles
          </Button>
          <Button disabled size="sm" type="button" variant="outline">
            Integrations
          </Button>
        </>
      }
    >
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="rounded-[20px] border-border shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Your profile</CardTitle>
            <p className="text-sm text-muted-foreground">
              Update the details shown across the admin panel.
            </p>
          </CardHeader>
          <CardContent>
            <form action={updateProfileAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={access.profile.full_name ?? ""}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={access.user.email ?? ""}
                  disabled
                  aria-disabled="true"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  name="avatar_url"
                  defaultValue={access.profile.avatar_url ?? ""}
                  placeholder="https://example.com/avatar.png"
                />
              </div>

              <SubmitButton type="submit" pendingLabel="Saving profile...">
                Save profile
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[20px] border-border shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Dealership profile</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage how the dealership appears across the admin workspace.
            </p>
          </CardHeader>
          <CardContent>
            <form action={updateDealershipSettingsAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Dealership name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={access.dealership.name}
                    disabled={!dealershipCanBeManaged}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    defaultValue={access.dealership.slug}
                    disabled={!dealershipCanBeManaged}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact phone</Label>
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    defaultValue={access.dealership.contact_phone ?? ""}
                    disabled={!dealershipCanBeManaged}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact email</Label>
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    defaultValue={access.dealership.contact_email ?? ""}
                    disabled={!dealershipCanBeManaged}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook_page_url">Facebook page URL</Label>
                  <Input
                    id="facebook_page_url"
                    name="facebook_page_url"
                    defaultValue={access.dealership.facebook_page_url ?? ""}
                    disabled={!dealershipCanBeManaged}
                    placeholder="https://facebook.com/your-page"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    name="logo_url"
                    defaultValue={access.dealership.logo_url ?? ""}
                    disabled={!dealershipCanBeManaged}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-border bg-[#fafaf9] p-4">
                <p className="text-sm font-semibold text-foreground">
                  Facebook post defaults
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="default_post_location_tag">Default location tag</Label>
                    <Input
                      id="default_post_location_tag"
                      name="default_post_location_tag"
                      defaultValue={access.dealership.default_post_location_tag ?? ""}
                      disabled={!dealershipCanBeManaged}
                      placeholder="Iloilo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default_financing_headline">Default financing headline</Label>
                    <Input
                      id="default_financing_headline"
                      name="default_financing_headline"
                      defaultValue={access.dealership.default_financing_headline ?? ""}
                      disabled={!dealershipCanBeManaged}
                      placeholder="FINANCING OPTION — ALL IN!"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="default_sale_inclusions">Default sale inclusions</Label>
                    <textarea
                      className="min-h-32 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm"
                      defaultValue={serializeTextList(access.dealership.default_sale_inclusions)}
                      disabled={!dealershipCanBeManaged}
                      id="default_sale_inclusions"
                      name="default_sale_inclusions"
                      placeholder={"LTO & HPG Verified\n3 Months Service Warranty"}
                    />
                  </div>
                </div>
              </div>

              {dealershipCanBeManaged ? (
                <SubmitButton type="submit" pendingLabel="Saving dealership...">
                  Save dealership profile
                </SubmitButton>
              ) : (
                <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-3 text-sm text-muted-foreground">
                  Only owners and admins can edit dealership details.
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContent>
  );
}
