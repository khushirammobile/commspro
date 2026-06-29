import { useState } from "react";
import { useGetWhatsappConversations, useGetWhatsappMessages, useSendWhatsapp } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Plus, Send, ArrowUpRight, ArrowDownLeft } from "lucide-react";
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
  read: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  sent: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  received: "text-violet-400 border-violet-400/30 bg-violet-400/10",
  failed: "text-red-400 border-red-400/30 bg-red-400/10",
};

export default function WhatsApp() {
  const { data: conversations } = useGetWhatsappConversations({ query: { refetchInterval: 8000 } as any });
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const { data: messages, refetch } = useGetWhatsappMessages(
    selectedPhone ?? "",
    { query: { enabled: !!selectedPhone, refetchInterval: 5000 } as any }
  );
  const sendWhatsapp = useSendWhatsapp();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");
  const [quickBody, setQuickBody] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendWhatsapp.mutate(
      { data: { to, body } },
      {
        onSuccess: () => {
          toast({ title: "Message sent", description: `WhatsApp sent to ${to}` });
          setOpen(false);
          setTo("");
          setBody("");
        },
        onError: () => toast({ title: "Send failed", description: "Could not send WhatsApp message", variant: "destructive" }),
      }
    );
  };

  const handleQuickSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhone || !quickBody) return;
    sendWhatsapp.mutate(
      { data: { to: selectedPhone, body: quickBody } },
      {
        onSuccess: () => {
          setQuickBody("");
          refetch();
          toast({ title: "Message sent" });
        },
        onError: () => toast({ title: "Send failed", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase text-primary">WhatsApp</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage WhatsApp conversations</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 h-8 text-xs uppercase tracking-wider">
              <Plus className="w-3 h-3" /> New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border/50 font-mono">
            <DialogHeader>
              <DialogTitle className="text-primary uppercase tracking-wider text-sm">New WhatsApp Message</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">To (WhatsApp Number)</Label>
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
              <Button type="submit" className="w-full h-9 rounded-sm text-xs uppercase tracking-wider" disabled={sendWhatsapp.isPending}>
                {sendWhatsapp.isPending ? "Sending..." : "Send"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {conversations && conversations.length > 0 ? conversations.map((conv, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedPhone(conv.phone ?? null)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-background/30 ${selectedPhone === conv.phone ? "bg-primary/5 border-l-2 border-primary" : ""}`}
                >
                  <div className="w-8 h-8 rounded bg-sidebar-accent flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {conv.contactName?.[0] ?? conv.phone?.[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{conv.contactName ?? conv.phone}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                  {(conv.unreadCount ?? 0) > 0 && (
                    <Badge className="text-[10px] bg-primary text-primary-foreground min-w-[18px] justify-center">{conv.unreadCount}</Badge>
                  )}
                </button>
              )) : (
                <div className="py-8 text-center text-xs text-muted-foreground">No conversations</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card border-border/50 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
              {selectedPhone ? `Chat — ${selectedPhone}` : "Select a conversation"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col">
            <div className="flex-1 divide-y divide-border/30 max-h-80 overflow-y-auto">
              {selectedPhone && messages && messages.length > 0 ? messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-3 px-4 py-3 ${msg.direction === "outbound" ? "flex-row-reverse" : ""}`}>
                  <div className="p-1.5 rounded bg-background/50">
                    {msg.direction === "inbound"
                      ? <ArrowDownLeft className="w-3 h-3 text-violet-400" />
                      : <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                    }
                  </div>
                  <div className={`flex-1 ${msg.direction === "outbound" ? "text-right" : ""}`}>
                    <p className="text-xs">{msg.body}</p>
                    <div className={`flex items-center gap-2 mt-0.5 ${msg.direction === "outbound" ? "justify-end" : ""}`}>
                      <p className="text-[10px] text-muted-foreground">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                      <Badge variant="outline" className={`text-[10px] px-1 py-0 capitalize ${STATUS_COLORS[msg.status ?? ""] ?? ""}`}>
                        {msg.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )) : selectedPhone ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No messages</div>
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">Select a conversation to view messages</div>
              )}
            </div>
            {selectedPhone && (
              <form onSubmit={handleQuickSend} className="p-4 border-t border-border/30 flex gap-2">
                <Input
                  value={quickBody}
                  onChange={(e) => setQuickBody(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-background/50 border-input font-mono h-8 rounded-sm text-xs flex-1"
                />
                <Button size="sm" type="submit" className="h-8 rounded-sm" disabled={sendWhatsapp.isPending}>
                  <Send className="w-3 h-3" />
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
