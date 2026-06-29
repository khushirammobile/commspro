import { useGetDashboardStats, useGetRecentActivity, useGetOnlineUsers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, MessageCircle, Users, Bot, TrendingUp, Activity, Circle } from "lucide-react";

export default function Dashboard() {
  const { data: stats } = useGetDashboardStats({ query: { refetchInterval: 10_000 } as any });
  const { data: activity } = useGetRecentActivity({ query: { refetchInterval: 10_000 } as any });
  const { data: online } = useGetOnlineUsers({ query: { refetchInterval: 10_000 } as any });

  const statCards = [
    {
      label: "Total Calls",
      value: stats?.totalCalls ?? "—",
      sub: `${stats?.activeCalls ?? 0} active`,
      icon: Phone,
      color: "text-cyan-400",
    },
    {
      label: "SMS Sent",
      value: stats?.totalSms ?? "—",
      sub: "messages",
      icon: MessageSquare,
      color: "text-emerald-400",
    },
    {
      label: "WhatsApp",
      value: stats?.totalWhatsapp ?? "—",
      sub: "messages",
      icon: MessageCircle,
      color: "text-yellow-400",
    },
    {
      label: "Contacts",
      value: stats?.totalContacts ?? "—",
      sub: "in database",
      icon: Users,
      color: "text-violet-400",
    },
    {
      label: "AI Agents",
      value: stats?.totalAgents ?? "—",
      sub: `${stats?.activeAgents ?? 0} active`,
      icon: Bot,
      color: "text-pink-400",
    },
    {
      label: "Online Users",
      value: stats?.onlineUsers ?? "—",
      sub: "team online",
      icon: TrendingUp,
      color: "text-orange-400",
    },
  ];

  const activityIcon = (type: string) => {
    switch (type) {
      case "call": return <Phone className="w-3 h-3 text-cyan-400" />;
      case "sms": return <MessageSquare className="w-3 h-3 text-emerald-400" />;
      case "whatsapp": return <MessageCircle className="w-3 h-3 text-yellow-400" />;
      case "agent": return <Bot className="w-3 h-3 text-pink-400" />;
      default: return <Activity className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase text-primary">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time communications overview</p>
        </div>
        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
          <Circle className="w-2 h-2 mr-1.5 fill-primary text-primary animate-pulse" />
          Live
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className="bg-card border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                </div>
                <div className={`p-2 rounded bg-background/50 ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activity && activity.length > 0 ? (
              activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-sm hover:bg-background/50 transition-colors">
                  <div className="mt-0.5 p-1.5 rounded bg-background/70">
                    {activityIcon(item.type ?? "")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs">{item.description}</p>
                    {item.meta && <p className="text-xs text-muted-foreground truncate">{item.meta}</p>}
                  </div>
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Online
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {online && online.length > 0 ? (
              online.map((u, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-sm hover:bg-background/50">
                  <div className="w-8 h-8 rounded bg-sidebar-accent flex items-center justify-center text-primary font-bold text-sm">
                    {u.name?.[0] ?? "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-tight truncate">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{u.role}</p>
                  </div>
                  <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No users online</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
