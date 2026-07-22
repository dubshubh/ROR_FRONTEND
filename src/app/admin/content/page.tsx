"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, CalendarDays, Handshake, ImageIcon, MapPinned, Pencil, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import Image from "next/image";
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
import { AdminDateField } from "@/components/admin/admin-date-field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const groups: { kind: ContentKind; label: string; icon: typeof CalendarDays }[] = [
  { kind: "event", label: "Events", icon: CalendarDays },
  { kind: "ride", label: "Rides", icon: Bike },
  { kind: "brand", label: "Brand Partners", icon: Handshake },
  { kind: "photo", label: "Photography", icon: ImageIcon },
  { kind: "intercity", label: "Intercity Rides", icon: MapPinned }
];

export default function ContentPage() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-content"], queryFn: getAdminContent });
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [creating, setCreating] = useState<ContentKind | null>(null);
  const [activeKind, setActiveKind] = useState<ContentKind>("event");
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-content"] });
  const deleteMutation = useMutation({
    mutationFn: removeContent,
    onSuccess: () => { refresh(); setDeleteTarget(null); toast.success("Item removed"); },
    onError: (error) => toast.error(apiErrorMessage(error))
  });

  return (
    <AdminShell>
      <div className="motion-page">
        <div className="mb-7 flex flex-col gap-4 border-b border-[#67272a] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#ff535b]">Public website manager</div><h1 className="font-display text-4xl text-[#ffdad8] sm:text-6xl">Published Content</h1><p className="mt-2 max-w-2xl text-muted-foreground">Everything managed here is displayed on the corresponding user-facing page.</p></div>
        </div>
        <div className="admin-content-tabs" role="tablist" aria-label="Content type">
          {groups.map(({ kind, label, icon: Icon }) => <button key={kind} type="button" role="tab" aria-selected={activeKind === kind} onClick={() => setActiveKind(kind)}><Icon /><span>{label}</span><b>{data.filter((item) => item.kind === kind).length}</b></button>)}
        </div>
        <div className="mt-7 grid gap-8">
          {groups.filter(({ kind }) => kind === activeKind).map(({ kind, label, icon: Icon }) => {
            const items = data.filter((item) => item.kind === kind);
            return (
              <section key={kind}>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div><h2 className="flex items-center gap-2 font-display text-3xl text-foreground"><Icon className="h-5 w-5 text-primary" />{label}</h2><p className="mt-1 text-xs text-muted-foreground">Published items: {items.length}</p></div>
                  <Button onClick={() => { setEditing(null); setCreating(kind); }}><Plus className="h-4 w-4" /> Add {kind}</Button>
                </div>
                {isLoading ? <div className="h-24 shimmer" /> : items.length ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                      <Card key={item._id} className="overflow-hidden">
                        {(item.images?.[0] ?? item.image) ? <Image src={(item.images?.[0] ?? item.image)!.url} alt={item.title} width={640} height={288} className="h-36 w-full object-cover" /> : item.videos?.[0] ? <video src={item.videos[0].url} muted playsInline preload="metadata" className="h-36 w-full bg-black object-cover" /> : null}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div><h3 className="font-display text-xl text-[#ffdad8]">{item.title}</h3><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description || item.category}</p>{item.kind === "photo" ? <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-[#ff535b]">{item.images?.length || (item.image ? 1 : 0)} photos · {item.videos?.length ?? 0} videos</p> : null}</div>
                            <div className="flex shrink-0 gap-1">
                              <Button size="icon" variant="outline" title="Edit" onClick={() => { setCreating(null); setEditing(item); }}><Pencil className="h-4 w-4" /></Button>
                              <Button size="icon" variant="destructive" title="Delete" disabled={deleteMutation.isPending} onClick={() => setDeleteTarget(item)}><Trash2 className="h-4 w-4" /></Button>
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
      <ConfirmDialog open={Boolean(deleteTarget)} onOpenChange={(open)=>!open&&setDeleteTarget(null)} title="Delete published content?" description={deleteTarget ? `“${deleteTarget.title}” will be permanently removed from the public website.` : ""} confirmLabel="Delete content" pending={deleteMutation.isPending} onConfirm={()=>deleteTarget&&deleteMutation.mutate(deleteTarget._id)}/>
    </AdminShell>
  );
}

function ContentEditor({ kind, item, onClose, onSaved }: { kind: ContentKind; item: ContentItem | null; onClose: () => void; onSaved: () => void }) {
  const existingImages = item?.images?.length ? item.images : item?.image ? [item.image] : [];
  const existingVideos = item?.videos ?? [];
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [removedVideoIds, setRemovedVideoIds] = useState<string[]>([]);
  const mutation = useMutation({
    mutationFn: (form: FormData) => saveContent(kind, form, item?._id),
    onSuccess: () => { onSaved(); onClose(); toast.success(item ? "Item updated" : "Item added"); },
    onError: (error) => toast.error(apiErrorMessage(error))
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (kind === "photo" && item) {
      form.set("retainedImageIds", existingImages.filter((asset) => !removedImageIds.includes(asset.publicId)).map((asset) => asset.publicId).join(","));
      form.set("retainedVideoIds", existingVideos.filter((asset) => !removedVideoIds.includes(asset.publicId)).map((asset) => asset.publicId).join(","));
    }
    mutation.mutate(form);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form onSubmit={submit} className="max-h-[94vh] w-full max-w-xl overflow-y-auto border-2 border-primary bg-[#151414] p-4 sm:max-h-[90vh] sm:p-5">
        <div className="mb-5 flex items-center justify-between gap-3"><h2 className="font-display text-2xl text-[#ffb3b1] sm:text-3xl">{item ? "Edit" : "Add"} {kind}</h2><Button type="button" size="icon" variant="outline" title="Close" onClick={onClose}><X className="h-4 w-4" /></Button></div>
        <div className="grid gap-4">
          <label className="grid gap-1 text-sm">{kind === "photo" ? "Collection title" : "Title"}<Input name="title" required maxLength={120} defaultValue={item?.title} placeholder={kind === "photo" ? "Midnight run through Dehradun" : undefined} /></label>
          <label className="grid gap-1 text-sm">{kind === "photo" ? "Story / caption" : "Description"}<Textarea name="description" rows={4} maxLength={1000} defaultValue={item?.description} placeholder={kind === "photo" ? "Give this collection a short story that adds context to every frame." : undefined} /></label>
          {kind === "event" || kind === "ride" || kind === "intercity" ? <><div className="grid gap-4 sm:grid-cols-2"><AdminDateField name="date" label="Start date" defaultValue={item?.date?.slice(0, 10)} required/><AdminDateField name="endDate" label="End date" defaultValue={item?.endDate?.slice(0, 10)}/></div><label className="admin-field"><span>Status</span><Select name="status" defaultValue={item?.status ?? "upcoming"}><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option></Select></label></> : null}
          {kind === "event" ? <label className="grid gap-1 text-sm">Venue / location<Input name="location" required defaultValue={item?.location} placeholder="Exact venue name and city" /></label> : null}
          {kind === "ride" || kind === "intercity" ? <><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm">Ride starts from<Input name="startLocation" required defaultValue={item?.startLocation} placeholder="Exact meeting point" /></label><label className="grid gap-1 text-sm">Destination<Input name="destination" required defaultValue={item?.destination} placeholder="Exact destination" /></label></div><label className="grid gap-1 text-sm">Route stops (optional)<Textarea name="routeWaypoints" rows={3} maxLength={1300} defaultValue={item?.routeWaypoints?.join("\n")} placeholder={"One stop per line, for example:\nKempty Falls\nMussoorie Diversion"} /><span className="text-xs text-muted-foreground">Up to 8 stops, shown in ride order.</span></label></> : null}
          {kind === "brand" ? <><label className="grid gap-1 text-sm">Category<Input name="category" required defaultValue={item?.category} placeholder="Helmets & riding protection" /></label><label className="grid gap-1 text-sm">Official website<Input name="websiteUrl" type="url" maxLength={500} defaultValue={item?.websiteUrl} placeholder="https://brand.example" /></label><label className="grid gap-1 text-sm">Why this partnership works<Textarea name="partnershipBond" rows={4} maxLength={1200} defaultValue={item?.partnershipBond} placeholder="Describe the shared values, common thinking, and bond between the brand and Rebels on Roads." /></label><label className="grid gap-1 text-sm">Collaborating since<Input name="collaborationSince" maxLength={40} defaultValue={item?.collaborationSince} placeholder="2025 or Founding Partner" /></label></> : null}
          <label className="grid gap-1 text-sm">{kind === "photo" && item ? "Add photos" : item?.images?.length || item?.image ? "Replace all images (up to 8)" : kind === "photo" ? "Upload photos (up to 8)" : "Images (up to 8)"}<Input name="images" type="file" multiple accept="image/jpeg,image/png,image/webp" /><span className="text-xs text-muted-foreground">JPG, PNG or WebP. A photography collection can contain up to 8 photos.</span></label>
          {kind === "photo" ? <><label className="grid gap-1 text-sm">{item ? "Add videos" : "Upload videos (up to 2, 25 MB each)"}<Input name="videos" type="file" multiple accept="video/mp4,video/webm" /><span className="text-xs text-muted-foreground">MP4 or WebM. A collection can contain up to 2 videos.</span></label>{item && (existingImages.length + existingVideos.length > 0) ? <div className="grid gap-2"><span className="text-sm">Published media · click × to remove</span><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{existingImages.map((asset) => <div className={`relative ${removedImageIds.includes(asset.publicId) ? "opacity-30" : ""}`} key={asset.publicId}><Image src={asset.url} alt="" width={120} height={90} className="h-20 w-full object-cover" /><button type="button" title={removedImageIds.includes(asset.publicId) ? "Restore photo" : "Remove photo"} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-black/80 text-white" onClick={() => setRemovedImageIds((ids) => ids.includes(asset.publicId) ? ids.filter((id) => id !== asset.publicId) : [...ids, asset.publicId])}><X className="h-3.5 w-3.5" /></button></div>)}{existingVideos.map((asset) => <div className={`relative ${removedVideoIds.includes(asset.publicId) ? "opacity-30" : ""}`} key={asset.publicId}><video src={asset.url} muted preload="metadata" className="h-20 w-full bg-black object-cover" /><button type="button" title={removedVideoIds.includes(asset.publicId) ? "Restore video" : "Remove video"} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-black/80 text-white" onClick={() => setRemovedVideoIds((ids) => ids.includes(asset.publicId) ? ids.filter((id) => id !== asset.publicId) : [...ids, asset.publicId])}><X className="h-3.5 w-3.5" /></button></div>)}</div><span className="text-xs text-muted-foreground">Removed media is deleted permanently after you save. New uploads are added to retained media.</span></div> : null}</> : null}
          <label className="grid gap-1 text-sm">Display order<Input name="sortOrder" type="number" defaultValue={item?.sortOrder ?? 0} /></label>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : item ? "Update" : "Add item"}</Button>
        </div>
      </form>
    </div>
  );
}
