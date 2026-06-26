import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { 
  Coins, 
  LayoutDashboard, 
  Send, 
  History, 
  BarChart3, 
  FileText, 
  Settings, 
  Users, 
  LogOut 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const isHrOrManager = user.role === "hr" || user.role === "manager";
  const isHr = user.role === "hr";

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Enviar Wédas", href: "/send", icon: Send },
    { name: "Histórico", href: "/history", icon: History },
  ];

  const adminNavigation = [
    ...(isHrOrManager ? [{ name: "Painel RH", href: "/hr-dashboard", icon: BarChart3 }] : []),
    ...(isHr ? [
      { name: "Relatórios", href: "/reports", icon: FileText },
      { name: "Usuários", href: "/users", icon: Users },
      { name: "Configurações", href: "/settings", icon: Settings },
    ] : []),
  ];

  const NavItem = ({ item }: { item: { name: string; href: string; icon: any } }) => {
    const isActive = location === item.href || location.startsWith(`${item.href}/`);
    return (
      <Link href={item.href} className="block">
        <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
          <item.icon className="h-5 w-5" />
          <span>{item.name}</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-card border-r border-border">
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
          <Coins className="h-6 w-6" />
          <span>Wédas</span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        {adminNavigation.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Administração
            </div>
            {adminNavigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <Link href="/me" className="block mb-3">
          <div className={`flex items-center gap-3 px-2 py-2 rounded-md transition-colors ${location === "/me" ? "bg-primary/10" : "hover:bg-muted"}`}>
            <Avatar>
              {(user as any).avatarUrl && (
                <AvatarImage src={(user as any).avatarUrl} alt={user.name} className="object-cover" />
              )}
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user.name}</span>
              <span className="text-xs text-muted-foreground truncate">{user.position}</span>
            </div>
          </div>
        </Link>
        <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}
