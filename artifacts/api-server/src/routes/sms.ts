import { Router } from "express";
import { db, smsMessagesTable, activityItemsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getTwilioClient, TWILIO_PHONE } from "../lib/twilio.js";

const router = Router();

router.get("/", async (_req, res) => {
  const msgs = await db.select().from(smsMessagesTable).orderBy(desc(smsMessagesTable.createdAt)).limit(200);
  res.json(msgs.map(m => ({ ...m, from: m.from, to: m.to })));
});

router.post("/", async (req, res) => {
  const { to, body } = req.body;
  if (!to || !body) { res.status(400).json({ error: "to and body required" }); return; }
  try {
    const client = getTwilioClient();
    const twilioMsg = await client.messages.create({ to, from: TWILIO_PHONE, body });
    const [msg] = await db.insert(smsMessagesTable).values({
      twilioSid: twilioMsg.sid,
      direction: "outbound",
      from: TWILIO_PHONE,
      to,
      body,
      status: "queued",
    }).returning();
    await db.insert(activityItemsTable).values({ type: "sms", description: `SMS sent to ${to}`, meta: body.slice(0, 50) });
    res.status(201).json({ ...msg, from: msg.from, to: msg.to });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Twilio error";
    const [msg] = await db.insert(smsMessagesTable).values({
      direction: "outbound",
      from: TWILIO_PHONE,
      to,
      body,
      status: "failed",
    }).returning();
    res.status(201).json({ ...msg, from: msg.from, to: msg.to, _twilioError: errMsg });
  }
});

router.post("/webhook", async (req, res) => {
  const { MessageSid, From, To, Body, MessageStatus } = req.body;
  try {
    await db.insert(smsMessagesTable).values({
      twilioSid: MessageSid ?? null,
      direction: "inbound",
      from: From ?? "",
      to: To ?? TWILIO_PHONE,
      body: Body ?? "",
      status: MessageStatus ?? "received",
    });
    await db.insert(activityItemsTable).values({
      type: "sms",
      description: `Incoming SMS from ${From ?? "unknown"}`,
      meta: (Body ?? "").slice(0, 50),
    });
  } catch { /* best effort */ }
  res.type("text/xml").send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
});

router.post("/status", async (req, res) => {
  const { MessageSid, MessageStatus } = req.body;
  if (MessageSid) {
    await db.update(smsMessagesTable)
      .set({ status: MessageStatus })
      .where(eq(smsMessagesTable.twilioSid, MessageSid));
  }
  res.sendStatus(200);
});

router.get("/:id", async (req, res) => {
  const [msg] = await db.select().from(smsMessagesTable).where(eq(smsMessagesTable.id, Number(req.params.id))).limit(1);
  if (!msg) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...msg, from: msg.from, to: msg.to });
});

export default router;
