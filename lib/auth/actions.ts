"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canManageDealership } from "@/lib/auth/permissions";
import { requireAdminAccessContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginFormSchema } from "@/lib/validators/auth";
import {
  dealershipSettingsSchema,
  profileSettingsSchema,
} from "@/lib/validators/settings";

function sanitizeNextPath(candidate: string | undefined): string {
  if (!candidate) {
    return "/admin/dashboard";
  }

  return candidate.startsWith("/admin") ? candidate : "/admin/dashboard";
}

function redirectWithMessage(
  pathname: string,
  key: "error" | "info" | "success",
  message: string,
): never {
  const searchParams = new URLSearchParams({
    [key]: message,
  });

  redirect(`${pathname}?${searchParams.toString()}`);
}

function getSanitizedLoginErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return "Invalid email or password.";
  }

  if (normalized.includes("email not confirmed")) {
    return "This account is not ready to sign in yet. Contact an administrator if the issue continues.";
  }

  return "Unable to sign in right now. Please try again.";
}

export async function loginAction(formData: FormData): Promise<void> {
  const parsed = loginFormSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const nextPath = sanitizeNextPath(
      typeof formData.get("next") === "string" ? String(formData.get("next")) : undefined,
    );
    const searchParams = new URLSearchParams({
      error: parsed.error.issues[0]?.message ?? "Unable to sign in.",
      next: nextPath,
    });

    redirect(`/login?${searchParams.toString()}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    const searchParams = new URLSearchParams({
      error: getSanitizedLoginErrorMessage(error.message),
      next: sanitizeNextPath(parsed.data.next),
    });

    redirect(`/login?${searchParams.toString()}`);
  }

  redirect(sanitizeNextPath(parsed.data.next));
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();
  redirect("/login?info=Signed%20out");
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const access = await requireAdminAccessContext("/admin/settings");

  if (!access) {
    redirectWithMessage("/admin/settings", "error", "Dealership access is not configured for this user.");
  }

  const parsed = profileSettingsSchema.safeParse({
    avatar_url: formData.get("avatar_url"),
    full_name: formData.get("full_name"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      "/admin/settings",
      "error",
      parsed.error.issues[0]?.message ?? "Profile update failed.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_url: parsed.data.avatar_url,
      full_name: parsed.data.full_name,
    })
    .eq("id", access.profile.id);

  if (error) {
    redirectWithMessage(
      "/admin/settings",
      "error",
      "Unable to update profile settings right now.",
    );
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/settings");

  redirectWithMessage("/admin/settings", "success", "Profile updated.");
}

export async function updateDealershipSettingsAction(
  formData: FormData,
): Promise<void> {
  const access = await requireAdminAccessContext("/admin/settings");

  if (!access) {
    redirectWithMessage("/admin/settings", "error", "Dealership access is not configured for this user.");
  }

  if (!canManageDealership(access.membership.role)) {
    redirectWithMessage(
      "/admin/settings",
      "error",
      "You do not have permission to update dealership settings.",
    );
  }

  const parsed = dealershipSettingsSchema.safeParse({
    contact_email: formData.get("contact_email"),
    contact_phone: formData.get("contact_phone"),
    default_financing_headline: formData.get("default_financing_headline"),
    default_post_location_tag: formData.get("default_post_location_tag"),
    default_sale_inclusions: formData.get("default_sale_inclusions"),
    facebook_page_url: formData.get("facebook_page_url"),
    logo_url: formData.get("logo_url"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    vehicle_catalog: formData.get("vehicle_catalog"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      "/admin/settings",
      "error",
      parsed.error.issues[0]?.message ?? "Dealership update failed.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("dealerships")
    .update(parsed.data)
    .eq("id", access.dealership.id);

  if (error) {
    redirectWithMessage(
      "/admin/settings",
      "error",
      "Unable to update dealership settings right now.",
    );
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/settings");

  redirectWithMessage("/admin/settings", "success", "Dealership settings updated.");
}
