import { useState } from "react";
import { useGetCalls, useMakeCall } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff, Plus, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  completed: { label: "Completed", color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10", icon: Phone },
  "in-progress": { label: "In Progress", color: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10", icon: Phone },
  ringing: { label: "Ringing", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10", icon: Phone },
  queued: { label: "Queued", color: "text-blue-400 border-blue-400/30 bg-blue-400/10", icon: Clock },
  "no-answer": { label: "No Answer", color: "text-orange-400 border-orange-400/30 bg-orange-400/10", icon: PhoneMissed },
  missed: { label: "Missed", color: "text-orange-400 border-orange-400/30 bg-orange-400/10", icon: PhoneMissed },
  busy: { label: "Busy", color: "text-red-400 border-red-400/30 bg-red-400/10", icon: PhoneOff },
  failed: { label: "Failed", color: "text-red-400 border-red-400/30 bg-red-400/10", icon: PhoneOff },
  canceled: { label: "Canceled", color: "text-muted-foreground border-border bg-muted/10", icon: PhoneOff },
};

function formatDuration(s?: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function Calls() {
  const { data: calls, refetch } = useGetCalls({ query: { refetchInterval: 8000 } as any });
  const makeCall = useMakeCall();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");

  const handleCall = (e: React.FormEvent) => {
    e.preventDefault();
    makeCall.mutate(
      { data: { to } },
      {
        onSuccess: () => {
          toast({ title: "Call initiated", description: `Calling ${to}` });
          setOpen(false);
          setTo("");
          refetch();
        },
        onError: () => toast({ title: "Call failed", description: "Could not initiate call", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase text-primary">Voice Calls</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage and initiate calls via Twilio</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 h-8 text-xs uppercase tracking-wider">
              <Plus className="w-3 h-3" /> New Call
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border/50 font-mono">
            <DialogHeader>
              <DialogTitle className="text-primary uppercase tracking-wider text-sm">Initiate Call</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCall} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                <Input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="+14155551234"
                  required
                  className="bg-background/50 border-input font-mono h-9 rounded-sm"
                />
              </div>
              <Button type="submit" className="w-full h-9 rounded-sm text-xs uppercase tracking-wider" disabled={makeCall.isPending}>
                {makeCall.isPending ? "Connecting..." : "Connect"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Call Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {calls && calls.length > 0 ? calls.map((call) => {
              const cfg = STATUS_CONFIG[call.status ?? ""] ?? STATUS_CONFIG.canceled;
              const Icon = call.direction === "inbound" ? PhoneIncoming : PhoneOutgoing;
              return (
                <div key={call.id} className="flex items-center gap-4 px-4 py-3 hover:bg-background/30 transition-colors">
                  <div className="p-2 rounded bg-background/50">
                    <Icon className={`w-4 h-4 ${call.direction === "inbound" ? "text-cyan-400" : "text-emerald-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium">
                        {call.direction === "inbound" ? call.from : call.to}
                      </p>
                      <span className="text-[10px] text-muted-foreground capitalize">{call.direction}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {call.createdAt ? new Date(call.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{formatDuration(call.duration)}</span>
                    <Badge variant="outline" className={`text-[10px] font-mono px-1.5 py-0.5 ${cfg.color}`}>
                      {cfg.label}
                    </Badge>
                  </div>
                </div>
              );
            }) : (
              <div className="py-12 text-center text-xs text-muted-foreground">No calls recorded</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
