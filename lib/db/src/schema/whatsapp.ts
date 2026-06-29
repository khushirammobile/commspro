import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const waDirectionEnum = pgEnum("wa_direction", ["inbound", "outbound"]);
export const waStatusEnum = pgEnum("wa_status", [
  "queued", "sending", "sent", "delivered", "failed", "read"
]);

export const whatsappMessagesTable = pgTable("whatsapp_messages", {
  id: serial("id").primaryKey(),
  twilioSid: text("twilio_sid"),
  direction: waDirectionEnum("direction").notNull(),
  from: text("from_number").notNull(),
  to: text("to_number").notNull(),
  body: text("body").notNull(),
  status: waStatusEnum("status").notNull().default("queued"),
  mediaUrl: text("media_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWhatsappSchema = createInsertSchema(whatsappMessagesTable).omit({ id: true, createdAt: true });
export type InsertWhatsapp = z.infer<typeof insertWhatsappSchema>;
export type WhatsappMessage = typeof whatsappMessagesTable.$inferSelect;
