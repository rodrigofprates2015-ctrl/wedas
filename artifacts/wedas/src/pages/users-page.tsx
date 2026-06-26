import { useState, useEffect } from "react";
import { useListUsers, useCreateUser, useUpdateUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Search } from "lucide-react";

const ROLE_LABELS: Record<string, string> = { employee: "Colaborador", manager: "Gestor", hr: "RH" };

function UserFormDialog({ open, onClose, user }: { open: boolean; onClose: () => void; user?: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const isEdit = !!user;

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    department: user?.department ?? "",
    position: user?.position ?? "",
    role: user?.role ?? "employee",
    active: user?.active !== undefined ? String(user.active) : "true",
  });

  useEffect(() => {
    setForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      department: user?.department ?? "",
      position: user?.position ?? "",
      role: user?.role ?? "employee",
      active: user?.active !== undefined ? String(user.active) : "true",
    });
  }, [user]);

  const handleChange = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: user.id,
          data: { name: form.name, department: form.department, position: form.position, role: form.role as any, active: form.active === "true" },
        });
        toast({ title: "Usuário atualizado!" });
      } else {
        await createMutation.mutateAsync({
          data: { name: form.name, email: form.email, password: form.password, department: form.department, position: form.position, role: form.role as any },
        });
        toast({ title: "Usuário criado!" });
      }
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      onClose();
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Nome completo</Label>
            <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} data-testid="input-user-name" />
          </div>
          {!isEdit && (
            <>
              <div className="grid gap-2">
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} data-testid="input-user-email" />
              </div>
              <div className="grid gap-2">
                <Label>Senha</Label>
                <Input type="password" value={form.password} onChange={(e) => handleChange("password", e.target.value)} data-testid="input-user-password" />
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Departamento</Label>
              <Input value={form.department} onChange={(e) => handleChange("department", e.target.value)} data-testid="input-user-department" />
            </div>
            <div className="grid gap-2">
              <Label>Cargo</Label>
              <Input value={form.position} onChange={(e) => handleChange("position", e.target.value)} data-testid="input-user-position" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Perfil</Label>
              <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Colaborador</SelectItem>
                  <SelectItem value="manager">Gestor</SelectItem>
                  <SelectItem value="hr">RH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isEdit && (
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.active} onValueChange={(v) => handleChange("active", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-user">
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const { data: users, isLoading } = useListUsers({ search: search || undefined });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground mt-1">Gerenciar colaboradores da plataforma</p>
        </div>
        <Button onClick={() => { setEditUser(null); setDialogOpen(true); }} data-testid="button-new-user">
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar colaborador..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-users"
        />
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-4 space-y-3">{[0,1,2,3,4].map(i => <Skeleton key={i} className="h-12" />)}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users ?? []).map((u) => (
                <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">{u.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{u.department}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{u.position}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{ROLE_LABELS[u.role] ?? u.role}</Badge></TableCell>
                  <TableCell>
                    <Badge className={u.active ? "bg-green-100 text-green-700 border-0" : "bg-muted text-muted-foreground border-0"}>
                      {u.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setEditUser(u); setDialogOpen(true); }} data-testid={`button-edit-user-${u.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <UserFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditUser(null); }}
        user={editUser}
      />
    </div>
  );
}
