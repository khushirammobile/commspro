import { useState } from "react";
import { useGetContacts, useCreateContact, useUpdateContact, useDeleteContact } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Pencil, Trash2, Phone, Mail, Building2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import type { Contact } from "@workspace/api-client-react";

function ContactForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<Contact>;
  onSubmit: (data: { name: string; phone: string; email?: string; company?: string; notes?: string }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, phone, email: email || undefined, company: company || undefined, notes: notes || undefined });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required className="bg-background/50 border-input font-mono h-9 rounded-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone *</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+1..." className="bg-background/50 border-input font-mono h-9 rounded-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
          <Input value={email ?? ""} onChange={(e) => setEmail(e.target.value)} type="email" className="bg-background/50 border-input font-mono h-9 rounded-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Company</Label>
          <Input value={company ?? ""} onChange={(e) => setCompany(e.target.value)} className="bg-background/50 border-input font-mono h-9 rounded-sm" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes</Label>
        <Input value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} className="bg-background/50 border-input font-mono h-9 rounded-sm" />
      </div>
      <Button type="submit" className="w-full h-9 rounded-sm text-xs uppercase tracking-wider" disabled={loading}>
        {loading ? "Saving..." : "Save Contact"}
      </Button>
    </form>
  );
}

export default function Contacts() {
  const { data: contacts, refetch } = useGetContacts();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = contacts?.filter((c) =>
    [c.name, c.phone, c.email, c.company].some((f) => f?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase text-primary">Contacts</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{contacts?.length ?? 0} contacts in database</p>
        </div>
        <Button size="sm" className="gap-2 h-8 text-xs uppercase tracking-wider" onClick={() => setCreateOpen(true)}>
          <Plus className="w-3 h-3" /> Add Contact
        </Button>
      </div>

      <Input
        placeholder="Search by name, phone, email or company..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-card border-border/50 font-mono h-9 rounded-sm text-xs"
      />

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4" />
            Contact Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {filtered && filtered.length > 0 ? filtered.map((contact) => (
              <div key={contact.id} className="flex items-center gap-4 px-4 py-3 hover:bg-background/30 transition-colors">
                <div className="w-9 h-9 rounded bg-sidebar-accent flex items-center justify-center text-primary font-bold shrink-0">
                  {contact.name?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{contact.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Phone className="w-2.5 h-2.5" />{contact.phone}
                    </span>
                    {contact.email && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Mail className="w-2.5 h-2.5" />{contact.email}
                      </span>
                    )}
                    {contact.company && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Building2 className="w-2.5 h-2.5" />{contact.company}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditContact(contact)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(contact.id ?? null)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-xs text-muted-foreground">
                {search ? "No contacts match your search" : "No contacts yet"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border/50 font-mono">
          <DialogHeader>
            <DialogTitle className="text-primary uppercase tracking-wider text-sm">New Contact</DialogTitle>
          </DialogHeader>
          <ContactForm
            onSubmit={(data) => createContact.mutate({ data }, {
              onSuccess: () => { toast({ title: "Contact created" }); setCreateOpen(false); refetch(); },
              onError: () => toast({ title: "Failed to create contact", variant: "destructive" }),
            })}
            loading={createContact.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editContact} onOpenChange={(o) => !o && setEditContact(null)}>
        <DialogContent className="bg-card border-border/50 font-mono">
          <DialogHeader>
            <DialogTitle className="text-primary uppercase tracking-wider text-sm">Edit Contact</DialogTitle>
          </DialogHeader>
          {editContact && (
            <ContactForm
              initial={editContact}
              onSubmit={(data) => updateContact.mutate({ id: editContact.id, data }, {
                onSuccess: () => { toast({ title: "Contact updated" }); setEditContact(null); refetch(); },
                onError: () => toast({ title: "Failed to update contact", variant: "destructive" }),
              })}
              loading={updateContact.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border/50 font-mono">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm uppercase tracking-wider">Delete Contact?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This action cannot be undone. The contact will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs rounded-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-8 text-xs rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId === null) return;
                deleteContact.mutate({ id: deleteId }, {
                  onSuccess: () => { toast({ title: "Contact deleted" }); setDeleteId(null); refetch(); },
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
