import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings, useTestTwilioConnection } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, CheckCircle2, XCircle, Loader2, Phone, Key, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      setWebhookBaseUrl(settings.webhookBaseUrl ?? "");
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
                  placeholder="https://your-domain.com"
                  className="bg-background/50 border-input font-mono h-9 rounded-sm text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              Webhook URLs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground mb-3">Configure these in your Twilio console to receive inbound events:</p>
            <div className="space-y-2">
              {[
                { label: "Voice Webhook (POST)", path: "/api/calls/webhook" },
                { label: "SMS Webhook (POST)", path: "/api/sms/webhook" },
                { label: "WhatsApp Webhook (POST)", path: "/api/whatsapp/webhook" },
                { label: "Call Status Callback (POST)", path: "/api/calls/status" },
              ].map(({ label, path }) => (
                <div key={path} className="flex items-center justify-between p-2.5 bg-background/50 rounded-sm border border-border/30">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
                  <code className="text-xs text-primary font-mono">{path}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="h-9 px-6 rounded-sm text-xs uppercase tracking-wider" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
