import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const smsDirectionEnum = pgEnum("sms_direction", ["inbound", "outbound"]);
export const smsStatusEnum = pgEnum("sms_status", [
  "queued", "sending", "sent", "delivered", "failed", "undelivered", "receiving", "received"
]);

export const smsMessagesTable = pgTable("sms_messages", {
  id: serial("id").primaryKey(),
  twilioSid: text("twilio_sid"),
  direction: smsDirectionEnum("direction").notNull(),
  from: text("from_number").notNull(),
  to: text("to_number").notNull(),
  body: text("body").notNull(),
  status: smsStatusEnum("status").notNull().default("queued"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSmsSchema = createInsertSchema(smsMessagesTable).omit({ id: true, createdAt: true });
export type InsertSms = z.infer<typeof insertSmsSchema>;
export type SmsMessage = typeof smsMessagesTable.$inferSelect;
