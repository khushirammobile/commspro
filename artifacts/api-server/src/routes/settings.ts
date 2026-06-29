import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { getTwilioClient } from "../lib/twilio.js";

const router = Router();

async function getOrCreateSettings() {
  const rows = await db.select().from(settingsTable).limit(1);
  if (rows.length > 0) return rows[0];
  const [row] = await db.insert(settingsTable).values({
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",
    twilioWhatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER ?? process.env.TWILIO_PHONE_NUMBER ?? "",
    updatedAt: new Date(),
  }).returning();
  return row;
}

router.get("/", async (_req, res) => {
  const settings = await getOrCreateSettings();
  res.json(settings);
});

router.patch("/", async (req, res) => {
  const { twilioAccountSid, twilioPhoneNumber, twilioWhatsappNumber, webhookBaseUrl } = req.body;
  const existing = await getOrCreateSettings();
  const [settings] = await db.update(settingsTable)
    .set({
      ...(twilioAccountSid && { twilioAccountSid }),
      ...(twilioPhoneNumber && { twilioPhoneNumber }),
      ...(twilioWhatsappNumber && { twilioWhatsappNumber }),
      ...(webhookBaseUrl !== undefined && { webhookBaseUrl }),
      updatedAt: new Date(),
    })
    .returning();
  res.json(settings ?? existing);
});

router.post("/twilio/test", async (_req, res) => {
  try {
    const client = getTwilioClient();
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
    res.json({ success: true, message: "Twilio connected successfully", accountName: account.friendlyName });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Connection failed";
    res.json({ success: false, message: msg, accountName: null });
  }
});

export default router;
