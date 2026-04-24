#!/usr/bin/env node
// Pushes to GitHub after each task merge.
// Tries GH_PAT first, then GITHUB_TOKEN as fallback.
// Note: Replit auto-injects GITHUB_TOKEN from its OAuth integration; if that token
// lacks org push access, set GH_PAT to a classic PAT with repo scope.
//
// Credentials are passed via GIT_ASKPASS — never stored in .git/config.

import { execFileSync, spawnSync } from "child_process";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const GITHUB_REPO = "zeesle/Quran";
const GITHUB_REMOTE_URL = `https://github.com/${GITHUB_REPO}.git`;
const REMOTE_NAME = "github";

function setRemote(url) {
  try {
    execFileSync("git", ["remote", "get-url", REMOTE_NAME], { stdio: "pipe" });
    execFileSync("git", ["remote", "set-url", REMOTE_NAME, url], { stdio: "pipe" });
  } catch {
    execFileSync("git", ["remote", "add", REMOTE_NAME, url], { stdio: "pipe" });
  }
}

async function testTokenAccess(token) {
  const resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
    headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!resp.ok) return false;
  const data = await resp.json();
  return data.permissions?.push === true;
}

function gitPushWithToken(token) {
  const tmpDir = mkdtempSync(join(tmpdir(), "ghpush-"));
  const askpassScript = join(tmpDir, "askpass.sh");
  // GIT_ASKPASS is invoked with the prompt string as $1
  writeFileSync(
    askpassScript,
    `#!/bin/sh\ncase "$1" in\n  Username*) echo "x-access-token" ;;\n  Password*) echo "${token}" ;;\nesac\n`,
    { mode: 0o700 }
  );
  try {
    const result = spawnSync(
      "git",
      ["-c", "credential.helper=", "push", REMOTE_NAME, "main"],
      {
        encoding: "utf8",
        stdio: "pipe",
        env: { ...process.env, GIT_ASKPASS: askpassScript },
      }
    );
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    const out = (result.stdout || "") + (result.stderr || "");
    return result.status === 0 || out.includes("Everything up-to-date");
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function main() {
  // Prefer GH_PAT (user-supplied classic PAT with org push access),
  // fall back to GITHUB_TOKEN (Replit's OAuth token, works if org allows it).
  const candidates = [
    { name: "GH_PAT", value: (process.env.GH_PAT || "").replace(/\s+/g, "") },
    { name: "GITHUB_TOKEN", value: (process.env.GITHUB_TOKEN || "").replace(/\s+/g, "") },
  ].filter((c) => c.value.length > 0);

  if (candidates.length === 0) {
    console.error("ERROR: No GitHub token available. Set GH_PAT or GITHUB_TOKEN secret.");
    process.exit(1);
  }

  setRemote(GITHUB_REMOTE_URL);

  for (const { name, value } of candidates) {
    const hasAccess = await testTokenAccess(value);
    if (!hasAccess) {
      console.log(`${name}: no push access to ${GITHUB_REPO}, skipping.`);
      continue;
    }
    console.log(`Using ${name} for GitHub push ...`);
    if (gitPushWithToken(value)) {
      console.log("GitHub push succeeded.");
      return;
    }
    console.error(`${name}: push attempt failed.`);
  }

  console.error(`ERROR: GitHub push to ${GITHUB_REPO} failed with all available tokens.`);
  process.exit(1);
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
