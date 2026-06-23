import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useListUsers, useListCategories, useSendRecognition, useGetMyBalance, getGetMyDashboardQueryKey, getGetMyBalanceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Coins, Check, ChevronRight, Search, ArrowLeft } from "lucide-react";

const COIN_OPTIONS = [2, 5, 10, 15, 20];
const MAX_MESSAGE = 300;

const CATEGORY_ICONS: Record<string, string> = {
  handshake: "TQ",
  lightbulb: "IN",
  star: "EA",
  "check-circle": "QE",
};

export default function SendPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedCoins, setSelectedCoins] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [message, setMessage] = useState("");

  const { data: users, isLoading: usersLoading } = useListUsers({ search: search || undefined });
  const { data: categories } = useListCategories();
  const { data: balance } = useGetMyBalance();
  const sendMutation = useSendRecognition();

  const handleSend = async () => {
    if (!selectedUser || !selectedCoins || !selectedCategory || !message.trim()) return;
    try {
      await sendMutation.mutateAsync({
        data: {
          receiverId: selectedUser.id,
          coins: selectedCoins,
          categoryId: selectedCategory.id,
          message,
        },
      });
      queryClient.invalidateQueries({ queryKey: getGetMyDashboardQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMyBalanceQueryKey() });
      toast({ title: "Wédas enviadas!", description: `Você reconheceu ${selectedUser.name} com ${selectedCoins} Wédas.` });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err?.data?.error ?? "Tente novamente.", variant: "destructive" });
    }
  };

  const available = balance?.available ?? 0;

  const steps = [
    { num: 1, label: "Colaborador" },
    { num: 2, label: "Quantidade" },
    { num: 3, label: "Categoria" },
    { num: 4, label: "Mensagem" },
    { num: 5, label: "Confirmar" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Enviar Wédas</h1>
        <p className="text-muted-foreground mt-1">Saldo disponível: <span className="font-semibold text-primary">{available} Wédas</span></p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold transition-colors ${step > s.num ? "bg-primary text-primary-foreground" : step === s.num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {step > s.num ? <Check className="h-4 w-4" /> : s.num}
            </div>
            <span className={`text-sm hidden sm:inline ${step === s.num ? "font-medium text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select colleague */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Selecione um colaborador</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-user"
            />
          </div>
          {usersLoading ? (
            <div className="text-sm text-muted-foreground text-center py-4">Buscando...</div>
          ) : (
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {(users ?? []).map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setSelectedUser(u); setStep(2); }}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors hover:border-primary hover:bg-primary/5 ${selectedUser?.id === u.id ? "border-primary bg-primary/5" : "border-border"}`}
                  data-testid={`button-select-user-${u.id}`}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{u.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.position} · {u.department}</p>
                  </div>
                </button>
              ))}
              {users?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum colaborador encontrado</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select coins */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Quantas Wédas enviar para <span className="text-primary">{selectedUser?.name}</span>?</h2>
          <div className="grid grid-cols-5 gap-3">
            {COIN_OPTIONS.filter(c => c <= available).map((coins) => (
              <button
                key={coins}
                onClick={() => setSelectedCoins(coins)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 font-bold transition-colors ${selectedCoins === coins ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                data-testid={`button-coins-${coins}`}
              >
                <Coins className="h-5 w-5 mb-1" />
                {coins}
              </button>
            ))}
          </div>
          {available === 0 && <p className="text-sm text-destructive">Você não tem saldo disponível este mês.</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
            <Button disabled={!selectedCoins} onClick={() => setStep(3)} data-testid="button-next-step2">Continuar <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Step 3: Select category */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Selecione uma categoria</h2>
          <div className="grid grid-cols-2 gap-3">
            {(categories ?? []).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors ${selectedCategory?.id === cat.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                data-testid={`button-category-${cat.id}`}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {CATEGORY_ICONS[cat.icon] ?? cat.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
            <Button disabled={!selectedCategory} onClick={() => setStep(4)} data-testid="button-next-step3">Continuar <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Step 4: Message */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Escreva uma mensagem</h2>
          <div>
            <Textarea
              placeholder="Descreva o motivo do reconhecimento... (ex: Obrigado pela ajuda no projeto!)"
              rows={5}
              maxLength={MAX_MESSAGE}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              data-testid="textarea-message"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/{MAX_MESSAGE}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
            <Button disabled={!message.trim()} onClick={() => setStep(5)} data-testid="button-next-step4">Continuar <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Step 5: Confirm */}
      {step === 5 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Confirmar envio</h2>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Destinatário</span>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{selectedUser?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{selectedUser?.name}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Quantidade</span>
              <Badge className="bg-primary/10 text-primary border-0 font-semibold">{selectedCoins} Wédas</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Categoria</span>
              <span className="font-medium">{selectedCategory?.name}</span>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground mb-1">Mensagem</p>
              <p className="text-sm">{message}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(4)}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
            <Button onClick={handleSend} disabled={sendMutation.isPending} className="flex-1" data-testid="button-confirm-send">
              {sendMutation.isPending ? "Enviando..." : "Confirmar envio"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
