import { Router } from "express";
import { db, contactsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const contacts = await db.select().from(contactsTable).orderBy(contactsTable.name);
  res.json(contacts);
});

router.post("/", async (req, res) => {
  const { name, phone, email, company, notes } = req.body;
  if (!name || !phone) { res.status(400).json({ error: "name and phone required" }); return; }
  const [contact] = await db.insert(contactsTable).values({ name, phone, email, company, notes }).returning();
  res.status(201).json(contact);
});

router.get("/:id", async (req, res) => {
  const [contact] = await db.select().from(contactsTable).where(eq(contactsTable.id, Number(req.params.id))).limit(1);
  if (!contact) { res.status(404).json({ error: "Not found" }); return; }
  res.json(contact);
});

router.patch("/:id", async (req, res) => {
  const { name, phone, email, company, notes } = req.body;
  const [contact] = await db.update(contactsTable)
    .set({ ...(name && { name }), ...(phone && { phone }), ...(email !== undefined && { email }), ...(company !== undefined && { company }), ...(notes !== undefined && { notes }) })
    .where(eq(contactsTable.id, Number(req.params.id)))
    .returning();
  if (!contact) { res.status(404).json({ error: "Not found" }); return; }
  res.json(contact);
});

router.delete("/:id", async (req, res) => {
  await db.delete(contactsTable).where(eq(contactsTable.id, Number(req.params.id)));
  res.json({ message: "Contact deleted" });
});

export default router;
