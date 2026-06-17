import "server-only";

import { existsSync } from "node:fs";
import { join } from "node:path";

export type BrandConfig = {
  logoSrc: string | null;
  name: string;
  subtitle: string;
};

export function getBrandConfig(): BrandConfig {
  const logoPath = join(
    process.cwd(),
    "public",
    "branding",
    "best-wheels-logo.png",
  );

  return {
    logoSrc: existsSync(logoPath) ? "/branding/best-wheels-logo.png" : null,
    name: "Best Wheels",
    subtitle: "Car Display",
  };
}

