import type { ReactElement } from "react";

import { BrandSignature } from "@/components/branding/brand-signature";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/auth/actions";
import { getBrandConfig } from "@/lib/branding";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    info?: string | string[];
    next?: string | string[];
  }>;
};

function getSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps): Promise<ReactElement> {
  const brand = getBrandConfig();
  const resolvedSearchParams = await searchParams;
  const error = getSearchParam(resolvedSearchParams.error);
  const info = getSearchParam(resolvedSearchParams.info);
  const next = getSearchParam(resolvedSearchParams.next) ?? "/admin/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f4] px-4 py-10">
      <Card className="w-full max-w-md border-border bg-white shadow-sm">
        <CardHeader className="space-y-6">
          <BrandSignature
            className="min-h-10"
            logoClassName="max-h-10 max-w-[160px] object-contain"
            logoSrc={brand.logoSrc}
            showSubtitle={!brand.logoSrc}
          />
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Access your dealership admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
              {error}
            </div>
          ) : null}

          {info ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700">
              {info}
            </div>
          ) : null}

          <form action={loginAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="owner@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
            </div>

            <SubmitButton
              type="submit"
              className="w-full"
              pendingLabel="Signing in..."
            >
              Sign in
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
