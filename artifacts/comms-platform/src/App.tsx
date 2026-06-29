import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Calls from "@/pages/calls";
import SMS from "@/pages/sms";
import WhatsApp from "@/pages/whatsapp";
import Contacts from "@/pages/contacts";
import Agents from "@/pages/agents";
import AdminUsers from "@/pages/admin-users";
import AdminLogs from "@/pages/admin-logs";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { token } = useAuth();
  if (!token) return <Redirect to="/login" />;
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  const { token } = useAuth();
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {token ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/calls" component={() => <ProtectedRoute component={Calls} />} />
      <Route path="/sms" component={() => <ProtectedRoute component={SMS} />} />
      <Route path="/whatsapp" component={() => <ProtectedRoute component={WhatsApp} />} />
      <Route path="/contacts" component={() => <ProtectedRoute component={Contacts} />} />
      <Route path="/agents" component={() => <ProtectedRoute component={Agents} />} />
      <Route path="/admin/users" component={() => <ProtectedRoute component={AdminUsers} />} />
      <Route path="/admin/logs" component={() => <ProtectedRoute component={AdminLogs} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <div className="dark min-h-screen bg-background text-foreground font-mono">
              <Router />
            </div>
            <Toaster />
          </AuthProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
