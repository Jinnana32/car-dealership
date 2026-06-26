import "server-only";

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type BrandConfig = {
  logoSrc: string | null;
  name: string;
  subtitle: string;
};

const BRAND_LOGO_CANDIDATES = [
  "images/best_wheels_iloilo.png",
  "images/best_wheels_iloilo.jpg",
  "images/bests_wheels_iloilo.jpg",
  "images/best-wheels-logo.png",
  "images/best-wheels-logo.jpg",
  "branding/best-wheels-logo.png",
] as const;

export function getBrandConfig(): BrandConfig {
  for (const publicPath of BRAND_LOGO_CANDIDATES) {
    const absolutePath = join(process.cwd(), "public", publicPath);

    if (existsSync(absolutePath)) {
      return {
        logoSrc: `/${publicPath}`,
        name: "Best Wheels",
        subtitle: "Car Display",
      };
    }
  }

  return {
    logoSrc: null,
    name: "Best Wheels",
    subtitle: "Car Display",
  };
}

function getImageContentType(publicPath: string): string {
  const extension = publicPath.split(".").pop()?.toLowerCase();

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

export async function readLocalPublicImageAsDataUrl(
  publicPath: string,
): Promise<string | null> {
  const normalized = publicPath.replace(/^\//, "");
  const absolutePath = join(process.cwd(), "public", normalized);

  if (!existsSync(absolutePath)) {
    return null;
  }

  const bytes = await readFile(absolutePath);

  return `data:${getImageContentType(normalized)};base64,${bytes.toString("base64")}`;
}

export async function getBrandLogoDataUrl(): Promise<string | null> {
  for (const publicPath of BRAND_LOGO_CANDIDATES) {
    const dataUrl = await readLocalPublicImageAsDataUrl(publicPath);

    if (dataUrl) {
      return dataUrl;
    }
  }

  return null;
}
