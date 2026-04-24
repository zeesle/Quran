import { Router, type IRouter } from "express";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { GetPushStatusResponse } from "@workspace/api-zod";

// After bundling, import.meta.url points to artifacts/api-server/dist/index.mjs.
// Go up three levels to reach the workspace root.
const PUSH_STATUS_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../.local/gh-push-status.json"
);

const router: IRouter = Router();

router.get("/push-status", (_req, res) => {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(PUSH_STATUS_FILE, "utf8"));
  } catch {
    raw = { status: "unknown" };
  }
  const data = GetPushStatusResponse.parse(raw);
  res.json(data);
});

export default router;
