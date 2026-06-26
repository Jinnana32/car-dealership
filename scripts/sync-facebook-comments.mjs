#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

function loadEnvFile(filePath) {
  try {
    const contents = readFileSync(filePath, "utf8");

    for (const line of contents.split("\n")) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Optional local env file.
  }
}

loadEnvFile(join(projectRoot, ".env.local"));
loadEnvFile(join(projectRoot, ".env"));

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
const cronSecret = process.env.CRON_SECRET?.trim();

if (!cronSecret) {
  console.error("CRON_SECRET is required to run the Facebook comment sync.");
  process.exit(1);
}

const endpoint = `${baseUrl.replace(/\/$/, "")}/api/cron/facebook-comment-sync`;

const response = await fetch(endpoint, {
  headers: {
    Authorization: `Bearer ${cronSecret}`,
  },
  method: "POST",
});

const responseText = await response.text();

let payload;

try {
  payload = JSON.parse(responseText);
} catch {
  payload = responseText;
}

if (!response.ok) {
  console.error("Facebook comment sync failed:", payload);
  process.exit(1);
}

console.log(JSON.stringify(payload, null, 2));
