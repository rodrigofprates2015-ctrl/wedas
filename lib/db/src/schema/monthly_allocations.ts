import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const monthlyAllocationsTable = pgTable("monthly_allocations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  allocatedCoins: integer("allocated_coins").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMonthlyAllocationSchema = createInsertSchema(monthlyAllocationsTable).omit({ id: true, createdAt: true });
export type InsertMonthlyAllocation = z.infer<typeof insertMonthlyAllocationSchema>;
export type MonthlyAllocation = typeof monthlyAllocationsTable.$inferSelect;
