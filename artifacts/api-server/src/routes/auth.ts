import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth, verifyToken } from "../lib/auth.js";

interface AuthRequest extends Request {
  user: { id: number; email: string; role: string };
}

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  await db.update(usersTable).set({ isOnline: true }).where(eq(usersTable.id, user.id));
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

router.post("/logout", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      await db.update(usersTable).set({ isOnline: false }).where(eq(usersTable.id, payload.id));
    }
  }
  res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, async (req, res) => {
  const authReq = req as unknown as AuthRequest;
  const [found] = await db.select().from(usersTable).where(eq(usersTable.id, authReq.user.id)).limit(1);
  if (!found) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const { passwordHash: _, ...safeUser } = found;
  res.json(safeUser);
});

export default router;
