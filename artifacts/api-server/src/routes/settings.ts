import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router = Router();

router.get("/settings", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(settingsTable).limit(1);
  if (rows.length === 0) {
    const [created] = await db
      .insert(settingsTable)
      .values({ coinConversionRate: "0.10", monthlyCoinLimit: 100 })
      .returning();
    res.json({ ...created, coinConversionRate: Number(created.coinConversionRate) });
    return;
  }
  res.json({ ...rows[0], coinConversionRate: Number(rows[0].coinConversionRate) });
});

router.patch("/settings", requireAuth, requireRole("hr"), async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rows = await db.select().from(settingsTable).limit(1);

  if (rows.length === 0) {
    const [created] = await db
      .insert(settingsTable)
      .values({
        coinConversionRate: String(parsed.data.coinConversionRate ?? 0.10),
        monthlyCoinLimit: parsed.data.monthlyCoinLimit ?? 100,
      })
      .returning();
    res.json({ ...created, coinConversionRate: Number(created.coinConversionRate) });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.coinConversionRate !== undefined) {
    updateData.coinConversionRate = String(parsed.data.coinConversionRate);
  }
  if (parsed.data.monthlyCoinLimit !== undefined) {
    updateData.monthlyCoinLimit = parsed.data.monthlyCoinLimit;
  }

  const { eq } = await import("drizzle-orm");
  const [updated] = await db
    .update(settingsTable)
    .set(updateData)
    .where(eq(settingsTable.id, rows[0].id))
    .returning();

  res.json({ ...updated, coinConversionRate: Number(updated.coinConversionRate) });
});

export default router;
