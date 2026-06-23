import { useGetHrDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, Coins, TrendingUp, Target, Star, Building2 } from "lucide-react";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const ICON_MAP: Record<string, string> = { handshake: "TQ", lightbulb: "IN", star: "EA", "check-circle": "QE" };

function KpiCard({ title, value, sub, icon: Icon }: { title: string; value: string | number; sub?: string; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HrDashboardPage() {
  const { data, isLoading } = useGetHrDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const evolutionData = (data?.monthlyEvolution ?? []).map((e) => ({
    name: `${MONTH_NAMES[(e.month ?? 1) - 1]}/${String(e.year).slice(-2)}`,
    Wédas: e.totalCoins,
    Reconhecimentos: e.totalRecognitions,
  }));

  const topCategoryIcon = ICON_MAP[data?.topCategory?.icon ?? ""] ?? data?.topCategory?.name?.substring(0, 2) ?? "—";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Painel RH</h1>
        <p className="text-muted-foreground mt-1">Visão geral do programa de reconhecimento</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard title="Total distribuído" value={`${data?.totalDistributed ?? 0} Wédas`} icon={Coins} />
        <KpiCard title="Total de reconhecimentos" value={data?.totalRecognitions ?? 0} icon={TrendingUp} />
        <KpiCard title="Média por colaborador" value={(data?.avgPerUser ?? 0).toFixed(1)} sub="reconhecimentos" icon={Target} />
        <KpiCard title="Usuários ativos" value={data?.activeUsers ?? 0} sub="colaboradores" icon={Users} />
        <KpiCard title="Taxa de engajamento" value={`${(data?.engagementRate ?? 0).toFixed(1)}%`} icon={Star} />
        <KpiCard
          title="Departamento mais engajado"
          value={data?.topDepartment || "—"}
          icon={Building2}
        />
      </div>

      {data?.topCategory && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Categoria mais utilizada</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                {topCategoryIcon}
              </div>
              <div>
                <p className="font-semibold text-lg">{data.topCategory.name}</p>
                <p className="text-sm text-muted-foreground">Categoria com mais reconhecimentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {evolutionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Evolução mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={evolutionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="Wédas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Reconhecimentos" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
