import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { ensureMonthlyAllocation, getSentThisMonth } from "../lib/allocations";

const router = Router();

router.get("/monthly-balance", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const allocation = await ensureMonthlyAllocation(userId);
  const sent = await getSentThisMonth(userId);

  res.json({
    allocated: allocation.allocatedCoins,
    sent,
    available: allocation.allocatedCoins - sent,
    month,
    year,
  });
});

export default router;
