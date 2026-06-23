import { Router } from "express";
import { eq, sum, count, desc } from "drizzle-orm";
import { db, recognitionsTable, usersTable, categoriesTable } from "@workspace/db";
import { GetRankingByReceivedQueryParams, GetRankingBySentQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/rankings/received", requireAuth, async (req, res): Promise<void> => {
  const parsed = GetRankingByReceivedQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

  const rows = await db
    .select({
      userId: recognitionsTable.receiverId,
      totalCoins: sum(recognitionsTable.coins),
      totalRecognitions: count(recognitionsTable.id),
    })
    .from(recognitionsTable)
    .where(eq(recognitionsTable.status, "active"))
    .groupBy(recognitionsTable.receiverId)
    .orderBy(desc(sum(recognitionsTable.coins)))
    .limit(limit);

  const result = await Promise.all(
    rows.map(async (row, index) => {
      const [user] = await db
        .select({ id: usersTable.id, name: usersTable.name, department: usersTable.department, position: usersTable.position })
        .from(usersTable)
        .where(eq(usersTable.id, row.userId));

      return {
        rank: index + 1,
        user: user ?? { id: row.userId, name: "", department: "", position: "" },
        totalCoins: Number(row.totalCoins ?? 0),
        totalRecognitions: Number(row.totalRecognitions ?? 0),
      };
    })
  );

  res.json(result);
});

router.get("/rankings/sent", requireAuth, async (req, res): Promise<void> => {
  const parsed = GetRankingBySentQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

  const rows = await db
    .select({
      userId: recognitionsTable.senderId,
      totalCoins: sum(recognitionsTable.coins),
      totalRecognitions: count(recognitionsTable.id),
    })
    .from(recognitionsTable)
    .where(eq(recognitionsTable.status, "active"))
    .groupBy(recognitionsTable.senderId)
    .orderBy(desc(sum(recognitionsTable.coins)))
    .limit(limit);

  const result = await Promise.all(
    rows.map(async (row, index) => {
      const [user] = await db
        .select({ id: usersTable.id, name: usersTable.name, department: usersTable.department, position: usersTable.position })
        .from(usersTable)
        .where(eq(usersTable.id, row.userId));

      return {
        rank: index + 1,
        user: user ?? { id: row.userId, name: "", department: "", position: "" },
        totalCoins: Number(row.totalCoins ?? 0),
        totalRecognitions: Number(row.totalRecognitions ?? 0),
      };
    })
  );

  res.json(result);
});

router.get("/rankings/by-category", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      categoryId: recognitionsTable.categoryId,
      totalCoins: sum(recognitionsTable.coins),
      totalRecognitions: count(recognitionsTable.id),
    })
    .from(recognitionsTable)
    .where(eq(recognitionsTable.status, "active"))
    .groupBy(recognitionsTable.categoryId)
    .orderBy(desc(sum(recognitionsTable.coins)));

  const result = await Promise.all(
    rows.map(async (row) => {
      const [category] = await db
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, row.categoryId));

      return {
        category: category ?? { id: row.categoryId, name: "", icon: "", active: true },
        totalCoins: Number(row.totalCoins ?? 0),
        totalRecognitions: Number(row.totalRecognitions ?? 0),
      };
    })
  );

  res.json(result);
});

export default router;
