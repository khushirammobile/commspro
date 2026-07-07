import { Router } from "express";
import { db, callsTable, activityItemsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getTwilioClient, TWILIO_PHONE } from "../lib/twilio.js";
import twilio from "twilio";

const router = Router();

const BASE_URL = () =>
  process.env.WEBHOOK_BASE_URL ??
  `https://${(process.env.REPLIT_DOMAINS ?? "").split(",")[0]}`;

router.get("/", async (_req, res) => {
  const calls = await db.select().from(callsTable).orderBy(desc(callsTable.createdAt)).limit(100);
  res.json(calls.map(c => ({ ...c, from: c.from, to: c.to })));
});

router.get("/active", async (_req, res) => {
  const calls = await db.select().from(callsTable).where(eq(callsTable.status, "in-progress"));
  res.json(calls.map(c => ({ ...c, from: c.from, to: c.to })));
});

router.post("/outbound", async (req, res) => {
  const { to, from: fromNum } = req.body;
  if (!to) { res.status(400).json({ error: "to is required" }); return; }
  const fromNumber = fromNum ?? TWILIO_PHONE;
  try {
    const client = getTwilioClient();
    const twilioCall = await client.calls.create({
      to,
      from: fromNumber,
      url: `${BASE_URL()}/api/calls/twiml/outbound`,
      statusCallback: `${BASE_URL()}/api/calls/status`,
      statusCallbackMethod: "POST",
    });
    const [call] = await db.insert(callsTable).values({
      twilioCallSid: twilioCall.sid,
      direction: "outbound",
      from: fromNumber,
      to,
      status: "queued",
    }).returning();
    await db.insert(activityItemsTable).values({ type: "call", description: `Outbound call to ${to}` });
    res.status(201).json({ ...call, from: call.from, to: call.to });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Twilio error";
    const [call] = await db.insert(callsTable).values({
      direction: "outbound",
      from: fromNumber,
      to,
      status: "failed",
    }).returning();
    res.status(201).json({ ...call, from: call.from, to: call.to, _twilioError: errMsg });
  }
});

router.post("/webhook", async (req, res) => {
  const { CallSid, From, To, CallStatus, Direction } = req.body;
  try {
    const [call] = await db.insert(callsTable).values({
      twilioCallSid: CallSid ?? null,
      direction: "inbound",
      from: From ?? "",
      to: To ?? TWILIO_PHONE,
      status: CallStatus ?? "ringing",
    }).returning();
    await db.insert(activityItemsTable).values({
      type: "call",
      description: `Incoming call from ${From ?? "unknown"}`,
    });
    res.type("text/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling CommsPro. Please hold while we connect your call.</Say>
  <Pause length="2"/>
  <Say voice="alice">Our team will be with you shortly.</Say>
  <Pause length="30"/>
  <Say voice="alice">Thank you for your patience. Goodbye.</Say>
</Response>`);
  } catch {
    res.type("text/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<Response><Say>Sorry, an error occurred. Please try again later.</Say></Response>`);
  }
});

router.post("/twiml/outbound", (_req, res) => {
  res.type("text/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting your call from CommsPro. Please wait.</Say>
</Response>`);
});

router.post("/status", async (req, res) => {
  const { CallSid, CallStatus, CallDuration } = req.body;
  if (CallSid) {
    const statusMap: Record<string, string> = {
      "completed": "completed",
      "busy": "busy",
      "failed": "failed",
      "no-answer": "no-answer",
      "canceled": "canceled",
      "in-progress": "in-progress",
      "ringing": "ringing",
      "queued": "queued",
    };
    const mappedStatus = statusMap[CallStatus] ?? CallStatus;
    await db.update(callsTable)
      .set({
        status: mappedStatus,
        ...(CallDuration ? { duration: Number(CallDuration) } : {}),
        updatedAt: new Date(),
      })
      .where(eq(callsTable.twilioCallSid, CallSid));
  }
  res.sendStatus(200);
});

router.get("/:id", async (req, res) => {
  const [call] = await db.select().from(callsTable).where(eq(callsTable.id, Number(req.params.id))).limit(1);
  if (!call) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...call, from: call.from, to: call.to });
});

router.post("/:id/end", async (req, res) => {
  const [call] = await db.select().from(callsTable).where(eq(callsTable.id, Number(req.params.id))).limit(1);
  if (!call) { res.status(404).json({ error: "Not found" }); return; }
  if (call.twilioCallSid) {
    try {
      const client = getTwilioClient();
      await client.calls(call.twilioCallSid).update({ status: "completed" });
    } catch { /* best effort */ }
  }
  const [updated] = await db.update(callsTable).set({ status: "completed", updatedAt: new Date() }).where(eq(callsTable.id, call.id)).returning();
  res.json({ ...updated, from: updated.from, to: updated.to });
});

router.post("/:id/answer", async (req, res) => {
  const [updated] = await db.update(callsTable).set({ status: "in-progress", updatedAt: new Date() }).where(eq(callsTable.id, Number(req.params.id))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, from: updated.from, to: updated.to });
});

router.post("/:id/reject", async (req, res) => {
  const [call] = await db.select().from(callsTable).where(eq(callsTable.id, Number(req.params.id))).limit(1);
  if (!call) { res.status(404).json({ error: "Not found" }); return; }
  if (call.twilioCallSid) {
    try {
      const client = getTwilioClient();
      await client.calls(call.twilioCallSid).update({ status: "canceled" });
    } catch { /* best effort */ }
  }
  const [updated] = await db.update(callsTable).set({ status: "canceled", updatedAt: new Date() }).where(eq(callsTable.id, call.id)).returning();
  res.json({ ...updated, from: updated.from, to: updated.to });
});

export default router;
