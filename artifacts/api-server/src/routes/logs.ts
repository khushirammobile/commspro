import { Router } from "express";
import { db, communicationLogsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const logs = await db.select().from(communicationLogsTable).orderBy(desc(communicationLogsTable.createdAt)).limit(500);
  res.json(logs.map(l => ({ ...l, from: l.from, to: l.to })));
});

export default router;
