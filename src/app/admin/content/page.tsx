"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Handshake, ImageIcon, Pencil, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/services/api";
import { getAdminContent, removeContent, saveContent } from "@/services/content.service";
import { ContentItem, ContentKind } from "@/types/content";

const groups: { kind: ContentKind; label: string; icon: typeof CalendarDays }[] = [
  { kind: "ride", label: "Rides & Events", icon: CalendarDays },
  { kind: "photo", label: "Event Photos", icon: ImageIcon },
  { kind: "brand", label: "Brands", icon: Handshake }
];

export default function ContentPage() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-content"], queryFn: getAdminContent });
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [creating, setCreating] = useState<ContentKind | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-content"] });
  const deleteMutation = useMutation({
    mutationFn: removeContent,
    onSuccess: () => { refresh(); toast.success("Item removed"); },
    onError: (error) => toast.error(apiErrorMessage(error))
  });

  return (
    <AdminShell>
      <div className="motion-page">
        <div className="mb-7 border-b-2 border-primary pb-5">
          <h1 className="font-display text-5xl text-[#ffb3b1]">Site Content</h1>
          <p className="mt-2 text-muted-foreground">Manage rides, event photography, and partner brands shown on the public site.</p>
        </div>
        <div className="grid gap-8">
          {groups.map(({ kind, label, icon: Icon }) => {
            const items = data.filter((item) => item.kind === kind);
            return (
              <section key={kind}>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h2 className="flex items-center gap-2 font-display text-2xl text-foreground"><Icon className="h-5 w-5 text-primary" />{label}</h2>
                  <Button size="sm" onClick={() => { setEditing(null); setCreating(kind); }}><Plus className="h-4 w-4" /> Add</Button>
                </div>
                {isLoading ? <div className="h-24 shimmer" /> : items.length ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                      <Card key={item._id} className="overflow-hidden">
                        {item.image ? <img src={item.image.url} alt={item.title} className="h-36 w-full object-cover" /> : null}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div><h3 className="font-display text-xl text-[#ffdad8]">{item.title}</h3><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description || item.category}</p></div>
                            <div className="flex shrink-0 gap-1">
                              <Button size="icon" variant="outline" title="Edit" onClick={() => { setCreating(null); setEditing(item); }}><Pencil className="h-4 w-4" /></Button>
                              <Button size="icon" variant="destructive" title="Delete" disabled={deleteMutation.isPending} onClick={() => window.confirm(`Delete ${item.title}?`) && deleteMutation.mutate(item._id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : <div className="border border-dashed border-[#5b403f] p-6 text-sm text-muted-foreground">No {label.toLowerCase()} added yet.</div>}
              </section>
            );
          })}
        </div>
      </div>
      {creating || editing ? <ContentEditor kind={creating ?? editing!.kind} item={editing} onClose={() => { setCreating(null); setEditing(null); }} onSaved={refresh} /> : null}
    </AdminShell>
  );
}

function ContentEditor({ kind, item, onClose, onSaved }: { kind: ContentKind; item: ContentItem | null; onClose: () => void; onSaved: () => void }) {
  const mutation = useMutation({
    mutationFn: (form: FormData) => saveContent(kind, form, item?._id),
    onSuccess: () => { onSaved(); onClose(); toast.success(item ? "Item updated" : "Item added"); },
    onError: (error) => toast.error(apiErrorMessage(error))
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(new FormData(event.currentTarget));
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-xl overflow-y-auto border-2 border-primary bg-[#151414] p-5">
        <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-3xl text-[#ffb3b1]">{item ? "Edit" : "Add"} {kind}</h2><Button type="button" size="icon" variant="outline" title="Close" onClick={onClose}><X className="h-4 w-4" /></Button></div>
        <div className="grid gap-4">
          <label className="grid gap-1 text-sm">Title<Input name="title" required maxLength={120} defaultValue={item?.title} /></label>
          <label className="grid gap-1 text-sm">Description<Textarea name="description" rows={4} maxLength={1000} defaultValue={item?.description} /></label>
          {kind === "ride" ? <><label className="grid gap-1 text-sm">Date<Input name="date" type="date" defaultValue={item?.date?.slice(0, 10)} /></label><label className="grid gap-1 text-sm">Location<Input name="location" defaultValue={item?.location} /></label><label className="grid gap-1 text-sm">Status<Select name="status" defaultValue={item?.status ?? "upcoming"}><option value="upcoming">Upcoming</option><option value="completed">Completed</option></Select></label></> : null}
          {kind === "brand" ? <label className="grid gap-1 text-sm">Category<Input name="category" required defaultValue={item?.category} placeholder="Helmets & riding protection" /></label> : null}
          <label className="grid gap-1 text-sm">{item?.image ? "Replace image" : "Image"}<Input name="image" type="file" accept="image/jpeg,image/png,image/webp" required={kind === "photo" && !item?.image} /></label>
          <label className="grid gap-1 text-sm">Display order<Input name="sortOrder" type="number" defaultValue={item?.sortOrder ?? 0} /></label>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : item ? "Update" : "Add item"}</Button>
        </div>
      </form>
    </div>
  );
}
