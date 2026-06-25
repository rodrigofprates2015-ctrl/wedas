import { useAuth } from "@/hooks/use-auth";
import { useGetMyDashboard, useGetSettings } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Coins, TrendingUp, TrendingDown, DollarSign, ArrowRight, Infinity } from "lucide-react";

function StatCard({ title, value, sub, icon: Icon, accent, warn }: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
  warn?: boolean;
}) {
  const color = accent ? "primary" : warn ? "destructive" : "muted";
  return (
    <Card className={`border ${accent ? "border-primary/30 bg-primary/5" : warn ? "border-orange-300/40 bg-orange-50/50 dark:bg-orange-950/20" : "border-border"}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className={`text-3xl font-bold ${accent ? "text-primary" : warn ? "text-orange-600 dark:text-orange-400" : "text-foreground"}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accent ? "bg-primary text-primary-foreground" : warn ? "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300" : "bg-muted text-muted-foreground"}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecognitionCard({ recognition }: { recognition: any }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors" data-testid={`card-recognition-${recognition.id}`}>
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {recognition.sender?.name?.substring(0, 2).toUpperCase() ?? "??"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{recognition.sender?.name ?? "Desconhecido"}</span>
          <span className="text-xs text-muted-foreground">enviou</span>
          <Badge variant="secondary" className="text-xs font-semibold text-primary bg-primary/10">
            {recognition.coins} Wédas
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 truncate">{recognition.message}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
            {recognition.category?.icon} {recognition.category?.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(recognition.createdAt).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useGetMyDashboard();
  const { data: settings } = useGetSettings();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const convRate = Number(settings?.coinConversionRate ?? 0.10);
  const isHr = dashboard?.isUnlimited === true;
  const mandatoryToSend = dashboard?.mandatoryToSend ?? 20;
  const sentThisMonth = dashboard?.sentThisMonth ?? 0;
  const availableToSend = dashboard?.availableBalance ?? Math.max(0, mandatoryToSend - sentThisMonth);
  const receivedThisMonth = dashboard?.receivedThisMonth ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {isHr ? (
        /* HR: unlimited sending */
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Saldo para distribuir"
            value="Ilimitado"
            sub="RH distribui sem limite"
            icon={Infinity}
            accent
          />
          <StatCard
            title="Wédas enviadas no mês"
            value={sentThisMonth}
            sub="reconhecimentos este mês"
            icon={TrendingDown}
          />
          <StatCard
            title="Valor acumulado recebido"
            value={`R$ ${(dashboard?.accumulatedValue ?? 0).toFixed(2)}`}
            sub={`R$ ${convRate.toFixed(2)} por Wéda`}
            icon={DollarSign}
          />
        </div>
      ) : (
        /* Employees & Managers: two sections */
        <div className="space-y-4">
          {/* Mandatory to send section */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Wédas a enviar</h2>
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                title="A enviar este mês"
                value={`${availableToSend} Wédas`}
                sub={`de ${mandatoryToSend} obrigatórias`}
                icon={Coins}
                accent={availableToSend > 0}
                warn={availableToSend === 0 && sentThisMonth > 0}
              />
              <StatCard
                title="Já enviadas"
                value={sentThisMonth}
                sub={`de ${mandatoryToSend} Wédas`}
                icon={TrendingDown}
              />
            </div>
          </div>

          {/* Received section */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Wédas recebidas</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                title="Recebidas no mês"
                value={receivedThisMonth}
                sub="Wédas recebidas"
                icon={TrendingUp}
              />
              <StatCard
                title="Valor acumulado"
                value={`R$ ${(dashboard?.accumulatedValue ?? 0).toFixed(2)}`}
                sub={`R$ ${convRate.toFixed(2)} por Wéda`}
                icon={DollarSign}
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Reconhecimentos recebidos</h2>
          <Link href="/history">
            <span className="text-sm text-primary flex items-center gap-1 hover:underline cursor-pointer">
              Ver histórico <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>

        {!dashboard?.recentRecognitions?.length ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border bg-muted/30">
            <Coins className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum reconhecimento recebido ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Quando colegas te enviarem Wédas, eles aparecerão aqui.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {dashboard.recentRecognitions.map((r) => (
              <RecognitionCard key={r.id} recognition={r} />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-5 rounded-xl bg-primary text-primary-foreground">
        <div>
          <p className="font-semibold text-lg">Enviar Wédas</p>
          <p className="text-primary-foreground/80 text-sm mt-0.5">
            {isHr
              ? "RH pode distribuir Wédas sem limite este mês"
              : availableToSend > 0
                ? `Você ainda precisa distribuir ${availableToSend} Wédas este mês`
                : "Você distribuiu todas as suas Wédas obrigatórias!"
            }
          </p>
        </div>
        <Link href="/send">
          <button className="bg-white text-primary font-semibold px-5 py-2.5 rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2">
            <Coins className="h-4 w-4" /> Reconhecer colega
          </button>
        </Link>
      </div>
    </div>
  );
}
