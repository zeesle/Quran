import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pushStatusRouter from "./push-status";
import pushConfigRouter from "./push-config";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pushStatusRouter);
router.use(pushConfigRouter);

export default router;
