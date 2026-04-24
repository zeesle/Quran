#!/usr/bin/env node
// Ensures a visible project task exists when GH_PAT is expiring soon.
//
// USAGE:
//   From the code_execution sandbox (has bulkCreateProjectTasks available):
//     const { ensureExpiryTask } = await import('/home/runner/workspace/scripts/ensure-expiry-task.mjs');
//     await ensureExpiryTask();
//
//   From the shell (writes the REPLIT_DB_URL pending flag + prints banner):
//     node scripts/ensure-expiry-task.mjs
//
// The script is idempotent: if a task already exists with the same title it is not duplicated.
// Dedup uses both searchProjectTasks (may lag) and listProjectTasks (authoritative list scan).

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Lazily imported inside code_execution context only (where setEnvVars is available).
// Syncs the auto-detected token expiry to GH_PAT_EXPIRES so it never needs to be
// updated manually after token rotation.
let _syncPatExpiry = null;
async function getSyncPatExpiry() {
  if (!_syncPatExpiry) {
    try {
      const mod = await import("/home/runner/workspace/scripts/sync-pat-expiry.mjs");
      _syncPatExpiry = mod.syncPatExpiry;
    } catch { /* ignore — script not available in this environment */ }
  }
  return _syncPatExpiry;
}

const __dir = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(__dir, "..");
const EXPIRY_STATUS_FILE = resolve(WORKSPACE_ROOT, ".local/gh-pat-expiry-status.json");
const TASKS_DIR = resolve(WORKSPACE_ROOT, ".local/tasks");

// Key used in the REPLIT_DB_URL KV store to signal "token task pending".
const KV_PENDING_KEY = "gh-pat-expiry-task-pending";

const WARN_DAYS_BEFORE = 30;

// ── KV store helpers ──────────────────────────────────────────────────────────
// REPLIT_DB_URL is available in the shell context but NOT in code_execution
// (process.env is a stub there). kvSet/kvDelete are no-ops when the URL is
// absent, so it is safe to call them in both contexts.

async function kvSet(key, value) {
  const url = process?.env?.REPLIT_DB_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    });
  } catch { /* ignore */ }
}

async function kvDelete(key) {
  const url = process?.env?.REPLIT_DB_URL;
  if (!url) return;
  try {
    await fetch(`${url}/${encodeURIComponent(key)}`, { method: "DELETE" });
  } catch { /* ignore */ }
}

// ── Expiry reading ─────────────────────────────────────────────────────────────

function readExpiryStatus() {
  // Try env var first (available when running from the shell).
  // In the code_execution sandbox process.env is not accessible,
  // so fall through to the flag file written by github-push.mjs.
  let raw = "";
  try {
    raw = ((process?.env?.GH_PAT_EXPIRES) || "").trim();
  } catch {
    // process not available in this context
  }

  if (!raw) {
    // Read the flag file written by github-push.mjs during the last post-merge run.
    try {
      const flag = JSON.parse(readFileSync(EXPIRY_STATUS_FILE, "utf8"));
      if (flag && flag.expiresOn) {
        // Re-compute daysRemaining from the stored expiry date so it stays current.
        const expiryMs = Date.parse(flag.expiresOn);
        if (!isNaN(expiryMs)) {
          const daysRemaining = Math.ceil((expiryMs - Date.now()) / (1000 * 60 * 60 * 24));
          return {
            expiresOn: flag.expiresOn,
            daysRemaining,
            needsReminder: daysRemaining <= WARN_DAYS_BEFORE,
          };
        }
      }
    } catch {
      // No flag file — that's fine
    }
    return null;
  }

  const expiryMs = Date.parse(raw);
  if (isNaN(expiryMs)) return null;

  const daysRemaining = Math.ceil((expiryMs - Date.now()) / (1000 * 60 * 60 * 24));
  return { expiresOn: raw, daysRemaining, needsReminder: daysRemaining <= WARN_DAYS_BEFORE };
}

function taskTitle(expiresOn) {
  return `Rotate GitHub token by ${expiresOn}`;
}

function writeTaskFile(expiresOn, daysRemaining) {
  mkdirSync(TASKS_DIR, { recursive: true });
  const expired = daysRemaining <= 0;
  const urgency = expired
    ? `**EXPIRED** ${Math.abs(daysRemaining)} day(s) ago`
    : `expires in ${daysRemaining} day(s)`;

  const content = `# Rotate GitHub token by ${expiresOn}

## What & Why
The GitHub Personal Access Token (GH_PAT) used for automatic pushes ${urgency}. If not rotated the auto-push to GitHub will silently break after ${expiresOn}.

## Done looks like
- A new PAT is created at https://github.com/settings/tokens with Contents: write scope for zeesle/Quran
- The GH_PAT secret is updated in the Replit environment
- GH_PAT_EXPIRES will be updated automatically on the next push (no manual update needed)

## Relevant files
- \`scripts/github-push.mjs\`
- \`scripts/post-merge.sh\`
`;
  const filePath = resolve(TASKS_DIR, "rotate-github-token.md");
  writeFileSync(filePath, content, "utf8");
  return filePath;
}

// ── Main exported function ─────────────────────────────────────────────────────

export async function ensureExpiryTask() {
  const hasTaskAPIs =
    typeof searchProjectTasks !== "undefined" &&
    typeof listProjectTasks !== "undefined" &&
    typeof bulkCreateProjectTasks !== "undefined";

  // In code_execution: always sync the auto-detected expiry to GH_PAT_EXPIRES
  // first, regardless of whether a reminder is needed.  This ensures a freshly
  // rotated token (with many days remaining) gets its expiry recorded without
  // waiting for the 30-day warning window to trigger.
  if (hasTaskAPIs) {
    try {
      const syncFn = await getSyncPatExpiry();
      if (syncFn) await syncFn();
    } catch (err) {
      console.warn(`WARNING: syncPatExpiry failed — ${err.message}`);
    }
  }

  const status = readExpiryStatus();

  if (!status || !status.needsReminder) {
    if (!status) {
      console.log("GH_PAT_EXPIRES not set — skipping expiry task check.");
    } else {
      console.log(`GH_PAT expiry: ${status.expiresOn} (${status.daysRemaining} days remaining — no reminder needed).`);
    }
    // Clear any stale pending flag.
    await kvDelete(KV_PENDING_KEY);
    return;
  }

  const title = taskTitle(status.expiresOn);
  console.log(`Token expiry reminder needed: "${title}"`);

  if (!hasTaskAPIs) {
    // Running outside the code_execution sandbox.
    // 1. Write the task plan file so the agent can consume it later.
    writeTaskFile(status.expiresOn, status.daysRemaining);
    // 2. Write a pending flag to the KV store so the next code_execution
    //    call can pick it up and create the project task reliably.
    await kvSet(KV_PENDING_KEY, JSON.stringify({ title, expiresOn: status.expiresOn }));
    // 3. Print a hard-to-miss banner.
    console.warn(
      `\n${"=".repeat(70)}\n` +
      `  ACTION REQUIRED: GH_PAT expires on ${status.expiresOn} (${status.daysRemaining} day(s) remaining).\n` +
      `  A project task will be created automatically on the next agent run.\n` +
      `  Or go to https://github.com/settings/tokens to rotate now.\n` +
      `${"=".repeat(70)}\n`
    );
    return;
  }

  // Running inside code_execution — create the task if it doesn't exist yet.
  // Combine searchProjectTasks (may have indexing lag) with listProjectTasks
  // (authoritative full scan) to reliably detect duplicates.
  const [searchHits, allTasks] = await Promise.all([
    searchProjectTasks({ query: `"${title}"`, limit: 10 }),
    listProjectTasks(),
  ]);
  const combined = [...searchHits, ...allTasks];
  const seen = new Set();
  const dedupedTasks = combined.filter((t) => {
    if (seen.has(t.taskRef)) return false;
    seen.add(t.taskRef);
    return true;
  });
  const alreadyExists = dedupedTasks.some(
    (t) => t.title.trim() === title && t.state !== "CANCELLED"
  );

  if (alreadyExists) {
    console.log(`Project task already exists: "${title}" — no duplicate created.`);
    await kvDelete(KV_PENDING_KEY);
    return;
  }

  const filePath = writeTaskFile(status.expiresOn, status.daysRemaining);
  const created = await bulkCreateProjectTasks({
    tasks: [{ title, filePath }],
  });

  if (created && created.length > 0) {
    console.log(`Created project task ${created[0].taskRef}: "${title}"`);
    await kvDelete(KV_PENDING_KEY);
  } else {
    console.warn("WARNING: bulkCreateProjectTasks returned no results.");
  }
}

// ── CLI entry point ────────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ensureExpiryTask().catch((err) => {
    console.error("ERROR in ensureExpiryTask:", err.message);
    process.exit(1);
  });
}
