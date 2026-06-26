import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, AlertCircle } from "lucide-react";
import heroBg from "@assets/bh_home_1782438117211.png";
import companyLogo from "@assets/logo_(1)_1782440246700.svg";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login({ email, password });
      setLocation("/dashboard");
    } catch {
      setError("E-mail ou senha inválidos. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[#0F172A]/70" />
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Raleway', sans-serif" }}>Wédas</span>
            </div>
            <div className="w-px h-8 bg-white/30" />
            <img src={companyLogo} alt="Logo" className="h-8 w-auto" />
          </div>
          <div>
            <blockquote
              className="font-semibold leading-tight mb-8"
              style={{ fontFamily: "'Raleway', sans-serif", fontSize: "2rem" }}
            >
              "Reconhecer é mais do que<br />
              agradecer: é construir uma<br />
              cultura de excelência."
            </blockquote>
            <div className="flex gap-10">
              <div>
                <div className="text-4xl font-extrabold text-primary" style={{ fontFamily: "'Raleway', sans-serif" }}>10x</div>
                <div className="text-xs text-slate-300 mt-1 uppercase tracking-wide">mais engajamento</div>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-primary" style={{ fontFamily: "'Raleway', sans-serif" }}>100%</div>
                <div className="text-xs text-slate-300 mt-1 uppercase tracking-wide">rastreável</div>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-primary" style={{ fontFamily: "'Raleway', sans-serif" }}>0</div>
                <div className="text-xs text-slate-300 mt-1 uppercase tracking-wide">planilhas</div>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-widest">Plataforma interna de reconhecimento corporativo</div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Coins className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">Wédas</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Entrar</h1>
          <p className="text-muted-foreground mb-8">Acesse sua conta para reconhecer colegas</p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                data-testid="input-email"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                data-testid="input-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-submit">
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-8 p-4 rounded-lg bg-muted text-sm text-muted-foreground">
            <p className="font-medium mb-1">Credenciais de demonstração:</p>
            <p>RH: rh@wedas.com / senha123</p>
            <p>Colaborador: gabriel.garcia@wedas.com / senha123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
