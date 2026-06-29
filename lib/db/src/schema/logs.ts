import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const channelEnum = pgEnum("channel", ["call", "sms", "whatsapp"]);
export const logDirectionEnum = pgEnum("log_direction", ["inbound", "outbound"]);

export const communicationLogsTable = pgTable("communication_logs", {
  id: serial("id").primaryKey(),
  channel: channelEnum("channel").notNull(),
  direction: logDirectionEnum("direction").notNull(),
  from: text("from_number").notNull(),
  to: text("to_number").notNull(),
  status: text("status").notNull(),
  body: text("body"),
  duration: integer("duration"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activityItemsTable = pgTable("activity_items", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  meta: text("meta"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLogSchema = createInsertSchema(communicationLogsTable).omit({ id: true, createdAt: true });
export const insertActivitySchema = createInsertSchema(activityItemsTable).omit({ id: true, createdAt: true });

export type InsertLog = z.infer<typeof insertLogSchema>;
export type CommunicationLog = typeof communicationLogsTable.$inferSelect;
export type ActivityItem = typeof activityItemsTable.$inferSelect;
