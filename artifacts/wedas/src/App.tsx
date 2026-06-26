import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import SendPage from "@/pages/send";
import HistoryPage from "@/pages/history";
import HrDashboardPage from "@/pages/hr-dashboard";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings-page";
import UsersPage from "@/pages/users-page";
import ProfilePage from "@/pages/profile";
import MyProfilePage from "@/pages/my-profile";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      throwOnError: false,
    },
  },
});

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType; roles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) return <Redirect to="/login" />;

  if (roles && !roles.includes(user.role)) {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Router() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/">
          {user ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
        </Route>
        <Route path="/dashboard">
          <ProtectedRoute component={DashboardPage} />
        </Route>
        <Route path="/send">
          <ProtectedRoute component={SendPage} />
        </Route>
        <Route path="/history">
          <ProtectedRoute component={HistoryPage} />
        </Route>
        <Route path="/hr-dashboard">
          <ProtectedRoute component={HrDashboardPage} roles={["hr", "manager"]} />
        </Route>
        <Route path="/reports">
          <ProtectedRoute component={ReportsPage} roles={["hr"]} />
        </Route>
        <Route path="/settings">
          <ProtectedRoute component={SettingsPage} roles={["hr"]} />
        </Route>
        <Route path="/users">
          <ProtectedRoute component={UsersPage} roles={["hr"]} />
        </Route>
        <Route path="/profile/:id">
          <ProtectedRoute component={ProfilePage} />
        </Route>
        <Route path="/me">
          <ProtectedRoute component={MyProfilePage} />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
