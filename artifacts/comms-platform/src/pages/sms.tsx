import { useState } from "react";
import { useGetSmsMessages, useSendSms } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  delivered: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  sent: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  received: "text-violet-400 border-violet-400/30 bg-violet-400/10",
  failed: "text-red-400 border-red-400/30 bg-red-400/10",
  undelivered: "text-orange-400 border-orange-400/30 bg-orange-400/10",
};

export default function SMS() {
  const { data: messages, refetch } = useGetSmsMessages({ query: { refetchInterval: 8000 } as any });
  const sendSms = useSendSms();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendSms.mutate(
      { data: { to, body } },
      {
        onSuccess: () => {
          toast({ title: "SMS sent", description: `Message sent to ${to}` });
          setOpen(false);
          setTo("");
          setBody("");
          refetch();
        },
        onError: () => toast({ title: "Send failed", description: "Could not send SMS", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase text-primary">SMS</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Send and receive SMS messages via Twilio</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 h-8 text-xs uppercase tracking-wider">
              <Plus className="w-3 h-3" /> Compose
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border/50 font-mono">
            <DialogHeader>
              <DialogTitle className="text-primary uppercase tracking-wider text-sm">New SMS</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">To</Label>
                <Input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="+14155551234"
                  required
                  className="bg-background/50 border-input font-mono h-9 rounded-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Message</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your message..."
                  required
                  rows={4}
                  className="bg-background/50 border-input font-mono rounded-sm resize-none text-xs"
                />
              </div>
              <Button type="submit" className="w-full h-9 rounded-sm text-xs uppercase tracking-wider" disabled={sendSms.isPending}>
                {sendSms.isPending ? "Sending..." : "Send SMS"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Message Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {messages && messages.length > 0 ? messages.map((msg) => {
              const statusColor = STATUS_COLORS[msg.status ?? ""] ?? "text-muted-foreground border-border bg-muted/10";
              return (
                <div key={msg.id} className="flex items-start gap-4 px-4 py-3 hover:bg-background/30 transition-colors">
                  <div className="p-2 rounded bg-background/50 mt-0.5">
                    {msg.direction === "inbound"
                      ? <ArrowDownLeft className="w-4 h-4 text-violet-400" />
                      : <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-medium">
                        {msg.direction === "inbound" ? msg.from : msg.to}
                      </p>
                      <span className="text-[10px] text-muted-foreground capitalize">{msg.direction}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{msg.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-mono px-1.5 py-0.5 capitalize ${statusColor}`}>
                    {msg.status}
                  </Badge>
                </div>
              );
            }) : (
              <div className="py-12 text-center text-xs text-muted-foreground">No SMS messages found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
