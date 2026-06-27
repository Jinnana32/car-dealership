import Link from "next/link";
import type { ReactElement } from "react";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { SubmitButton } from "@/components/forms/submit-button";
import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusToast } from "@/components/ui/status-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  clearFacebookConnection,
  upsertFacebookConnection,
} from "@/features/facebook/actions";
import { FacebookConnectionStatusBadge } from "@/features/facebook/components/facebook-connection-status-badge";
import { FACEBOOK_CONNECTION_STATUSES } from "@/features/facebook/constants";
import { getFacebookConnection } from "@/features/facebook/queries";
import { getFacebookConnectionStatusLabel } from "@/features/facebook/utils";
import { canManageFacebookSettings } from "@/lib/auth/permissions";
import { getAdminAccessContext } from "@/lib/auth/session";

type FacebookSettingsPageProps = {
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

export default async function FacebookSettingsPage({
  searchParams,
}: FacebookSettingsPageProps): Promise<ReactElement | null> {
  const access = await getAdminAccessContext();

  if (!access) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const error = getSearchParam(resolvedSearchParams.error);
  const success = getSearchParam(resolvedSearchParams.success);
  const [connection] = await Promise.all([getFacebookConnection(access)]);
  const canManageSettings = canManageFacebookSettings(access.membership.role);

  return (
    <>
      <StatusToast message={error} variant="error" />
      <StatusToast message={success} variant="success" />

      <PageContent
        title="Facebook Settings"
        actions={
          <FacebookConnectionStatusBadge
            status={connection?.status ?? "not_connected"}
          />
        }
        tabs={
          <>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/facebook">Overview</Link>
            </Button>
            <Button size="sm" type="button">
              Settings
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/facebook/messenger">Messenger</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/facebook/content">Content History</Link>
            </Button>
          </>
        }
      >
        <Card className="rounded-[20px] border-border shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Page and Messenger connection</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure the dealership page details used for Facebook-ready content and Messenger links.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {!canManageSettings ? (
              <div className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-3 text-sm text-muted-foreground">
                Only owners and admins can update Facebook settings.
              </div>
            ) : null}

            <div className="space-y-4">
              <form action={upsertFacebookConnection} className="space-y-4">
                <input name="redirect_to" type="hidden" value="/admin/facebook/settings" />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="page_name">Page name</Label>
                    <Input
                      defaultValue={connection?.page_name ?? ""}
                      disabled={!canManageSettings}
                      id="page_name"
                      name="page_name"
                      placeholder="Best Wheels"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="page_id">Page ID</Label>
                    <Input
                      defaultValue={connection?.page_id ?? ""}
                      disabled={!canManageSettings}
                      id="page_id"
                      name="page_id"
                      placeholder="1234567890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="page_username">Page username</Label>
                    <Input
                      defaultValue={connection?.page_username ?? ""}
                      disabled={!canManageSettings}
                      id="page_username"
                      name="page_username"
                      placeholder="bestwheels"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook_page_url">Facebook page URL</Label>
                    <Input
                      defaultValue={connection?.facebook_page_url ?? ""}
                      disabled={!canManageSettings}
                      id="facebook_page_url"
                      name="facebook_page_url"
                      placeholder="https://facebook.com/bestwheels"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="messenger_page_identifier">
                      Messenger page identifier
                    </Label>
                    <Input
                      defaultValue={connection?.messenger_page_identifier ?? ""}
                      disabled={!canManageSettings}
                      id="messenger_page_identifier"
                      name="messenger_page_identifier"
                      placeholder="1135130969687423"
                    />
                    <p className="text-xs text-muted-foreground">
                      Legacy field. Public Messenger links use the Facebook Page ID above.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      defaultValue={connection?.status ?? "not_connected"}
                      disabled={!canManageSettings}
                      id="status"
                      name="status"
                    >
                      {FACEBOOK_CONNECTION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {getFacebookConnectionStatusLabel(status)}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ad_account_id">Ad account ID</Label>
                    <Input
                      defaultValue={connection?.ad_account_id ?? ""}
                      disabled={!canManageSettings}
                      id="ad_account_id"
                      name="ad_account_id"
                      placeholder="act_1234567890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pixel_id">Pixel ID</Label>
                    <Input
                      defaultValue={connection?.pixel_id ?? ""}
                      disabled={!canManageSettings}
                      id="pixel_id"
                      name="pixel_id"
                      placeholder="9876543210"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      defaultValue={connection?.notes ?? ""}
                      disabled={!canManageSettings}
                      id="notes"
                      name="notes"
                      rows={5}
                      placeholder="Internal setup notes for this Facebook Page connection."
                    />
                  </div>
                </div>

                {canManageSettings ? (
                  <div className="flex flex-wrap gap-2">
                    <SubmitButton pendingLabel="Saving..." type="submit">
                      Save settings
                    </SubmitButton>
                  </div>
                ) : null}
              </form>

              {canManageSettings && connection ? (
                <form action={clearFacebookConnection}>
                  <ConfirmSubmitButton
                    confirmMessage="Clear the saved Facebook connection settings?"
                    type="submit"
                    variant="outline"
                  >
                    Clear settings
                  </ConfirmSubmitButton>
                </form>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </>
  );
}
