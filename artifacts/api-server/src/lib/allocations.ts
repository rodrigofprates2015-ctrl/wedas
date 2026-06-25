import { db, monthlyAllocationsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const HR_COINS = 999999;
const EMPLOYEE_MANDATORY_COINS = 20;

export async function ensureMonthlyAllocation(
  userId: number,
  role = "employee"
): Promise<{ allocatedCoins: number; isUnlimited: boolean }> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const isUnlimited = role === "hr";
  const limit = isUnlimited ? HR_COINS : EMPLOYEE_MANDATORY_COINS;

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
    return { allocatedCoins: existing[0].allocatedCoins, isUnlimited };
  }

  const [allocation] = await db
    .insert(monthlyAllocationsTable)
    .values({ userId, month, year, allocatedCoins: limit })
    .returning();

  return { allocatedCoins: allocation.allocatedCoins, isUnlimited };
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
  const users = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.active, true));
  for (const user of users) {
    await ensureMonthlyAllocation(user.id, user.role);
  }
}
