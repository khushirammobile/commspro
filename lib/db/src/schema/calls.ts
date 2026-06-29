import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const callDirectionEnum = pgEnum("call_direction", ["inbound", "outbound"]);
export const callStatusEnum = pgEnum("call_status", [
  "queued", "ringing", "in-progress", "completed", "busy", "failed", "no-answer", "canceled"
]);

export const callsTable = pgTable("calls", {
  id: serial("id").primaryKey(),
  twilioCallSid: text("twilio_call_sid"),
  direction: callDirectionEnum("direction").notNull(),
  from: text("from_number").notNull(),
  to: text("to_number").notNull(),
  status: callStatusEnum("status").notNull().default("queued"),
  duration: integer("duration"),
  recordingUrl: text("recording_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCallSchema = createInsertSchema(callsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof callsTable.$inferSelect;
