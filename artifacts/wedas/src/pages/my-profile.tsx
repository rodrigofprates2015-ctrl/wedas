import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Save, Lock, User, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey, customFetch } from "@workspace/api-client-react";

async function apiFetch(path: string, options: RequestInit = {}) {
  try {
    return await customFetch<Record<string, unknown>>(path, options);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "data" in err) {
      const data = (err as { data?: { error?: string } }).data;
      throw new Error(data?.error ?? "Erro desconhecido");
    }
    throw new Error("Erro desconhecido");
  }
}

export default function MyProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "",
    department: user?.department ?? "",
    position: user?.position ?? "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const avatarUrl = (user as any)?.avatarUrl as string | null | undefined;
  const initials = user?.name?.substring(0, 2).toUpperCase() ?? "?";

  const handleProfileSave = async () => {
    if (!profileForm.name.trim() || !profileForm.department.trim() || !profileForm.position.trim()) {
      toast({ variant: "destructive", title: "Preencha todos os campos" });
      return;
    }
    setProfileLoading(true);
    try {
      await apiFetch("/api/me", {
        method: "PATCH",
        body: JSON.stringify(profileForm),
      });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Perfil atualizado com sucesso!" });
    } catch (err: any) {
      toast({ variant: "destructive", title: err.message ?? "Erro ao salvar perfil" });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast({ variant: "destructive", title: "Preencha todos os campos de senha" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ variant: "destructive", title: "As senhas não coincidem" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ variant: "destructive", title: "A nova senha deve ter pelo menos 6 caracteres" });
      return;
    }
    setPasswordLoading(true);
    try {
      await apiFetch("/api/me/password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Senha alterada com sucesso!" });
    } catch (err: any) {
      toast({ variant: "destructive", title: err.message ?? "Erro ao alterar senha" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "A imagem deve ter no máximo 2 MB" });
      return;
    }

    setAvatarLoading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await apiFetch("/api/me/avatar", {
        method: "PATCH",
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Foto atualizada com sucesso!" });
    } catch (err: any) {
      toast({ variant: "destructive", title: err.message ?? "Erro ao atualizar foto" });
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true);
    try {
      await apiFetch("/api/me/avatar", {
        method: "PATCH",
        body: JSON.stringify({ avatarUrl: null }),
      });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Foto removida" });
    } catch (err: any) {
      toast({ variant: "destructive", title: err.message ?? "Erro ao remover foto" });
    } finally {
      setAvatarLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie suas informações pessoais e segurança</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="h-4 w-4" />
            Foto de Perfil
          </CardTitle>
          <CardDescription>Adicione uma foto para personalizar sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={user.name} className="object-cover" />}
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {avatarLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={avatarLoading}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
              >
                <Camera className="mr-2 h-4 w-4" />
                {avatarUrl ? "Trocar foto" : "Adicionar foto"}
              </Button>
              {avatarUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleRemoveAvatar}
                  disabled={avatarLoading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover foto
                </Button>
              )}
              <p className="text-xs text-muted-foreground">JPG, PNG ou WebP. Máximo 2 MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>Atualize seu nome, cargo e departamento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              value={profileForm.name}
              onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="position">Cargo</Label>
            <Input
              id="position"
              value={profileForm.position}
              onChange={(e) => setProfileForm((f) => ({ ...f, position: e.target.value }))}
              placeholder="Ex: Analista de Dados"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="department">Departamento</Label>
            <Input
              id="department"
              value={profileForm.department}
              onChange={(e) => setProfileForm((f) => ({ ...f, department: e.target.value }))}
              placeholder="Ex: Tecnologia"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">E-mail</Label>
            <Input value={user.email} disabled className="bg-muted/50 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
          </div>
          <Button onClick={handleProfileSave} disabled={profileLoading} className="w-full sm:w-auto">
            {profileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar alterações
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Alterar Senha
          </CardTitle>
          <CardDescription>Use uma senha forte com pelo menos 6 caracteres</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Senha atual</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <Button onClick={handlePasswordChange} disabled={passwordLoading} className="w-full sm:w-auto">
            {passwordLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            Alterar senha
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
