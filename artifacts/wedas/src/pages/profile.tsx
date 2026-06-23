import { useParams } from "wouter";
import { useGetUser, useListRecognitions, getGetUserQueryKey } from "@workspace/api-client-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Briefcase, Coins, TrendingUp } from "lucide-react";

const ROLE_LABELS: Record<string, string> = { employee: "Colaborador", manager: "Gestor", hr: "RH" };
const ICON_MAP: Record<string, string> = { handshake: "TQ", lightbulb: "IN", star: "EA", "check-circle": "QE" };

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = parseInt(params.id ?? "0");

  const { data: user, isLoading: userLoading } = useGetUser(userId, {
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId) },
  });

  const { data: recognitions, isLoading: recLoading } = useListRecognitions(
    { userId, type: "received" }
  );

  const totalCoins = recognitions?.reduce((acc, r) => acc + r.coins, 0) ?? 0;

  if (userLoading) return (
    <div className="space-y-6 max-w-2xl">
      <Skeleton className="h-40" />
      <Skeleton className="h-24" />
    </div>
  );

  if (!user) return (
    <div className="text-center py-16 text-muted-foreground">
      <p>Usuário não encontrado.</p>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">{ROLE_LABELS[user.role] ?? user.role}</Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{user.position}</span>
                <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{user.department}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Coins className="h-4 w-4" />Wédas recebidas</div>
              <p className="text-2xl font-bold text-primary">{totalCoins}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><TrendingUp className="h-4 w-4" />Reconhecimentos</div>
              <p className="text-2xl font-bold">{recognitions?.length ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">Reconhecimentos recebidos</h2>
        {recLoading ? (
          <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-20" />)}</div>
        ) : !recognitions?.length ? (
          <p className="text-muted-foreground text-sm text-center py-8">Nenhum reconhecimento ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recognitions.map((r) => (
              <div key={r.id} className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card" data-testid={`card-recognition-${r.id}`}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{r.sender?.name?.substring(0, 2).toUpperCase() ?? "??"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.sender?.name}</span>
                    <Badge className="bg-primary/10 text-primary border-0 text-xs">{r.coins} Wédas</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{r.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{ICON_MAP[r.category?.icon ?? ""] ?? "WD"} {r.category?.name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
