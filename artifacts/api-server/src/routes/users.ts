import { Router } from "express";
import { eq, ilike, or } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { ListUsersQueryParams, CreateUserBody, GetUserParams, UpdateUserBody, UpdateUserParams } from "@workspace/api-zod";
import { requireAuth, requireRole, hashPassword } from "../lib/auth";

const router = Router();

router.get("/users", requireAuth, async (req, res): Promise<void> => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let query = db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    department: usersTable.department,
    position: usersTable.position,
    role: usersTable.role,
    active: usersTable.active,
    createdAt: usersTable.createdAt,
  }).from(usersTable).$dynamic();

  const conditions = [];
  conditions.push(eq(usersTable.active, true));

  if (parsed.data.search) {
    conditions.push(
      or(
        ilike(usersTable.name, `%${parsed.data.search}%`),
        ilike(usersTable.email, `%${parsed.data.search}%`)
      )!
    );
  }

  if (parsed.data.department) {
    conditions.push(eq(usersTable.department, parsed.data.department));
  }

  const { and: andOp } = await import("drizzle-orm");
  const users = await query.where(andOp(...(conditions as Parameters<typeof andOp>))).orderBy(usersTable.name);
  res.json(users);
});

router.post("/users", requireAuth, requireRole("hr"), async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const hash = await hashPassword(parsed.data.password);

  const [user] = await db
    .insert(usersTable)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: hash,
      department: parsed.data.department,
      position: parsed.data.position,
      role: parsed.data.role,
    })
    .returning();

  const { passwordHash: _, ...userWithoutPassword } = user;
  res.status(201).json(userWithoutPassword);
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetUserParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      department: usersTable.department,
      position: usersTable.position,
      role: usersTable.role,
      active: usersTable.active,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id));

  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  res.json(user);
});

router.patch("/users/:id", requireAuth, requireRole("hr"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateUserParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  const { passwordHash: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

export default router;
