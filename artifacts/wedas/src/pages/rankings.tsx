import { useGetRankingByReceived, useGetRankingBySent, useGetRankingByCategory } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, Coins } from "lucide-react";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="h-7 w-7 rounded-full bg-yellow-400 text-white flex items-center justify-center"><Trophy className="h-4 w-4" /></div>;
  if (rank === 2) return <div className="h-7 w-7 rounded-full bg-slate-400 text-white flex items-center justify-center"><Medal className="h-4 w-4" /></div>;
  if (rank === 3) return <div className="h-7 w-7 rounded-full bg-amber-600 text-white flex items-center justify-center"><Medal className="h-4 w-4" /></div>;
  return <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold">#{rank}</div>;
}

function UserRankingList({ data, isLoading, label }: { data: any[] | undefined; isLoading: boolean; label: string }) {
  const max = data?.[0]?.totalCoins ?? 1;
  if (isLoading) return <div className="space-y-3">{[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16" />)}</div>;
  if (!data?.length) return (
    <div className="flex flex-col items-center py-16 text-muted-foreground">
      <Coins className="h-8 w-8 mb-2" />
      <p>Nenhum dado disponível</p>
    </div>
  );
  return (
    <div className="flex flex-col gap-3">
      {data.map((entry) => (
        <div key={entry.user.id} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card" data-testid={`row-ranking-${entry.rank}`}>
          <RankBadge rank={entry.rank} />
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">{entry.user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium truncate">{entry.user.name}</p>
              <Badge className="bg-primary/10 text-primary border-0 font-semibold ml-2 shrink-0">{entry.totalCoins} Wédas</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-1.5">{entry.user.department} · {entry.totalRecognitions} reconhecimentos</p>
            <Progress value={(entry.totalCoins / max) * 100} className="h-1.5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryRankingList() {
  const { data, isLoading } = useGetRankingByCategory();
  const max = data?.[0]?.totalCoins ?? 1;
  const iconMap: Record<string, string> = { handshake: "TQ", lightbulb: "IN", star: "EA", "check-circle": "QE" };

  if (isLoading) return <div className="space-y-3">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div className="flex flex-col gap-3">
      {(data ?? []).map((entry, i) => (
        <div key={entry.category.id} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card" data-testid={`row-category-ranking-${i}`}>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {iconMap[entry.category.icon] ?? entry.category.name?.substring(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium">{entry.category.name}</p>
              <Badge className="bg-primary/10 text-primary border-0 font-semibold">{entry.totalCoins} Wédas</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-1.5">{entry.totalRecognitions} reconhecimentos</p>
            <Progress value={(entry.totalCoins / max) * 100} className="h-1.5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RankingsPage() {
  const { data: received, isLoading: lR } = useGetRankingByReceived({ limit: 10 });
  const { data: sent, isLoading: lS } = useGetRankingBySent({ limit: 10 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ranking</h1>
        <p className="text-muted-foreground mt-1">Os colaboradores mais reconhecidos e engajados</p>
      </div>

      <Tabs defaultValue="received">
        <TabsList className="mb-4">
          <TabsTrigger value="received" data-testid="tab-most-received">Mais Reconhecidos</TabsTrigger>
          <TabsTrigger value="sent" data-testid="tab-most-sent">Mais Engajados</TabsTrigger>
          <TabsTrigger value="category" data-testid="tab-by-category">Por Categoria</TabsTrigger>
        </TabsList>
        <TabsContent value="received">
          <UserRankingList data={received} isLoading={lR} label="recebidas" />
        </TabsContent>
        <TabsContent value="sent">
          <UserRankingList data={sent} isLoading={lS} label="enviadas" />
        </TabsContent>
        <TabsContent value="category">
          <CategoryRankingList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
