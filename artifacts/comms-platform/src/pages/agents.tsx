import { useState } from "react";
import {
  useGetAgents,
  useCreateAgent,
  useToggleAgent,
  useGetAgentTasks,
  useGetAgentActivity,
  useAssignAgentTask,
} from "@workspace/api-client-react";
import { AgentInputType } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, Activity, ListTodo, ToggleLeft, ToggleRight, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Agent } from "@workspace/api-client-react";

const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  idle: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  busy: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  error: "text-red-400 border-red-400/30 bg-red-400/10",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  running: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  pending: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  completed: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  failed: "text-red-400 border-red-400/30 bg-red-400/10",
};

const AGENT_TYPES = Object.values(AgentInputType);

export default function Agents() {
  const { data: agents, refetch } = useGetAgents({ query: { refetchInterval: 10_000 } as any });
  const createAgent = useCreateAgent();
  const toggleAgent = useToggleAgent();
  const { toast } = useToast();

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const { data: tasks, refetch: refetchTasks } = useGetAgentTasks(
    selectedAgent?.id ?? 0,
    { query: { enabled: !!selectedAgent } as any }
  );
  const { data: activity } = useGetAgentActivity(
    selectedAgent?.id ?? 0,
    { query: { enabled: !!selectedAgent, refetchInterval: 8000 } as any }
  );
  const assignTask = useAssignAgentTask();

  const [createOpen, setCreateOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentType, setAgentType] = useState<string>(AGENT_TYPES[0]);
  const [agentDesc, setAgentDesc] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    createAgent.mutate(
      { data: { name: agentName, type: agentType as typeof AgentInputType[keyof typeof AgentInputType], description: agentDesc } },
      {
        onSuccess: () => {
          toast({ title: "Agent created" });
          setCreateOpen(false);
          setAgentName(""); setAgentType(AGENT_TYPES[0]); setAgentDesc("");
          refetch();
        },
        onError: () => toast({ title: "Failed to create agent", variant: "destructive" }),
      }
    );
  };

  const handleToggle = (agent: Agent) => {
    toggleAgent.mutate(
      { id: agent.id, data: { isEnabled: !agent.isEnabled } },
      {
        onSuccess: () => { toast({ title: agent.isEnabled ? "Agent disabled" : "Agent enabled" }); refetch(); },
        onError: () => toast({ title: "Toggle failed", variant: "destructive" }),
      }
    );
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    assignTask.mutate(
      { id: selectedAgent.id, data: { title: taskTitle, description: taskDesc } },
      {
        onSuccess: () => {
          toast({ title: "Task assigned" });
          setTaskOpen(false);
          setTaskTitle(""); setTaskDesc("");
          refetchTasks();
        },
        onError: () => toast({ title: "Failed to assign task", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase text-primary">AI Agents</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage autonomous communication agents</p>
        </div>
        <Button size="sm" className="gap-2 h-8 text-xs uppercase tracking-wider" onClick={() => setCreateOpen(true)}>
          <Plus className="w-3 h-3" /> New Agent
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          {agents && agents.length > 0 ? agents.map((agent) => (
            <Card
              key={agent.id}
              className={`bg-card border-border/50 cursor-pointer transition-colors hover:border-primary/30 ${selectedAgent?.id === agent.id ? "border-primary/50 bg-primary/5" : ""}`}
              onClick={() => setSelectedAgent(agent)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-background/50">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">{agent.name}</p>
                      <p className="text-[10px] text-muted-foreground">{agent.type}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-mono capitalize ${STATUS_COLORS[agent.status ?? "idle"]}`}>
                    {agent.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-muted-foreground">{agent.taskCount ?? 0} tasks</span>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); handleToggle(agent); }}
                    className={`flex items-center gap-1 text-[10px] ${agent.isEnabled ? "text-emerald-400" : "text-muted-foreground"}`}
                  >
                    {agent.isEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {agent.isEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="py-8 text-center text-xs text-muted-foreground">No agents configured</div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedAgent ? (
            <>
              <Card className="bg-card border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <ListTodo className="w-4 h-4" />
                      Tasks — {selectedAgent.name}
                    </CardTitle>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setTaskOpen(true)}>
                      <Plus className="w-3 h-3" /> Add Task
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/30">
                    {tasks && tasks.length > 0 ? tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                        <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{task.title}</p>
                          {task.description && <p className="text-[10px] text-muted-foreground">{task.description}</p>}
                        </div>
                        <Badge variant="outline" className={`text-[10px] capitalize ${TASK_STATUS_COLORS[task.status ?? "pending"]}`}>
                          {task.status}
                        </Badge>
                      </div>
                    )) : (
                      <div className="py-6 text-center text-xs text-muted-foreground">No tasks assigned</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/30">
                    {activity && activity.length > 0 ? activity.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div>
                          <span className="text-[10px] font-medium text-primary uppercase mr-2">{item.event}</span>
                          <span className="text-[10px] text-muted-foreground">{item.detail}</span>
                          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                          </p>
                        </div>
                      </div>
                    )) : (
                      <div className="py-6 text-center text-xs text-muted-foreground">No activity recorded</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground border border-border/30 rounded-sm">
              Select an agent to view tasks and activity
            </div>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border/50 font-mono">
          <DialogHeader>
            <DialogTitle className="text-primary uppercase tracking-wider text-sm">New AI Agent</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAgent} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Agent Name</Label>
              <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} required className="bg-background/50 border-input font-mono h-9 rounded-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Type</Label>
              <Select value={agentType} onValueChange={setAgentType}>
                <SelectTrigger className="h-9 text-xs rounded-sm border-input bg-background/50 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50">
                  {AGENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea value={agentDesc} onChange={(e) => setAgentDesc(e.target.value)} rows={3} className="bg-background/50 border-input font-mono rounded-sm resize-none text-xs" />
            </div>
            <Button type="submit" className="w-full h-9 rounded-sm text-xs uppercase tracking-wider" disabled={createAgent.isPending}>
              {createAgent.isPending ? "Creating..." : "Create Agent"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="bg-card border-border/50 font-mono">
          <DialogHeader>
            <DialogTitle className="text-primary uppercase tracking-wider text-sm">Add Task — {selectedAgent?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Task Title</Label>
              <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required className="bg-background/50 border-input font-mono h-9 rounded-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={3} className="bg-background/50 border-input font-mono rounded-sm resize-none text-xs" />
            </div>
            <Button type="submit" className="w-full h-9 rounded-sm text-xs uppercase tracking-wider" disabled={assignTask.isPending}>
              {assignTask.isPending ? "Assigning..." : "Assign Task"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
