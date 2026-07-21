"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { apiErrorMessage } from "@/services/api";
import {
  deletePartnerEnquiry,
  getPartnerEnquiries,
  updatePartnerEnquiryStatus,
  type PartnerEnquiryStatus
} from "@/services/partner.service";

export default function PartnerEnquiriesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | PartnerEnquiryStatus>("");
  const debouncedSearch = useDebouncedValue(search.trim());
  useEffect(() => setPage(1), [debouncedSearch, status]);
  const params = useMemo(() => ({ page, limit: 20, ...(status ? { status } : {}), ...(debouncedSearch ? { search: debouncedSearch } : {}) }), [debouncedSearch, page, status]);
  const query = useQuery({ queryKey: ["partner-enquiries", params], queryFn: () => getPartnerEnquiries(params) });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: PartnerEnquiryStatus }) => updatePartnerEnquiryStatus(id, nextStatus),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["partner-enquiries"] }); toast.success("Enquiry status updated"); },
    onError: (error) => toast.error(apiErrorMessage(error))
  });
  const deleteMutation = useMutation({
    mutationFn: deletePartnerEnquiry,
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["partner-enquiries"] }); toast.success("Enquiry deleted"); },
    onError: (error) => toast.error(apiErrorMessage(error))
  });

  return <AdminShell><div className="motion-page">
    <div className="mb-8 border-b-2 border-primary pb-6"><h1 className="font-display text-4xl text-[#ffb3b1] sm:text-5xl">Partner Enquiries</h1><p className="mt-2 text-[#ffdad8]">Review collaboration proposals submitted through the public contact page.</p></div>
    <Card className="mb-6 grid gap-3 p-5 sm:grid-cols-[1fr_220px]">
      <div className="relative"><Search className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" /><Input className="pl-11" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search brand, contact, email or category" /></div>
      <Select value={status} onChange={(event) => setStatus(event.target.value as "" | PartnerEnquiryStatus)}><option value="">All statuses</option><option value="new">New</option><option value="reviewed">Reviewed</option></Select>
    </Card>
    {query.isError ? <Card className="p-8 text-center"><p className="text-destructive">{apiErrorMessage(query.error)}</p><Button className="mt-4" onClick={() => void query.refetch()}>Try again</Button></Card> : null}
    {query.isLoading ? <div className="grid gap-4">{Array.from({ length: 4 }).map((_, index) => <div className="h-48 shimmer" key={index} />)}</div> : null}
    {!query.isLoading && !query.isError && !query.data?.enquiries.length ? <Card className="p-10 text-center text-muted-foreground">No partner enquiries found.</Card> : null}
    <div className="grid gap-4">{query.data?.enquiries.map((enquiry) => <Card className="rebel-frame p-5" key={enquiry._id}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h2 className="font-display text-2xl text-foreground">{enquiry.brandName}</h2><span className="border border-primary px-2 py-1 font-mono text-[10px] uppercase">{enquiry.status}</span></div><p className="mt-1 text-sm text-muted-foreground">{enquiry.contactName} · {enquiry.category} · {new Date(enquiry.createdAt).toLocaleDateString("en-IN")}</p></div><div className="flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><a href={`mailto:${enquiry.email}`}><Mail className="h-4 w-4" />Reply</a></Button><Button size="sm" variant="outline" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: enquiry._id, nextStatus: enquiry.status === "new" ? "reviewed" : "new" })}>Mark {enquiry.status === "new" ? "reviewed" : "new"}</Button><Button size="sm" variant="destructive" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`Delete the enquiry from ${enquiry.brandName}?`)) deleteMutation.mutate(enquiry._id); }}><Trash2 className="h-4 w-4" />Delete</Button></div></div>
      <p className="mt-4 whitespace-pre-wrap border-t border-[#5b403f] pt-4 text-sm leading-6">{enquiry.message}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted-foreground"><span>{enquiry.email}</span><span>{enquiry.phone}</span>{enquiry.website ? <a className="text-[#ffb3b1] underline" href={enquiry.website} rel="noreferrer" target="_blank">Website</a> : null}</div>
    </Card>)}</div>
    {query.data && query.data.meta.totalPages > 1 ? <div className="mt-6 flex items-center justify-between"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><span className="font-mono text-xs">Page {page} of {query.data.meta.totalPages}</span><Button variant="outline" disabled={page >= query.data.meta.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></div> : null}
  </div></AdminShell>;
}
