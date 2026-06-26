#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const syncScript = join(projectRoot, "scripts/sync-facebook-comments.mjs");
const intervalMs = Number(process.env.FACEBOOK_COMMENT_SYNC_INTERVAL_MS ?? "60000");

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

function formatTimestamp() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

function runSync() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [syncScript], {
      cwd: projectRoot,
      env: process.env,
      stdio: "inherit",
    });

    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

console.log(
  `[facebook-comment-sync] Watching every ${Math.round(intervalMs / 1000)}s. Press Ctrl+C to stop.`,
);

let running = false;

async function tick() {
  if (running) {
    console.log(`[facebook-comment-sync] ${formatTimestamp()} skipped (previous run still active)`);
    return;
  }

  running = true;

  try {
    console.log(`[facebook-comment-sync] ${formatTimestamp()} starting sync...`);
    const exitCode = await runSync();

    if (exitCode !== 0) {
      console.error(`[facebook-comment-sync] ${formatTimestamp()} sync exited with code ${exitCode}`);
    }
  } finally {
    running = false;
  }
}

await tick();

const timer = setInterval(() => {
  void tick();
}, intervalMs);

function shutdown() {
  clearInterval(timer);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
