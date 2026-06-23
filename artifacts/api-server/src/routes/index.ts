import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import categoriesRouter from "./categories";
import recognitionsRouter from "./recognitions";
import rankingsRouter from "./rankings";
import dashboardRouter from "./dashboard";
import settingsRouter from "./settings";
import reportsRouter from "./reports";
import balanceRouter from "./balance";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(categoriesRouter);
router.use(recognitionsRouter);
router.use(rankingsRouter);
router.use(dashboardRouter);
router.use(settingsRouter);
router.use(reportsRouter);
router.use(balanceRouter);

export default router;
