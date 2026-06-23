import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { categoriesTable } from "./categories";

export const recognitionStatusEnum = pgEnum("recognition_status", ["active", "cancelled"]);

export const recognitionsTable = pgTable("recognitions", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => usersTable.id),
  receiverId: integer("receiver_id").notNull().references(() => usersTable.id),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id),
  coins: integer("coins").notNull(),
  message: text("message").notNull(),
  status: recognitionStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancelledBy: integer("cancelled_by").references(() => usersTable.id),
});

export const insertRecognitionSchema = createInsertSchema(recognitionsTable).omit({ id: true, createdAt: true, cancelledAt: true, cancelledBy: true, status: true });
export type InsertRecognition = z.infer<typeof insertRecognitionSchema>;
export type Recognition = typeof recognitionsTable.$inferSelect;
