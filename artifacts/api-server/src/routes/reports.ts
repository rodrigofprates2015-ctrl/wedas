import { Router } from "express";
import { eq, sum, count } from "drizzle-orm";
import { db, recognitionsTable, usersTable, categoriesTable, settingsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

router.get("/reports/users", requireAuth, requireRole("hr", "manager"), async (_req, res): Promise<void> => {
  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      department: usersTable.department,
      position: usersTable.position,
      role: usersTable.role,
      active: usersTable.active,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.active, true))
    .orderBy(usersTable.name);

  const result = await Promise.all(
    users.map(async (user) => {
      const received = await db
        .select({ total: sum(recognitionsTable.coins), totalCount: count(recognitionsTable.id) })
        .from(recognitionsTable)
        .where(eq(recognitionsTable.receiverId, user.id));

      const sent = await db
        .select({ total: sum(recognitionsTable.coins), totalCount: count(recognitionsTable.id) })
        .from(recognitionsTable)
        .where(eq(recognitionsTable.senderId, user.id));

      return {
        user,
        coinsReceived: Number(received[0]?.total ?? 0),
        coinsSent: Number(sent[0]?.total ?? 0),
        recognitionsReceived: Number(received[0]?.totalCount ?? 0),
        recognitionsSent: Number(sent[0]?.totalCount ?? 0),
      };
    })
  );

  res.json(result);
});

router.get("/reports/financial", requireAuth, requireRole("hr"), async (_req, res): Promise<void> => {
  const [settings] = await db.select().from(settingsTable).limit(1);
  const rate = Number(settings?.coinConversionRate ?? 0.10);

  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      department: usersTable.department,
      position: usersTable.position,
      role: usersTable.role,
      active: usersTable.active,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.active, true))
    .orderBy(usersTable.name);

  const result = await Promise.all(
    users.map(async (user) => {
      const received = await db
        .select({ total: sum(recognitionsTable.coins) })
        .from(recognitionsTable)
        .where(eq(recognitionsTable.receiverId, user.id));

      const totalCoins = Number(received[0]?.total ?? 0);

      return {
        user,
        totalCoins,
        monetaryValue: Math.round(totalCoins * rate * 100) / 100,
      };
    })
  );

  res.json(result);
});

router.get("/reports/categories", requireAuth, requireRole("hr", "manager"), async (_req, res): Promise<void> => {
  const categories = await db.select().from(categoriesTable);

  const totalResult = await db
    .select({ total: sum(recognitionsTable.coins) })
    .from(recognitionsTable)
    .where(eq(recognitionsTable.status, "active"));

  const grandTotal = Number(totalResult[0]?.total ?? 0);

  const result = await Promise.all(
    categories.map(async (category) => {
      const rows = await db
        .select({ total: sum(recognitionsTable.coins), totalCount: count(recognitionsTable.id) })
        .from(recognitionsTable)
        .where(eq(recognitionsTable.categoryId, category.id));

      const totalCoins = Number(rows[0]?.total ?? 0);
      const totalRecognitions = Number(rows[0]?.totalCount ?? 0);

      return {
        category,
        totalCoins,
        totalRecognitions,
        percentage: grandTotal > 0 ? Math.round((totalCoins / grandTotal) * 10000) / 100 : 0,
      };
    })
  );

  res.json(result.sort((a, b) => b.totalCoins - a.totalCoins));
});

export default router;
