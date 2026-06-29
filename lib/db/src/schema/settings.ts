import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  twilioAccountSid: text("twilio_account_sid").notNull().default(""),
  twilioPhoneNumber: text("twilio_phone_number").notNull().default(""),
  twilioWhatsappNumber: text("twilio_whatsapp_number").notNull().default(""),
  webhookBaseUrl: text("webhook_base_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
