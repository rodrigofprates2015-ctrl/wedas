import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody } from "@workspace/api-zod";
import { signToken, comparePassword, hashPassword, requireAuth } from "../lib/auth";

const router = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email));

  if (!user || !user.active) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const valid = await comparePassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role });

  const { passwordHash: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword, token });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!));

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { passwordHash: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

router.patch("/me", requireAuth, async (req, res): Promise<void> => {
  const { name, department, position } = req.body as Record<string, unknown>;
  const update: Record<string, string> = {};
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) { res.status(400).json({ error: "Nome inválido" }); return; }
    update.name = name.trim();
  }
  if (department !== undefined) {
    if (typeof department !== "string" || !department.trim()) { res.status(400).json({ error: "Departamento inválido" }); return; }
    update.department = department.trim();
  }
  if (position !== undefined) {
    if (typeof position !== "string" || !position.trim()) { res.status(400).json({ error: "Cargo inválido" }); return; }
    update.position = position.trim();
  }

  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "Nenhum campo para atualizar" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(update)
    .where(eq(usersTable.id, req.userId!))
    .returning();

  if (!updated) { res.status(404).json({ error: "Usuário não encontrado" }); return; }

  const { passwordHash: _, ...userWithoutPassword } = updated;
  res.json(userWithoutPassword);
});

router.post("/me/password", requireAuth, async (req, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body as Record<string, unknown>;
  if (typeof currentPassword !== "string" || !currentPassword) {
    res.status(400).json({ error: "Senha atual obrigatória" }); return;
  }
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    res.status(400).json({ error: "Nova senha deve ter pelo menos 6 caracteres" }); return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) { res.status(404).json({ error: "Usuário não encontrado" }); return; }

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) { res.status(400).json({ error: "Senha atual incorreta" }); return; }

  const newHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, req.userId!));

  res.json({ success: true });
});

router.patch("/me/avatar", requireAuth, async (req, res): Promise<void> => {
  const { avatarUrl } = req.body as Record<string, unknown>;
  if (avatarUrl !== null && typeof avatarUrl !== "string") {
    res.status(400).json({ error: "avatarUrl inválido" }); return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ avatarUrl: avatarUrl as string | null })
    .where(eq(usersTable.id, req.userId!))
    .returning();

  if (!updated) { res.status(404).json({ error: "Usuário não encontrado" }); return; }

  const { passwordHash: _, ...userWithoutPassword } = updated;
  res.json(userWithoutPassword);
});

export default router;
