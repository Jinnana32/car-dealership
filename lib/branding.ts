import "server-only";

import { existsSync } from "node:fs";
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
