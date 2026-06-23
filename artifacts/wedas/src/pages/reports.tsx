import { useGetUsersReport, useGetFinancialReport, useGetCategoriesReport } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

const ROLE_LABELS: Record<string, string> = { employee: "Colaborador", manager: "Gestor", hr: "RH" };
const ICON_MAP: Record<string, string> = { handshake: "TQ", lightbulb: "IN", star: "EA", "check-circle": "QE" };

function UsersReportTab() {
  const { data, isLoading } = useGetUsersReport();
  if (isLoading) return <div className="space-y-2">{[0,1,2,3,4].map(i => <Skeleton key={i} className="h-12" />)}</div>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Departamento</TableHead>
          <TableHead>Cargo</TableHead>
          <TableHead>Perfil</TableHead>
          <TableHead className="text-right">Recebidas</TableHead>
          <TableHead className="text-right">Enviadas</TableHead>
          <TableHead className="text-right">Reconh. Recebidos</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(data ?? []).map((entry) => (
          <TableRow key={entry.user.id} data-testid={`row-report-user-${entry.user.id}`}>
            <TableCell className="font-medium">{entry.user.name}</TableCell>
            <TableCell className="text-muted-foreground">{entry.user.department}</TableCell>
            <TableCell className="text-muted-foreground">{entry.user.position}</TableCell>
            <TableCell><Badge variant="outline" className="text-xs">{ROLE_LABELS[entry.user.role] ?? entry.user.role}</Badge></TableCell>
            <TableCell className="text-right font-semibold text-primary">{entry.coinsReceived}</TableCell>
            <TableCell className="text-right">{entry.coinsSent}</TableCell>
            <TableCell className="text-right">{entry.recognitionsReceived}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function FinancialReportTab() {
  const { data, isLoading } = useGetFinancialReport();
  if (isLoading) return <div className="space-y-2">{[0,1,2,3,4].map(i => <Skeleton key={i} className="h-12" />)}</div>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Departamento</TableHead>
          <TableHead className="text-right">Total Wédas</TableHead>
          <TableHead className="text-right">Valor Monetário</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(data ?? []).map((entry) => (
          <TableRow key={entry.user.id} data-testid={`row-report-financial-${entry.user.id}`}>
            <TableCell className="font-medium">{entry.user.name}</TableCell>
            <TableCell className="text-muted-foreground">{entry.user.department}</TableCell>
            <TableCell className="text-right font-semibold text-primary">{entry.totalCoins}</TableCell>
            <TableCell className="text-right font-semibold">R$ {entry.monetaryValue.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CategoriesReportTab() {
  const { data, isLoading } = useGetCategoriesReport();
  if (isLoading) return <div className="space-y-2">{[0,1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Categoria</TableHead>
          <TableHead className="text-right">Total Wédas</TableHead>
          <TableHead className="text-right">Reconhecimentos</TableHead>
          <TableHead className="text-right">Participação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(data ?? []).map((entry) => (
          <TableRow key={entry.category.id} data-testid={`row-report-category-${entry.category.id}`}>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  {ICON_MAP[entry.category.icon] ?? entry.category.name?.substring(0, 2)}
                </span>
                {entry.category.name}
              </div>
            </TableCell>
            <TableCell className="text-right font-semibold text-primary">{entry.totalCoins}</TableCell>
            <TableCell className="text-right">{entry.totalRecognitions}</TableCell>
            <TableCell className="text-right">{entry.percentage.toFixed(1)}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground mt-1">Dados consolidados do programa de reconhecimento</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Colaboradores</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <UsersReportTab />
          </div>
        </TabsContent>
        <TabsContent value="financial">
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <FinancialReportTab />
          </div>
        </TabsContent>
        <TabsContent value="categories">
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <CategoriesReportTab />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
