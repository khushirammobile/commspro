import { pgTable, serial, text, boolean, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentTypeEnum = pgEnum("agent_type", [
  "call-handler", "sms-responder", "whatsapp-bot", "scheduler", "monitor"
]);
export const agentStatusEnum = pgEnum("agent_status", ["idle", "active", "busy", "error"]);
export const taskStatusEnum = pgEnum("task_status", ["pending", "running", "completed", "failed"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high"]);

export const agentsTable = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: agentTypeEnum("type").notNull(),
  description: text("description"),
  status: agentStatusEnum("status").notNull().default("idle"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  taskCount: integer("task_count").notNull().default(0),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const agentTasksTable = pgTable("agent_tasks", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agentsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("pending"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const agentActivityTable = pgTable("agent_activity", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agentsTable.id, { onDelete: "cascade" }),
  event: text("event").notNull(),
  detail: text("detail"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAgentSchema = createInsertSchema(agentsTable).omit({ id: true, createdAt: true });
export const insertAgentTaskSchema = createInsertSchema(agentTasksTable).omit({ id: true, createdAt: true });
export const insertAgentActivitySchema = createInsertSchema(agentActivityTable).omit({ id: true, createdAt: true });

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agentsTable.$inferSelect;
export type AgentTask = typeof agentTasksTable.$inferSelect;
export type AgentActivity = typeof agentActivityTable.$inferSelect;
