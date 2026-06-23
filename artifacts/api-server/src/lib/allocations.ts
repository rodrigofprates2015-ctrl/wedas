import { db, monthlyAllocationsTable, settingsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export async function ensureMonthlyAllocation(userId: number): Promise<{ allocatedCoins: number }> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const existing = await db
    .select()
    .from(monthlyAllocationsTable)
    .where(
      and(
        eq(monthlyAllocationsTable.userId, userId),
        eq(monthlyAllocationsTable.month, month),
        eq(monthlyAllocationsTable.year, year)
      )
    );

  if (existing.length > 0) {
    return { allocatedCoins: existing[0].allocatedCoins };
  }

  const [settings] = await db.select().from(settingsTable).limit(1);
  const limit = settings?.monthlyCoinLimit ?? 100;

  const [allocation] = await db
    .insert(monthlyAllocationsTable)
    .values({ userId, month, year, allocatedCoins: limit })
    .returning();

  return { allocatedCoins: allocation.allocatedCoins };
}

export async function getSentThisMonth(userId: number): Promise<number> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const { recognitionsTable } = await import("@workspace/db");
  const { gte, lte, eq: eqOp, and: andOp, sum } = await import("drizzle-orm");

  const result = await db
    .select({ total: sum(recognitionsTable.coins) })
    .from(recognitionsTable)
    .where(
      andOp(
        eqOp(recognitionsTable.senderId, userId),
        eqOp(recognitionsTable.status, "active"),
        gte(recognitionsTable.createdAt, startOfMonth),
        lte(recognitionsTable.createdAt, endOfMonth)
      )
    );

  return Number(result[0]?.total ?? 0);
}

export async function ensureAllUsersHaveAllocations(): Promise<void> {
  const users = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.active, true));
  for (const user of users) {
    await ensureMonthlyAllocation(user.id);
  }
}
