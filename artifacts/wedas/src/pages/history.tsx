import { useState } from "react";
import { useListRecognitions, useListCategories } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, ArrowRight } from "lucide-react";

function RecognitionRow({ r, type }: { r: any; type: "sent" | "received" }) {
  const person = type === "sent" ? r.receiver : r.sender;
  const iconMap: Record<string, string> = { handshake: "TQ", lightbulb: "IN", star: "EA", "check-circle": "QE" };
  const iconText = iconMap[r.category?.icon] ?? r.category?.name?.substring(0, 2) ?? "WD";

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors" data-testid={`row-recognition-${r.id}`}>
      <div className="flex items-center gap-2 shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">{person?.name?.substring(0, 2).toUpperCase() ?? "??"}</AvatarFallback>
        </Avatar>
        {type === "sent" ? <ArrowRight className="h-4 w-4 text-muted-foreground" /> : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{person?.name ?? "Desconhecido"}</span>
          <span className="text-xs text-muted-foreground">{person?.department}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{r.message}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{iconText} {r.category?.name}</span>
          {r.status === "cancelled" && <Badge variant="destructive" className="text-xs">Cancelado</Badge>}
          <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("pt-BR")}</span>
        </div>
      </div>
      <div className="shrink-0">
        <Badge className="bg-primary/10 text-primary border-0 font-semibold">{type === "sent" ? "-" : "+"}{r.coins}</Badge>
      </div>
    </div>
  );
}

function RecognitionList({ type }: { type: "sent" | "received" }) {
  const [categoryId, setCategoryId] = useState<string>("");
  const { data: categories } = useListCategories();

  const params = {
    type,
    ...(categoryId && categoryId !== "all" ? { categoryId: parseInt(categoryId) } : {}),
  };

  const { data, isLoading } = useListRecognitions(params);

  if (isLoading) return (
    <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-48" data-testid="select-category-filter">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!data?.length ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border bg-muted/30">
          <Coins className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum registro encontrado</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((r) => (
            <RecognitionRow key={r.id} r={r} type={type} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Histórico</h1>
        <p className="text-muted-foreground mt-1">Todos os reconhecimentos enviados e recebidos</p>
      </div>

      <Tabs defaultValue="received">
        <TabsList className="mb-4">
          <TabsTrigger value="received" data-testid="tab-received">Recebidos</TabsTrigger>
          <TabsTrigger value="sent" data-testid="tab-sent">Enviados</TabsTrigger>
        </TabsList>
        <TabsContent value="received">
          <RecognitionList type="received" />
        </TabsContent>
        <TabsContent value="sent">
          <RecognitionList type="sent" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
