import { Router } from "express";
import { requireAuth } from "../lib/auth";
import { ensureMonthlyAllocation, getSentThisMonth } from "../lib/allocations";

const router = Router();

router.get("/monthly-balance", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const role = req.userRole ?? "employee";
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const allocation = await ensureMonthlyAllocation(userId, role);
  const sent = await getSentThisMonth(userId);
  const mandatoryToSend = allocation.isUnlimited ? null : allocation.allocatedCoins;
  const available = allocation.isUnlimited ? null : Math.max(0, allocation.allocatedCoins - sent);

  res.json({
    mandatoryToSend,
    sent,
    available,
    isUnlimited: allocation.isUnlimited,
    month,
    year,
  });
});

export default router;
