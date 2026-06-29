import { Router } from "express";
import { db, usersTable, callsTable, smsMessagesTable, whatsappMessagesTable, contactsTable, agentsTable, activityItemsTable } from "@workspace/db";
import { eq, count, gte, sql } from "drizzle-orm";

const router = Router();

router.get("/stats", async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [[totalCalls], [activeCalls], [totalSms], [totalWhatsapp], [totalContacts], [totalAgents], [activeAgents], [onlineUsers], [callsToday], [smsToday], [waToday]] =
    await Promise.all([
      db.select({ count: count() }).from(callsTable),
      db.select({ count: count() }).from(callsTable).where(eq(callsTable.status, "in-progress")),
      db.select({ count: count() }).from(smsMessagesTable),
      db.select({ count: count() }).from(whatsappMessagesTable),
      db.select({ count: count() }).from(contactsTable),
      db.select({ count: count() }).from(agentsTable),
      db.select({ count: count() }).from(agentsTable).where(eq(agentsTable.status, "active")),
      db.select({ count: count() }).from(usersTable).where(eq(usersTable.isOnline, true)),
      db.select({ count: count() }).from(callsTable).where(gte(callsTable.createdAt, today)),
      db.select({ count: count() }).from(smsMessagesTable).where(gte(smsMessagesTable.createdAt, today)),
      db.select({ count: count() }).from(whatsappMessagesTable).where(gte(whatsappMessagesTable.createdAt, today)),
    ]);

  res.json({
    totalCalls: totalCalls.count,
    activeCalls: activeCalls.count,
    totalSms: totalSms.count,
    totalWhatsapp: totalWhatsapp.count,
    totalContacts: totalContacts.count,
    totalAgents: totalAgents.count,
    activeAgents: activeAgents.count,
    onlineUsers: onlineUsers.count,
    callsToday: callsToday.count,
    smsToday: smsToday.count,
    whatsappToday: waToday.count,
  });
});

router.get("/recent-activity", async (_req, res) => {
  const items = await db.select().from(activityItemsTable).orderBy(sql`${activityItemsTable.createdAt} desc`).limit(20);
  res.json(items);
});

router.get("/online-users", async (_req, res) => {
  const users = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    role: usersTable.role,
    isOnline: usersTable.isOnline,
    avatarUrl: usersTable.avatarUrl,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.isOnline, true));
  res.json(users);
});

export default router;
