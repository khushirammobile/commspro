import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const safeUser = (u: typeof usersTable.$inferSelect) => {
  const { passwordHash: _, ...rest } = u;
  return rest;
};

router.get("/", async (_req, res) => {
  const users = await db.select().from(usersTable);
  res.json(users.map(safeUser));
});

router.post("/", async (req, res) => {
  const { name, email, role, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email, password required" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ name, email, role: role ?? "agent", passwordHash }).returning();
  res.status(201).json(safeUser(user));
});

router.get("/:id", async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(req.params.id))).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(safeUser(user));
});

router.patch("/:id", async (req, res) => {
  const { name, email, role, isOnline } = req.body;
  const [user] = await db.update(usersTable)
    .set({ ...(name && { name }), ...(email && { email }), ...(role && { role }), ...(isOnline !== undefined && { isOnline }) })
    .where(eq(usersTable.id, Number(req.params.id)))
    .returning();
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(safeUser(user));
});

router.delete("/:id", async (req, res) => {
  await db.delete(usersTable).where(eq(usersTable.id, Number(req.params.id)));
  res.json({ message: "User deleted" });
});

export default router;
