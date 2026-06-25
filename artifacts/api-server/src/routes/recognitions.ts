import { Router } from "express";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db, recognitionsTable, usersTable, categoriesTable } from "@workspace/db";
import { ListRecognitionsQueryParams, SendRecognitionBody, CancelRecognitionParams } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";
import { ensureMonthlyAllocation, getSentThisMonth } from "../lib/allocations";
import type { SQL } from "drizzle-orm";

const router = Router();

async function enrichRecognition(row: typeof recognitionsTable.$inferSelect) {
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
}

router.get("/recognitions", requireAuth, async (req, res): Promise<void> => {
  const parsed = ListRecognitionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const type = parsed.data.type ?? "all";
  const conditions: SQL[] = [];

  if (type === "sent") {
    conditions.push(eq(recognitionsTable.senderId, req.userId!));
  } else if (type === "received") {
    conditions.push(eq(recognitionsTable.receiverId, req.userId!));
  } else if (parsed.data.userId) {
    conditions.push(eq(recognitionsTable.receiverId, parsed.data.userId));
  }

  if (parsed.data.categoryId) {
    conditions.push(eq(recognitionsTable.categoryId, parsed.data.categoryId));
  }

  if (parsed.data.startDate) {
    conditions.push(gte(recognitionsTable.createdAt, new Date(parsed.data.startDate)));
  }

  if (parsed.data.endDate) {
    conditions.push(lte(recognitionsTable.createdAt, new Date(parsed.data.endDate)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(recognitionsTable)
    .where(whereClause)
    .orderBy(desc(recognitionsTable.createdAt));

  const result = await Promise.all(rows.map(enrichRecognition));
  const limited = parsed.data.limit ? result.slice(0, parsed.data.limit) : result;
  res.json(limited);
});

router.post("/recognitions", requireAuth, async (req, res): Promise<void> => {
  const parsed = SendRecognitionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const senderId = req.userId!;
  const role = req.userRole ?? "employee";

  if (parsed.data.receiverId === senderId) {
    res.status(400).json({ error: "Você não pode enviar Wédas para si mesmo" });
    return;
  }

  if (role !== "hr") {
    const allocation = await ensureMonthlyAllocation(senderId, role);
    const sent = await getSentThisMonth(senderId);
    const available = Math.max(0, allocation.allocatedCoins - sent);

    if (parsed.data.coins > available) {
      res.status(400).json({ error: `Saldo insuficiente. Você tem ${available} Wédas disponíveis` });
      return;
    }
  }

  const [recognition] = await db
    .insert(recognitionsTable)
    .values({
      senderId,
      receiverId: parsed.data.receiverId,
      categoryId: parsed.data.categoryId,
      coins: parsed.data.coins,
      message: parsed.data.message,
    })
    .returning();

  res.status(201).json(await enrichRecognition(recognition));
});

router.patch("/recognitions/:id/cancel", requireAuth, requireRole("hr"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CancelRecognitionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [recognition] = await db
    .update(recognitionsTable)
    .set({ status: "cancelled", cancelledAt: new Date(), cancelledBy: req.userId! })
    .where(eq(recognitionsTable.id, params.data.id))
    .returning();

  if (!recognition) {
    res.status(404).json({ error: "Reconhecimento não encontrado" });
    return;
  }

  res.json(await enrichRecognition(recognition));
});

export default router;
