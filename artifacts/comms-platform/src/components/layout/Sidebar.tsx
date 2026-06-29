import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Phone,
  MessageSquare,
  MessageCircle,
  Users,
  Bot,
  Settings,
  Shield,
  Activity,
  LogOut,
} from "lucide-react";
import { useGetActiveCalls, useGetWhatsappConversations } from "@workspace/api-client-react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const { data: activeCalls } = useGetActiveCalls({ query: { refetchInterval: 5000 } as any });
  const { data: whatsappConversations } = useGetWhatsappConversations({ query: { refetchInterval: 5000 } as any });

  const activeCallCount = activeCalls?.length || 0;
  const unreadWhatsappCount = whatsappConversations?.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0) || 0;

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/calls", label: "Calls", icon: Phone, badge: activeCallCount > 0 ? activeCallCount : null },
    { href: "/sms", label: "SMS", icon: MessageSquare },
    { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle, badge: unreadWhatsappCount > 0 ? unreadWhatsappCount : null },
    { href: "/contacts", label: "Contacts", icon: Users },
    { href: "/agents", label: "Agents", icon: Bot },
  ];

  const adminLinks = [
    { href: "/admin/users", label: "Users", icon: Shield },
    { href: "/admin/logs", label: "Logs", icon: Activity },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col font-mono text-sm">
      <div className="p-4 border-b border-sidebar-border flex items-center gap-2">
        <div className="w-6 h-6 bg-primary rounded-sm shadow-[0_0_10px_rgba(0,255,255,0.5)]"></div>
        <span className="font-bold tracking-tight text-primary uppercase">CommsPro</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        <div className="space-y-1">
          <div className="text-xs text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-2">Main</div>
          {links.map((link) => {
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <div
                  className={`flex items-center gap-3 px-2 py-1.5 rounded-sm cursor-pointer transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-primary font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <link.icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-sidebar-foreground/70"}`} />
                  <span className="flex-1">{link.label}</span>
                  {link.badge !== null && (
                    <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-sm min-w-[20px] text-center font-bold">
                      {link.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {user?.role === "admin" && (
          <div className="space-y-1">
            <div className="text-xs text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-2">Admin</div>
            {adminLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <div
                    className={`flex items-center gap-3 px-2 py-1.5 rounded-sm cursor-pointer transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-primary font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <link.icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-sidebar-foreground/70"}`} />
                    <span>{link.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-sidebar-accent flex items-center justify-center text-primary font-bold">
              {user?.name?.[0] || "U"}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">{user?.name}</span>
              <span className="text-[10px] text-sidebar-foreground/50 leading-tight">{user?.role}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
