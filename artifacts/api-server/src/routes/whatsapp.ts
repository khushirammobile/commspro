import { Router } from "express";
import { db, whatsappMessagesTable, contactsTable, activityItemsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { getTwilioClient, TWILIO_WHATSAPP } from "../lib/twilio.js";

const router = Router();

router.get("/conversations", async (_req, res) => {
  const msgs = await db.select().from(whatsappMessagesTable).orderBy(desc(whatsappMessagesTable.createdAt));
  const convMap = new Map<string, typeof msgs[0]>();
  for (const m of msgs) {
    const phone = m.direction === "inbound" ? m.from : m.to;
    const normalPhone = phone.replace("whatsapp:", "");
    if (!convMap.has(normalPhone)) convMap.set(normalPhone, m);
  }
  const contacts = await db.select().from(contactsTable);
  const contactMap = new Map(contacts.map(c => [c.phone.replace(/\D/g, ""), c.name]));
  const unreadMap = new Map<string, number>();
  for (const m of msgs) {
    if (m.direction === "inbound" && m.status !== "read") {
      const phone = m.from.replace("whatsapp:", "");
      unreadMap.set(phone, (unreadMap.get(phone) ?? 0) + 1);
    }
  }
  const conversations = Array.from(convMap.entries()).map(([phone, msg]) => {
    const digits = phone.replace(/\D/g, "");
    return {
      phone,
      contactName: contactMap.get(digits) ?? null,
      lastMessage: msg.body,
      lastMessageAt: msg.createdAt,
      unreadCount: unreadMap.get(phone) ?? 0,
    };
  });
  res.json(conversations);
});

router.get("/conversations/:phone/messages", async (req, res) => {
  const phone = decodeURIComponent(req.params.phone);
  const waPhone = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
  const msgs = await db.select().from(whatsappMessagesTable)
    .where(sql`${whatsappMessagesTable.from} = ${waPhone} OR ${whatsappMessagesTable.to} = ${waPhone}`)
    .orderBy(whatsappMessagesTable.createdAt);
  res.json(msgs.map(m => ({ ...m, from: m.from, to: m.to })));
});

router.post("/send", async (req, res) => {
  const { to, body, mediaUrl } = req.body;
  if (!to || !body) { res.status(400).json({ error: "to and body required" }); return; }
  const waTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  try {
    const client = getTwilioClient();
    const createParams = {
      to: waTo,
      from: TWILIO_WHATSAPP,
      body,
      ...(mediaUrl ? { mediaUrl: [mediaUrl] } : {}),
    };
    const twilioMsg = await client.messages.create(createParams);
    const [msg] = await db.insert(whatsappMessagesTable).values({
      twilioSid: twilioMsg.sid,
      direction: "outbound",
      from: TWILIO_WHATSAPP,
      to: waTo,
      body,
      status: "queued",
      mediaUrl: mediaUrl ?? null,
    }).returning();
    await db.insert(activityItemsTable).values({ type: "whatsapp", description: `WhatsApp sent to ${to}`, meta: body.slice(0, 50) });
    res.status(201).json({ ...msg, from: msg.from, to: msg.to });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Twilio error";
    const [msg] = await db.insert(whatsappMessagesTable).values({
      direction: "outbound",
      from: TWILIO_WHATSAPP,
      to: waTo,
      body,
      status: "failed",
      mediaUrl: mediaUrl ?? null,
    }).returning();
    res.status(201).json({ ...msg, from: msg.from, to: msg.to, _twilioError: errMsg });
  }
});

router.post("/webhook", async (req, res) => {
  const { MessageSid, From, To, Body, MediaUrl0 } = req.body;
  try {
    const waFrom = From ?? "";
    const waTo = To ?? TWILIO_WHATSAPP;
    await db.insert(whatsappMessagesTable).values({
      twilioSid: MessageSid ?? null,
      direction: "inbound",
      from: waFrom,
      to: waTo,
      body: Body ?? "",
      status: "received",
      mediaUrl: MediaUrl0 ?? null,
    });
    await db.insert(activityItemsTable).values({
      type: "whatsapp",
      description: `Incoming WhatsApp from ${waFrom.replace("whatsapp:", "")}`,
      meta: (Body ?? "").slice(0, 50),
    });
  } catch { /* best effort */ }
  res.type("text/xml").send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
});

export default router;
