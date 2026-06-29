import { useGetCommunicationLogs } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Phone, MessageSquare, MessageCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useState } from "react";

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  call: Phone,
  sms: MessageSquare,
  whatsapp: MessageCircle,
};

const CHANNEL_COLORS: Record<string, string> = {
  call: "text-cyan-400",
  sms: "text-emerald-400",
  whatsapp: "text-yellow-400",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  delivered: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  read: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  sent: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  received: "text-violet-400 border-violet-400/30 bg-violet-400/10",
  "in-progress": "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  failed: "text-red-400 border-red-400/30 bg-red-400/10",
  missed: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  "no-answer": "text-orange-400 border-orange-400/30 bg-orange-400/10",
};

function formatDuration(s?: number | null) {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function AdminLogs() {
  const { data: logs } = useGetCommunicationLogs({ query: { refetchInterval: 15_000 } as any });
  const [channelFilter, setChannelFilter] = useState<string>("all");

  const filtered = logs?.filter((l) => channelFilter === "all" || l.channel === channelFilter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase text-primary">Communication Logs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Complete audit trail — {logs?.length ?? 0} records</p>
        </div>
        <div className="flex gap-1">
          {["all", "call", "sms", "whatsapp"].map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`px-3 py-1 text-xs rounded-sm uppercase tracking-wider transition-colors ${channelFilter === ch ? "bg-primary text-primary-foreground" : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"}`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4" />
            All Channels
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {filtered && filtered.length > 0 ? filtered.map((log) => {
              const ChannelIcon = CHANNEL_ICONS[log.channel ?? ""] ?? Activity;
              const channelColor = CHANNEL_COLORS[log.channel ?? ""] ?? "text-muted-foreground";
              const statusColor = STATUS_COLORS[log.status ?? ""] ?? "text-muted-foreground border-border bg-muted/10";
              const dur = formatDuration(log.duration);
              return (
                <div key={log.id} className="flex items-start gap-4 px-4 py-3 hover:bg-background/30 transition-colors">
                  <div className="p-2 rounded bg-background/50 mt-0.5">
                    <ChannelIcon className={`w-4 h-4 ${channelColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">{log.channel}</span>
                      <span className="text-muted-foreground/30">·</span>
                      {log.direction === "inbound"
                        ? <ArrowDownLeft className="w-3 h-3 text-violet-400" />
                        : <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                      }
                      <span className="text-[10px] text-muted-foreground capitalize">{log.direction}</span>
                    </div>
                    <p className="text-xs">
                      <span className="text-muted-foreground">From: </span>{log.from}
                      <span className="text-muted-foreground ml-3">To: </span>{log.to}
                    </p>
                    {log.body && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{log.body}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className={`text-[10px] font-mono capitalize ${statusColor}`}>
                      {log.status}
                    </Badge>
                    {dur && <span className="text-[10px] text-muted-foreground">{dur}</span>}
                  </div>
                </div>
              );
            }) : (
              <div className="py-12 text-center text-xs text-muted-foreground">No logs found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
