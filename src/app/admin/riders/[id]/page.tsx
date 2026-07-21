"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Trash2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { DocumentPreview } from "@/components/riders/document-preview";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiAssetUrl, apiErrorMessage } from "@/services/api";
import { deleteRider, getRider, updateRiderStatus } from "@/services/rider.service";
import { RiderStatus } from "@/types/rider";

export default function RiderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: rider, isLoading } = useQuery({ queryKey: ["rider", id], queryFn: () => getRider(id) });

  const statusMutation = useMutation({
    mutationFn: (status: RiderStatus) => updateRiderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rider", id] });
      queryClient.invalidateQueries({ queryKey: ["riders"] });
      toast.success("Status updated");
    },
    onError: (error) => toast.error(apiErrorMessage(error))
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRider(id),
    onSuccess: () => {
      toast.success("Rider deleted");
      router.replace("/admin/riders");
    },
    onError: (error) => toast.error(apiErrorMessage(error))
  });

  if (isLoading) return <AdminShell><RiderDetailSkeleton /></AdminShell>;
  if (!rider) return <AdminShell><p className="motion-page font-mono text-sm uppercase tracking-[0.12em] text-muted-foreground">Rider not found.</p></AdminShell>;

  return (
    <AdminShell>
      <div className="motion-page">
      <div className="mb-6 flex flex-col gap-3 border-b-2 border-primary pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="break-words font-display text-4xl text-[#ffb3b1] sm:text-5xl">{rider.fullName}</h1>
            <StatusBadge status={rider.status} />
          </div>
          <p className="text-sm text-muted-foreground">{rider.email} · {rider.phone}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => statusMutation.mutate("approved")}><Check className="h-4 w-4" /> Approve</Button>
          <Button size="sm" variant="outline" onClick={() => statusMutation.mutate("rejected")}><X className="h-4 w-4" /> Reject</Button>
          <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate()}><Trash2 className="h-4 w-4" /> Delete</Button>
        </div>
      </div>

      <div className="motion-stagger grid gap-4 lg:grid-cols-2">
        <InfoCard title="Personal Info" rows={[
          ["Date Of Birth", new Date(rider.dob).toLocaleDateString()],
          ["Gender", rider.gender],
          ["Blood Group", rider.bloodGroup],
          ["Emergency Contact", rider.emergencyContact],
          ["City", rider.city],
          ["State", rider.state]
        ]} />
        <InfoCard title="Bike and Identity" rows={[
          ["Bike Model", rider.bikeModel],
          ["Bike Number", rider.bikeNumber],
          ["Experience", `${rider.ridingExperience} years`],
          ["DL Number", rider.dlNumber || "Not provided"],
          ["Aadhaar Number", rider.aadhaarNumber]
        ]} />
      </div>

      <Card className="motion-rise mt-4">
        <CardHeader>
          <CardTitle>Group History</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Joined another riding group before</div>
            <div className="font-medium">{rider.joinedOtherGroupBefore ? "Yes" : "No"}</div>
          </div>
          {rider.joinedOtherGroupBefore ? (
            <div>
              <div className="text-muted-foreground">Reason to leave that group</div>
              <p className="mt-1 whitespace-pre-wrap font-medium">{rider.previousGroupLeaveReason}</p>
            </div>
          ) : null}
          <div>
            <div className="text-muted-foreground">Why this rider wants to join</div>
            <p className="mt-1 whitespace-pre-wrap font-medium">{rider.joinReason}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="motion-rise mt-4">
        <CardHeader>
          <CardTitle>Document Preview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rider.dlFront?.available ? <DocumentPreview label="DL Front" file={rider.dlFront} url={apiAssetUrl(`/admin/riders/${id}/documents/dlFront`)} /> : <MissingDocument label="DL Front" />}
          {rider.dlBack?.available ? <DocumentPreview label="DL Back" file={rider.dlBack} url={apiAssetUrl(`/admin/riders/${id}/documents/dlBack`)} /> : <MissingDocument label="DL Back" />}
          <DocumentPreview label="Aadhaar Front" file={rider.aadhaarFront} url={apiAssetUrl(`/admin/riders/${id}/documents/aadhaarFront`)} />
          <DocumentPreview label="Aadhaar Back" file={rider.aadhaarBack} url={apiAssetUrl(`/admin/riders/${id}/documents/aadhaarBack`)} />
        </CardContent>
      </Card>
      </div>
    </AdminShell>
  );
}

function MissingDocument({ label }: { label: string }) {
  return (
    <div className="rebel-frame rebel-hover bg-muted/40 p-3">
      <div className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#ffb3b1]">{label}</div>
      <div className="flex h-40 items-center justify-center border border-dashed text-sm text-muted-foreground">
        Not uploaded
      </div>
    </div>
  );
}

function RiderDetailSkeleton() {
  return (
    <div className="motion-page grid gap-4">
      <div className="border-b-2 border-primary pb-6">
        <div className="h-14 w-72 shimmer" />
        <div className="mt-4 h-5 w-96 max-w-full shimmer" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 shimmer" />
        <div className="h-72 shimmer" />
      </div>
      <div className="h-56 shimmer" />
    </div>
  );
}

function InfoCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 border-b pb-2 text-sm last:border-b-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
