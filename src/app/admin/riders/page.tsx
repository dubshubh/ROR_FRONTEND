"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Search, Trash2, UserCog, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiErrorMessage } from "@/services/api";
import { bulkDeleteRiders, deleteRider, getRiders, downloadRiders, updateRiderStatus } from "@/services/rider.service";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Rider, RiderStatus } from "@/types/rider";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function RidersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [actionRider, setActionRider] = useState<Rider | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{type:"single";rider:Rider}|{type:"bulk"}|null>(null);
  const debouncedSearch = useDebouncedValue(search.trim());
  const debouncedCity = useDebouncedValue(city.trim());
  const debouncedState = useDebouncedValue(state.trim());

  useEffect(() => setPage(1), [debouncedSearch, debouncedCity, debouncedState, status, sortBy, sortOrder]);

  const params = useMemo(() => {
    const nextParams: Record<string, string | number> = { page, limit: 25, sortBy, sortOrder };

    if (debouncedSearch) nextParams.search = debouncedSearch;

    if (status) nextParams.status = status;

    if (debouncedCity) nextParams.city = debouncedCity;

    if (debouncedState) nextParams.state = debouncedState;

    return nextParams;
  }, [debouncedSearch, status, debouncedCity, debouncedState, sortBy, sortOrder, page]);
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({ queryKey: ["riders", params], queryFn: () => getRiders(params) });
  const refresh = () => { setSelected([]); return queryClient.invalidateQueries({ queryKey:["riders"] }); };
  const deleteMutation = useMutation({ mutationFn:deleteRider,onSuccess:()=>{setDeleteTarget(null);void refresh();toast.success("Rider and uploaded documents deleted")},onError:(error)=>toast.error(apiErrorMessage(error)) });
  const bulkDeleteMutation = useMutation({ mutationFn:bulkDeleteRiders,onSuccess:(result)=>{setDeleteTarget(null);void refresh();toast.success(`${result.deleted} riders deleted`)},onError:(error)=>toast.error(apiErrorMessage(error)) });

  return (
    <AdminShell>
      <div className="motion-page">
      <div className="mb-8 flex flex-col gap-4 border-b-2 border-primary pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-[#ffb3b1] sm:text-5xl">Rider Registry</h1>
          <p className="mt-2 text-lg text-[#ffdad8]">Manage member status, bike assignments, and chapter credentials.</p>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Showing {data?.riders.length ?? 0} of {data?.meta.total ?? 0} riders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadRiders("csv").catch((error) => toast.error(apiErrorMessage(error)))}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadRiders("excel").catch((error) => toast.error(apiErrorMessage(error)))}>
            <Download className="h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      <Card className="motion-rise mb-6 border-b-2 border-b-primary p-6">
        <div className="grid gap-3 md:grid-cols-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
            <Input className="pl-11" placeholder="Search by name, email, phone, DL, bike" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="contact_again">Contact again</option>
          </Select>
          <Input placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
          <Input placeholder="State" value={state} onChange={(event) => setState(event.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="createdAt">Date</option>
              <option value="fullName">Name</option>
              <option value="city">City</option>
              <option value="status">Status</option>
            </Select>
            <Select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "asc" | "desc")}>
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </Select>
          </div>
        </div>
      </Card>

      {isFetching && !isLoading ? (
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#ffb3b1]">Refreshing rider roster...</div>
      ) : null}

      {isError ? <Card className="mb-6 p-8 text-center"><p className="text-destructive">{apiErrorMessage(error)}</p><Button className="mt-4" onClick={() => void refetch()}>Try again</Button></Card> : null}

      {!isError ? <div className="motion-rise overflow-hidden rebel-frame bg-card">
        {selected.length ? <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-900 bg-red-950/20 p-3"><span className="font-mono text-xs uppercase text-[#ffb3b1]">{selected.length} selected</span><Button size="sm" variant="destructive" disabled={bulkDeleteMutation.isPending} onClick={()=>setDeleteTarget({type:"bulk"})}><Trash2 className="h-4 w-4"/>Delete selected</Button></div>:null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-[#2a2a2a] font-mono text-[11px] uppercase tracking-[0.12em] text-[#ffb3b1]">
              <tr>
                <th className="px-4 py-4"><Checkbox aria-label="Select all riders" checked={Boolean(data?.riders.length)&&selected.length===data?.riders.length} onChange={(event)=>setSelected(event.target.checked?(data?.riders.map((rider)=>rider._id)??[]):[])}/></th>
                {["Name", "Phone", "Email", "City", "Bike Number", "Status", "Created Date"].map((header) => (
                  <th key={header} className="px-4 py-4 font-bold">{header}</th>
                ))}
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-t border-[#5b403f]">
                    <td className="px-4 py-5" />
                    <td className="px-4 py-5"><div className="h-6 w-36 shimmer" /></td>
                    <td className="px-4 py-5"><div className="h-5 w-28 shimmer" /></td>
                    <td className="px-4 py-5"><div className="h-5 w-44 shimmer" /></td>
                    <td className="px-4 py-5"><div className="h-5 w-24 shimmer" /></td>
                    <td className="px-4 py-5"><div className="h-5 w-28 shimmer" /></td>
                    <td className="px-4 py-5"><div className="h-6 w-24 shimmer" /></td>
                    <td className="px-4 py-5"><div className="h-5 w-20 shimmer" /></td>
                    <td className="px-4 py-5" />
                  </tr>
                ))
              ) : data?.riders.length ? (
                data.riders.map((rider) => (
                  <tr key={rider._id} className="border-t border-[#5b403f] transition-colors duration-200 hover:bg-[#2a1517]">
                    <td className="px-4 py-5"><Checkbox aria-label={`Select ${rider.fullName}`} checked={selected.includes(rider._id)} onChange={()=>setSelected((ids)=>ids.includes(rider._id)?ids.filter((id)=>id!==rider._id):[...ids,rider._id])}/></td>
                    <td className="px-4 py-5 font-display text-xl text-foreground"><Link href={`/admin/riders/${rider._id}`}>{rider.fullName}</Link></td>
                    <td className="px-4 py-5 font-mono">{rider.phone}</td>
                    <td className="px-4 py-5">{rider.email}</td>
                    <td className="px-4 py-5">{rider.city}</td>
                    <td className="px-4 py-5 font-mono text-[#ffdad8]">{rider.bikeNumber}</td>
                    <td className="px-4 py-5"><StatusBadge status={rider.status} /></td>
                    <td className="px-4 py-5 font-mono text-xs">{new Date(rider.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-5"><div className="flex gap-2"><Button size="sm" variant="outline" onClick={()=>setActionRider(rider)}><UserCog className="h-4 w-4"/>Review</Button><Button size="icon" variant="destructive" title="Delete rider" disabled={deleteMutation.isPending} onClick={()=>setDeleteTarget({type:"single",rider})}><Trash2 className="h-4 w-4"/></Button></div></td>
                  </tr>
                ))
              ) : (
                <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={9}>No riders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div> : null}

      <div className="mt-4 flex items-center justify-between border-t border-[#5b403f] pt-4">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
          Page {data?.meta.page ?? page} of {data?.meta.totalPages || 1}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((value) => value - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= (data?.meta.totalPages || 1) || isFetching} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      </div>
      {actionRider ? <RiderActionDialog rider={actionRider} onClose={()=>setActionRider(null)} onSaved={()=>{setActionRider(null);void refresh()}}/>:null}
      <ConfirmDialog open={Boolean(deleteTarget)} onOpenChange={(open)=>!open&&setDeleteTarget(null)} title={deleteTarget?.type==="bulk"?"Delete selected riders?":"Delete rider?"} description={deleteTarget?.type==="bulk"?`${selected.length} rider records and all uploaded identity documents will be permanently deleted.`:deleteTarget?.type==="single"?`${deleteTarget.rider.fullName} and all uploaded identity documents will be permanently deleted.`:""} confirmLabel={deleteTarget?.type==="bulk"?`Delete ${selected.length} riders`:"Delete rider"} pending={deleteMutation.isPending||bulkDeleteMutation.isPending} onConfirm={()=>{if(deleteTarget?.type==="bulk")bulkDeleteMutation.mutate(selected);else if(deleteTarget?.type==="single")deleteMutation.mutate(deleteTarget.rider._id)}}/>
      </div>
    </AdminShell>
  );
}

function RiderActionDialog({rider,onClose,onSaved}:{rider:Rider;onClose:()=>void;onSaved:()=>void}){
  const [nextStatus,setNextStatus]=useState<RiderStatus>(rider.status);const [remark,setRemark]=useState(rider.adminRemark??"");
  const mutation=useMutation({mutationFn:()=>updateRiderStatus(rider._id,nextStatus,remark),onSuccess:()=>{toast.success("Status saved and email notification queued");onSaved()},onError:(error)=>toast.error(apiErrorMessage(error))});
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event)=>event.target===event.currentTarget&&onClose()}><div className="w-full max-w-lg border border-[#8b3438] bg-[#100d0e] p-5 shadow-2xl sm:rounded-xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#ff535b]">Rider review</p><h2 className="mt-1 font-display text-3xl text-[#f0dfd2]">{rider.fullName}</h2><p className="mt-1 text-xs text-muted-foreground">An email matching this action will be sent automatically.</p></div><Button size="icon" variant="outline" onClick={onClose}><X className="h-4 w-4"/></Button></div><div className="mt-6 grid gap-5"><label className="admin-field"><span>Action</span><Select value={nextStatus} onChange={(event)=>setNextStatus(event.target.value as RiderStatus)}><option value="pending">Pending review</option><option value="approved">Approve & welcome</option><option value="rejected">Reject application</option><option value="contact_again">Contact again / reapply</option></Select></label><label className="admin-field"><span>Remark added to email</span><Textarea value={remark} maxLength={1000} onChange={(event)=>setRemark(event.target.value)} placeholder={nextStatus==="rejected"?"Explain the rejection or how they can improve...":nextStatus==="contact_again"?"List the incorrect or missing information...":"Add an optional personal note..."}/><small className="text-right text-[10px] text-muted-foreground">{remark.length}/1000</small></label><Button disabled={mutation.isPending} onClick={()=>mutation.mutate()}>{mutation.isPending?"Saving & sending...":"Confirm action & send email"}</Button></div></div></div>
}
