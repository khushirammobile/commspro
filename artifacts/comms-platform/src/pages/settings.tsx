import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings, useTestTwilioConnection } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, CheckCircle2, XCircle, Loader2, Phone, Key, MessageCircle, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DOMAIN = window.location.origin;

const WEBHOOKS = [
  { label: "Voice Incoming (POST)", path: "/api/calls/webhook", desc: "Set in Twilio → Phone Numbers → Voice" },
  { label: "Voice Status Callback (POST)", path: "/api/calls/status", desc: "Set in Twilio → Phone Numbers → Call Status" },
  { label: "SMS Incoming (POST)", path: "/api/sms/webhook", desc: "Set in Twilio → Phone Numbers → Messaging" },
  { label: "SMS Status (POST)", path: "/api/sms/status", desc: "Set in Twilio → Messaging → Status Callback" },
  { label: "WhatsApp Incoming (POST)", path: "/api/whatsapp/webhook", desc: "Set in Twilio → Messaging → WhatsApp Sandbox" },
];

function CopyableUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center gap-2 mt-1 p-2 bg-background/70 rounded-sm border border-border/30 group">
      <code className="text-[11px] text-primary font-mono flex-1 break-all">{url}</code>
      <button onClick={copy} className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export default function Settings() {
  const { data: settings, refetch } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const testTwilio = useTestTwilioConnection();
  const { toast } = useToast();

  const [accountSid, setAccountSid] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [webhookBaseUrl, setWebhookBaseUrl] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setAccountSid(settings.twilioAccountSid ?? "");
      setPhoneNumber(settings.twilioPhoneNumber ?? "");
      setWhatsappNumber(settings.twilioWhatsappNumber ?? "");
      setWebhookBaseUrl(settings.webhookBaseUrl ?? DOMAIN);
    }
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(
      {
        data: {
          twilioAccountSid: accountSid || undefined,
          twilioPhoneNumber: phoneNumber || undefined,
          twilioWhatsappNumber: whatsappNumber || undefined,
          webhookBaseUrl: webhookBaseUrl || undefined,
        },
      },
      {
        onSuccess: () => { toast({ title: "Settings saved" }); refetch(); },
        onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
      }
    );
  };

  const handleTest = () => {
    setTestResult(null);
    testTwilio.mutate(undefined, {
      onSuccess: (data) => setTestResult({ success: true, message: data.message ?? "Connection successful" }),
      onError: () => setTestResult({ success: false, message: "Connection failed. Check your credentials." }),
    });
  };

  const base = webhookBaseUrl || DOMAIN;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase text-primary">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Twilio integration and system configuration</p>
        </div>
        <div className="flex items-center gap-2">
          {testResult && (
            <Badge variant="outline" className={testResult.success ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" : "text-red-400 border-red-400/30 bg-red-400/10"}>
              {testResult.success ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
              {testResult.message}
            </Badge>
          )}
          <Button variant="outline" size="sm" className="h-8 text-xs gap-2" onClick={handleTest} disabled={testTwilio.isPending}>
            {testTwilio.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Test Connection
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Key className="w-4 h-4" />
              Twilio Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Account SID</Label>
              <Input
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
                placeholder="AC..."
                className="bg-background/50 border-input font-mono h-9 rounded-sm text-xs"
              />
            </div>
            <div className="p-3 bg-background/30 rounded-sm border border-border/30 text-xs text-muted-foreground">
              Auth Token and API Keys are managed via environment secrets for security. Contact your administrator to update them.
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Numbers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Twilio Phone Number</Label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+12183925543"
                  className="bg-background/50 border-input font-mono h-9 rounded-sm text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  WhatsApp Number
                </Label>
                <Input
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+12183925543"
                  className="bg-background/50 border-input font-mono h-9 rounded-sm text-xs"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Webhook Base URL</Label>
                <Input
                  value={webhookBaseUrl}
                  onChange={(e) => setWebhookBaseUrl(e.target.value)}
                  placeholder={DOMAIN}
                  className="bg-background/50 border-input font-mono h-9 rounded-sm text-xs"
                />
                <p className="text-[10px] text-muted-foreground">Auto-detected: {DOMAIN}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="h-9 px-6 rounded-sm text-xs uppercase tracking-wider" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            Webhook URLs — Configure in Twilio Console
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Copy these URLs and paste them in your{" "}
            <a href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
              Twilio Phone Number settings
            </a>
            {" "}to receive incoming calls, SMS, and WhatsApp messages.
          </p>
          <div className="space-y-4">
            {WEBHOOKS.map(({ label, path, desc }) => (
              <div key={path}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
                  <span className="text-[10px] text-muted-foreground/60">{desc}</span>
                </div>
                <CopyableUrl url={`${base}${path}`} />
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-cyan-400/5 border border-cyan-400/20 rounded-sm text-xs text-cyan-300/80 space-y-1">
            <p className="font-semibold uppercase tracking-wider text-cyan-400">Setup Guide</p>
            <p>1. Go to <strong>console.twilio.com</strong> → Phone Numbers → Manage → Active Numbers</p>
            <p>2. Click your number <strong>{phoneNumber || "+12183925543"}</strong></p>
            <p>3. Under <strong>Voice &amp; Fax</strong> → "A call comes in" → set to <strong>Webhook</strong> → paste Voice URL above</p>
            <p>4. Under <strong>Messaging</strong> → "A message comes in" → paste SMS URL above</p>
            <p>5. Click <strong>Save</strong></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
