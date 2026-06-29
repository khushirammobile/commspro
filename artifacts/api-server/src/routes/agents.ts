import { Router } from "express";
import { db, agentsTable, agentTasksTable, agentActivityTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const agents = await db.select().from(agentsTable).orderBy(desc(agentsTable.createdAt));
  res.json(agents);
});

router.post("/", async (req, res) => {
  const { name, type, description } = req.body;
  if (!name || !type) { res.status(400).json({ error: "name and type required" }); return; }
  const [agent] = await db.insert(agentsTable).values({ name, type, description }).returning();
  await db.insert(agentActivityTable).values({ agentId: agent.id, event: "created", detail: `Agent ${name} created` });
  res.status(201).json(agent);
});

router.get("/:id", async (req, res) => {
  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, Number(req.params.id))).limit(1);
  if (!agent) { res.status(404).json({ error: "Not found" }); return; }
  res.json(agent);
});

router.patch("/:id", async (req, res) => {
  const { name, type, description } = req.body;
  const [agent] = await db.update(agentsTable)
    .set({ ...(name && { name }), ...(type && { type }), ...(description !== undefined && { description }) })
    .where(eq(agentsTable.id, Number(req.params.id)))
    .returning();
  if (!agent) { res.status(404).json({ error: "Not found" }); return; }
  res.json(agent);
});

router.delete("/:id", async (req, res) => {
  await db.delete(agentsTable).where(eq(agentsTable.id, Number(req.params.id)));
  res.json({ message: "Agent deleted" });
});

router.post("/:id/toggle", async (req, res) => {
  const { isEnabled } = req.body;
  const [agent] = await db.update(agentsTable)
    .set({ isEnabled, status: isEnabled ? "idle" : "idle" })
    .where(eq(agentsTable.id, Number(req.params.id)))
    .returning();
  if (!agent) { res.status(404).json({ error: "Not found" }); return; }
  await db.insert(agentActivityTable).values({ agentId: agent.id, event: isEnabled ? "enabled" : "disabled", detail: `Agent ${isEnabled ? "enabled" : "disabled"}` });
  res.json(agent);
});

router.get("/:id/tasks", async (req, res) => {
  const tasks = await db.select().from(agentTasksTable)
    .where(eq(agentTasksTable.agentId, Number(req.params.id)))
    .orderBy(desc(agentTasksTable.createdAt));
  res.json(tasks);
});

router.post("/:id/tasks", async (req, res) => {
  const { title, description, priority } = req.body;
  if (!title) { res.status(400).json({ error: "title required" }); return; }
  const agentId = Number(req.params.id);
  const [task] = await db.insert(agentTasksTable).values({ agentId, title, description, priority: priority ?? "medium" }).returning();
  await db.update(agentsTable).set({ taskCount: (await db.select().from(agentTasksTable).where(eq(agentTasksTable.agentId, agentId))).length }).where(eq(agentsTable.id, agentId));
  await db.insert(agentActivityTable).values({ agentId, event: "task_assigned", detail: `Task: ${title}` });
  res.status(201).json(task);
});

router.get("/:id/activity", async (req, res) => {
  const activity = await db.select().from(agentActivityTable)
    .where(eq(agentActivityTable.agentId, Number(req.params.id)))
    .orderBy(desc(agentActivityTable.createdAt))
    .limit(50);
  res.json(activity);
});

export default router;
