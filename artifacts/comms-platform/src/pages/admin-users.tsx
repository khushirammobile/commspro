import { useState } from "react";
import { useGetUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Trash2, Circle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const ROLE_COLORS: Record<string, string> = {
  admin: "text-red-400 border-red-400/30 bg-red-400/10",
  agent: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  viewer: "text-muted-foreground border-border bg-muted/10",
};

export default function AdminUsers() {
  const { data: users, refetch } = useGetUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "agent" | "viewer">("agent");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(
      { data: { name, email, password, role } },
      {
        onSuccess: () => {
          toast({ title: "User created" });
          setCreateOpen(false);
          setName(""); setEmail(""); setPassword(""); setRole("agent");
          refetch();
        },
        onError: () => toast({ title: "Failed to create user", variant: "destructive" }),
      }
    );
  };

  const handleRoleChange = (id: number, newRole: string) => {
    updateUser.mutate(
      { id, data: { role: newRole as "admin" | "agent" | "viewer" } },
      {
        onSuccess: () => { toast({ title: "Role updated" }); refetch(); },
        onError: () => toast({ title: "Failed to update role", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase text-primary">User Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Admin — {users?.length ?? 0} users registered</p>
        </div>
        <Button size="sm" className="gap-2 h-8 text-xs uppercase tracking-wider" onClick={() => setCreateOpen(true)}>
          <Plus className="w-3 h-3" /> Add User
        </Button>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Shield className="w-4 h-4" />
            System Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {users && users.length > 0 ? users.map((user) => (
              <div key={user.id} className="flex items-center gap-4 px-4 py-3 hover:bg-background/30 transition-colors">
                <div className="w-9 h-9 rounded bg-sidebar-accent flex items-center justify-center text-primary font-bold shrink-0">
                  {user.name?.[0] ?? "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium">{user.name}</p>
                    {user.isOnline && <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{user.email}</p>
                </div>
                <Select value={user.role ?? "viewer"} onValueChange={(v) => handleRoleChange(user.id, v)}>
                  <SelectTrigger className="w-24 h-7 text-xs rounded-sm border-border/50 bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                    <SelectItem value="agent" className="text-xs">Agent</SelectItem>
                    <SelectItem value="viewer" className="text-xs">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="outline" className={`text-[10px] font-mono capitalize w-16 justify-center ${ROLE_COLORS[user.role ?? "viewer"]}`}>
                  {user.role}
                </Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(user.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )) : (
              <div className="py-12 text-center text-xs text-muted-foreground">No users found</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border/50 font-mono">
          <DialogHeader>
            <DialogTitle className="text-primary uppercase tracking-wider text-sm">Create User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required className="bg-background/50 border-input font-mono h-9 rounded-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="bg-background/50 border-input font-mono h-9 rounded-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="bg-background/50 border-input font-mono h-9 rounded-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                  <SelectTrigger className="h-9 text-xs rounded-sm border-input bg-background/50 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50">
                    <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                    <SelectItem value="agent" className="text-xs">Agent</SelectItem>
                    <SelectItem value="viewer" className="text-xs">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full h-9 rounded-sm text-xs uppercase tracking-wider" disabled={createUser.isPending}>
              {createUser.isPending ? "Creating..." : "Create User"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border/50 font-mono">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm uppercase tracking-wider">Delete User?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This will permanently remove the user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs rounded-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-8 text-xs rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId === null) return;
                deleteUser.mutate({ id: deleteId }, {
                  onSuccess: () => { toast({ title: "User deleted" }); setDeleteId(null); refetch(); },
                  onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
