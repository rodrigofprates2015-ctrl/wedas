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
  LogOut,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
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
    ...(isHr
      ? [
          { name: "Relatórios", href: "/reports", icon: FileText },
          { name: "Usuários", href: "/users", icon: Users },
          { name: "Configurações", href: "/settings", icon: Settings },
        ]
      : []),
  ];

  const NavItem = ({ item }: { item: { name: string; href: string; icon: any } }) => {
    const isActive = location === item.href || location.startsWith(`${item.href}/`);
    return (
      <Link
        href={item.href}
        className="block"
        onClick={onClose}
      >
        <div
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            isActive
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="truncate">{item.name}</span>
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <div className="hidden md:flex h-screen w-64 shrink-0 flex-col bg-card border-r border-border">
        <SidebarContent
          user={user}
          location={location}
          navigation={navigation}
          adminNavigation={adminNavigation}
          NavItem={NavItem}
          logout={logout}
          onClose={undefined}
        />
      </div>

      {/* Mobile sidebar — drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-72 flex flex-col bg-card border-r border-border shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          user={user}
          location={location}
          navigation={navigation}
          adminNavigation={adminNavigation}
          NavItem={NavItem}
          logout={logout}
          onClose={onClose}
          showClose
        />
      </div>
    </>
  );
}

interface SidebarContentProps {
  user: any;
  location: string;
  navigation: any[];
  adminNavigation: any[];
  NavItem: React.ComponentType<{ item: any }>;
  logout: () => void;
  onClose?: () => void;
  showClose?: boolean;
}

function SidebarContent({
  user,
  location,
  navigation,
  adminNavigation,
  NavItem,
  logout,
  onClose,
  showClose,
}: SidebarContentProps) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary" onClick={onClose}>
          <Coins className="h-6 w-6" />
          <span>Wédas</span>
        </Link>
        {showClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
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
        <Link href="/me" className="block mb-3" onClick={onClose}>
          <div
            className={`flex items-center gap-3 px-2 py-2 rounded-md transition-colors ${
              location === "/me" ? "bg-primary/10" : "hover:bg-muted"
            }`}
          >
            <Avatar className="shrink-0">
              {user.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.name} className="object-cover" />
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
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground"
          onClick={() => { logout(); onClose?.(); }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </>
  );
}
