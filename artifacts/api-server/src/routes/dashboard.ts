import { Router } from "express";
import { eq, and, gte, lte, sum, count, desc } from "drizzle-orm";
import { db, recognitionsTable, usersTable, categoriesTable, settingsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../lib/auth";
import { ensureMonthlyAllocation, getSentThisMonth } from "../lib/allocations";

const router = Router();

router.get("/dashboard/me", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const allocation = await ensureMonthlyAllocation(userId);
  const sentThisMonth = await getSentThisMonth(userId);
  const available = allocation.allocatedCoins - sentThisMonth;

  const receivedResult = await db
    .select({ total: sum(recognitionsTable.coins) })
    .from(recognitionsTable)
    .where(
      and(
        eq(recognitionsTable.receiverId, userId),
        eq(recognitionsTable.status, "active"),
        gte(recognitionsTable.createdAt, startOfMonth),
        lte(recognitionsTable.createdAt, endOfMonth)
      )
    );

  const receivedThisMonth = Number(receivedResult[0]?.total ?? 0);

  const totalReceivedResult = await db
    .select({ total: sum(recognitionsTable.coins) })
    .from(recognitionsTable)
    .where(and(eq(recognitionsTable.receiverId, userId), eq(recognitionsTable.status, "active")));

  const totalReceived = Number(totalReceivedResult[0]?.total ?? 0);

  const [settings] = await db.select().from(settingsTable).limit(1);
  const conversionRate = Number(settings?.coinConversionRate ?? 0.10);
  const accumulatedValue = totalReceived * conversionRate;

  const rankingRows = await db
    .select({
      userId: recognitionsTable.receiverId,
      totalCoins: sum(recognitionsTable.coins),
    })
    .from(recognitionsTable)
    .where(eq(recognitionsTable.status, "active"))
    .groupBy(recognitionsTable.receiverId)
    .orderBy(desc(sum(recognitionsTable.coins)));

  const rankingIdx = rankingRows.findIndex((r) => r.userId === userId);
  const rankingPosition: number | null = rankingIdx >= 0 ? rankingIdx + 1 : null;

  const recentRows = await db
    .select()
    .from(recognitionsTable)
    .where(
      and(
        eq(recognitionsTable.receiverId, userId),
        eq(recognitionsTable.status, "active")
      )
    )
    .orderBy(desc(recognitionsTable.createdAt))
    .limit(10);

  const recentRecognitions = await Promise.all(
    recentRows.map(async (row) => {
      const [sender] = await db
        .select({ id: usersTable.id, name: usersTable.name, department: usersTable.department, position: usersTable.position })
        .from(usersTable)
        .where(eq(usersTable.id, row.senderId));

      const [receiver] = await db
        .select({ id: usersTable.id, name: usersTable.name, department: usersTable.department, position: usersTable.position })
        .from(usersTable)
        .where(eq(usersTable.id, row.receiverId));

      const [category] = await db
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, row.categoryId));

      return {
        ...row,
        cancelledAt: row.cancelledAt ?? null,
        cancelledBy: row.cancelledBy ?? null,
        sender: sender ?? { id: row.senderId, name: "", department: "", position: "" },
        receiver: receiver ?? { id: row.receiverId, name: "", department: "", position: "" },
        category: category ?? { id: row.categoryId, name: "", icon: "", active: true },
      };
    })
  );

  res.json({
    availableBalance: available,
    allocatedThisMonth: allocation.allocatedCoins,
    receivedThisMonth,
    sentThisMonth,
    accumulatedValue,
    rankingPosition,
    recentRecognitions,
  });
});

router.get("/dashboard/hr", requireAuth, requireRole("hr", "manager"), async (_req, res): Promise<void> => {
  const totalDistributedResult = await db
    .select({ total: sum(recognitionsTable.coins) })
    .from(recognitionsTable)
    .where(eq(recognitionsTable.status, "active"));

  const totalDistributed = Number(totalDistributedResult[0]?.total ?? 0);

  const totalRecognitionsResult = await db
    .select({ total: count(recognitionsTable.id) })
    .from(recognitionsTable)
    .where(eq(recognitionsTable.status, "active"));

  const totalRecognitions = Number(totalRecognitionsResult[0]?.total ?? 0);

  const activeUsersResult = await db
    .select({ total: count(usersTable.id) })
    .from(usersTable)
    .where(eq(usersTable.active, true));

  const activeUsers = Number(activeUsersResult[0]?.total ?? 0);
  const avgPerUser = activeUsers > 0 ? totalRecognitions / activeUsers : 0;

  const categoryRows = await db
    .select({
      categoryId: recognitionsTable.categoryId,
      total: sum(recognitionsTable.coins),
    })
    .from(recognitionsTable)
    .where(eq(recognitionsTable.status, "active"))
    .groupBy(recognitionsTable.categoryId)
    .orderBy(desc(sum(recognitionsTable.coins)))
    .limit(1);

  let topCategory = { id: 0, name: "", icon: "", active: true };
  if (categoryRows.length > 0) {
    const [cat] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryRows[0].categoryId));
    if (cat) topCategory = cat;
  }

  const deptRows = await db
    .select({
      department: usersTable.department,
      total: count(recognitionsTable.id),
    })
    .from(recognitionsTable)
    .leftJoin(usersTable, eq(recognitionsTable.receiverId, usersTable.id))
    .where(eq(recognitionsTable.status, "active"))
    .groupBy(usersTable.department)
    .orderBy(desc(count(recognitionsTable.id)))
    .limit(1);

  const topDepartment = deptRows[0]?.department ?? "";

  const allRows = await db
    .select({
      createdAt: recognitionsTable.createdAt,
      coins: recognitionsTable.coins,
    })
    .from(recognitionsTable)
    .where(eq(recognitionsTable.status, "active"));

  const evolutionMap: Record<string, { month: number; year: number; totalCoins: number; totalRecognitions: number }> = {};
  for (const row of allRows) {
    const d = new Date(row.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (!evolutionMap[key]) {
      evolutionMap[key] = { month: d.getMonth() + 1, year: d.getFullYear(), totalCoins: 0, totalRecognitions: 0 };
    }
    evolutionMap[key].totalCoins += Number(row.coins);
    evolutionMap[key].totalRecognitions += 1;
  }

  const monthlyEvolution = Object.values(evolutionMap).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );

  const senderIds = [...new Set(allRows.map(() => 0))];
  const engagementRate = activeUsers > 0 ? Math.min(100, (totalRecognitions / activeUsers) * 10) : 0;

  res.json({
    totalDistributed,
    totalRecognitions,
    avgPerUser: Math.round(avgPerUser * 100) / 100,
    topCategory,
    topDepartment,
    monthlyEvolution,
    activeUsers,
    engagementRate: Math.round(engagementRate * 100) / 100,
  });
});

export default router;
