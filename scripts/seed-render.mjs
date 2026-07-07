import { createRequire } from "module";
import { execSync } from "child_process";

const require = createRequire(import.meta.url);

// Only seed if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.log("No DATABASE_URL — skipping seed");
  process.exit(0);
}

const { drizzle } = await import("drizzle-orm/node-postgres");
const { pg } = await import("drizzle-orm/node-postgres");
const pg2 = await import("pg");
const { usersTable, settingsTable } = await import("./node_modules/@workspace/db/dist/index.js").catch(() => null) ?? {};

if (!usersTable) {
  console.log("DB package not found — skipping seed");
  process.exit(0);
}

import("pg").then(async ({ default: Pg }) => {
  const client = new Pg.Pool({ connectionString: process.env.DATABASE_URL });
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const db = drizzle(client);

  const { usersTable, settingsTable } = await import("@workspace/db");
  const bcrypt = await import("bcryptjs");
  const { eq } = await import("drizzle-orm");

  try {
    const existing = await db.select().from(usersTable).limit(1);
    if (existing.length > 0) {
      console.log("Users already seeded — skipping");
      await client.end();
      process.exit(0);
    }

    const hash = async (p) => bcrypt.default.hash(p, 10);

    await db.insert(usersTable).values([
      { name: "Admin User", email: "admin@commspro.io", passwordHash: await hash("admin123"), role: "admin" },
      { name: "Marcus Agent", email: "marcus@commspro.io", passwordHash: await hash("agent123"), role: "agent" },
      { name: "Aisha Agent", email: "aisha@commspro.io", passwordHash: await hash("agent123"), role: "agent" },
      { name: "James Viewer", email: "james@commspro.io", passwordHash: await hash("agent123"), role: "viewer" },
    ]);

    await db.insert(settingsTable).values({
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",
      twilioWhatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER ?? "",
      updatedAt: new Date(),
    }).onConflictDoNothing();

    console.log("✅ Seed complete — 4 users created");
  } catch (e) {
    console.error("Seed error (non-fatal):", e.message);
  }
  await client.end();
});
