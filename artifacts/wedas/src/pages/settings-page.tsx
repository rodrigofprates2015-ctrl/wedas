import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetSettings();
  const updateMutation = useUpdateSettings();

  const [coinLimit, setCoinLimit] = useState("");
  const [convRate, setConvRate] = useState("");

  useEffect(() => {
    if (data) {
      setCoinLimit(String(data.monthlyCoinLimit));
      setConvRate(String(data.coinConversionRate));
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        data: {
          monthlyCoinLimit: parseInt(coinLimit),
          coinConversionRate: parseFloat(convRate),
        },
      });
      queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      toast({ title: "Configurações salvas!", description: "As alterações foram aplicadas." });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">Parâmetros globais do programa Wédas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-5 w-5" />
            Parâmetros do Programa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="coin-limit">Limite mensal de Wédas por colaborador</Label>
            <Input
              id="coin-limit"
              type="number"
              min={1}
              value={coinLimit}
              onChange={(e) => setCoinLimit(e.target.value)}
              data-testid="input-coin-limit"
            />
            <p className="text-xs text-muted-foreground">Quantidade de Wédas que cada colaborador recebe para distribuir por mês.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="conv-rate">Taxa de conversão financeira (R$ por Wéda)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                id="conv-rate"
                type="number"
                step="0.01"
                min={0}
                className="pl-9"
                value={convRate}
                onChange={(e) => setConvRate(e.target.value)}
                data-testid="input-conv-rate"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Exemplo: 1 Wéda = R$ {parseFloat(convRate || "0").toFixed(2)}
            </p>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-settings">
            {updateMutation.isPending ? "Salvando..." : "Salvar configurações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
