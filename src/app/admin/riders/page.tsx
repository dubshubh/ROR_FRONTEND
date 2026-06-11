"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiErrorMessage } from "@/services/api";
import { getRiders, downloadRiders } from "@/services/rider.service";

export default function RidersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const params = useMemo(() => {
    const nextParams: Record<string, string | number> = { page: 1, limit: 1000, sortBy, sortOrder };

    const trimmedSearch = search.trim();
    if (trimmedSearch) nextParams.search = trimmedSearch;

    if (status) nextParams.status = status;

    const trimmedCity = city.trim();
    if (trimmedCity) nextParams.city = trimmedCity;

    const trimmedState = state.trim();
    if (trimmedState) nextParams.state = trimmedState;

    return nextParams;
  }, [search, status, city, state, sortBy, sortOrder]);
  const { data, isLoading, isFetching } = useQuery({ queryKey: ["riders", params], queryFn: () => getRiders(params) });

  return (
    <AdminShell>
      <div className="motion-page">
      <div className="mb-8 flex flex-col gap-4 border-b-2 border-primary pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-5xl text-[#ffb3b1]">Rider Registry</h1>
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

      <div className="motion-rise overflow-hidden rebel-frame bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#2a2a2a] font-mono text-[11px] uppercase tracking-[0.12em] text-[#ffb3b1]">
              <tr>
                {["Name", "Phone", "Email", "City", "Bike Number", "Status", "Created Date"].map((header) => (
                  <th key={header} className="px-4 py-4 font-bold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-t border-[#5b403f]">
                    <td className="px-4 py-5"><div className="h-6 w-36 shimmer" /></td>
                    <td className="px-4 py-5"><div className="h-5 w-28 shimmer" /></td>
                    <td className="px-4 py-5"><div className="h-5 w-44 shimmer" /></td>
                    <td className="px-4 py-5"><div className="h-5 w-24 shimmer" /></td>
                    <td className="px-4 py-5"><div className="h-5 w-28 shimmer" /></td>
                    <td className="px-4 py-5"><div className="h-6 w-24 shimmer" /></td>
                    <td className="px-4 py-5"><div className="h-5 w-20 shimmer" /></td>
                  </tr>
                ))
              ) : data?.riders.length ? (
                data.riders.map((rider) => (
                  <tr key={rider._id} className="border-t border-[#5b403f] transition-colors duration-200 hover:bg-[#2a1517]">
                    <td className="px-4 py-5 font-display text-xl text-foreground"><Link href={`/admin/riders/${rider._id}`}>{rider.fullName}</Link></td>
                    <td className="px-4 py-5 font-mono">{rider.phone}</td>
                    <td className="px-4 py-5">{rider.email}</td>
                    <td className="px-4 py-5">{rider.city}</td>
                    <td className="px-4 py-5 font-mono text-[#ffdad8]">{rider.bikeNumber}</td>
                    <td className="px-4 py-5"><StatusBadge status={rider.status} /></td>
                    <td className="px-4 py-5 font-mono text-xs">{new Date(rider.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>No riders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#5b403f] pt-4">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
          All matching riders are listed above.
        </p>
      </div>
      </div>
    </AdminShell>
  );
}
