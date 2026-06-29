import { Router, type IRouter } from "express";
import type { Request, Response } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import authRouter from "./auth.js";
import dashboardRouter from "./dashboard.js";
import usersRouter from "./users.js";
import contactsRouter from "./contacts.js";
import callsRouter from "./calls.js";
import smsRouter from "./sms.js";
import whatsappRouter from "./whatsapp.js";
import agentsRouter from "./agents.js";
import logsRouter from "./logs.js";
import settingsRouter from "./settings.js";

const router: IRouter = Router();

router.get("/healthz", (_req: Request, res: Response) => {
  res.json(HealthCheckResponse.parse({ status: "ok" }));
});

router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);
router.use("/users", usersRouter);
router.use("/contacts", contactsRouter);
router.use("/calls", callsRouter);
router.use("/sms", smsRouter);
router.use("/whatsapp", whatsappRouter);
router.use("/agents", agentsRouter);
router.use("/logs", logsRouter);
router.use("/settings", settingsRouter);

export default router;
