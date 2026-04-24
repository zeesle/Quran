import { Router, type IRouter } from "express";
import { GetPushConfigResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function parseEnvInt(name: string, defaultVal: number): number {
  const n = parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) ? n : defaultVal;
}

router.get("/push-config", (_req, res) => {
  const raw = {
    maxRetries: parseEnvInt("GH_PUSH_MAX_RETRIES", 3),
    retryDelayMs: parseEnvInt("GH_PUSH_RETRY_DELAY_MS", 10_000),
  };
  const data = GetPushConfigResponse.parse(raw);
  res.json(data);
});

export default router;
