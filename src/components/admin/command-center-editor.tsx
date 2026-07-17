"use client";

import { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Gauge } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/services/api";
import { updateCommandCenter } from "@/services/settings.service";
import { SiteSettings } from "@/types/settings";

const defaults: SiteSettings["commandCenter"] = {
  launchTitle: "Sunrise Ride to Alibaug",
  launchDetails: "Ride start: 5:30 AM · Meet point: Gateway of the city",
  membersCount: "120+",
  runsCount: "35"
};

export function CommandCenterEditor({ values }: { values?: SiteSettings["commandCenter"] }) {
  const queryClient = useQueryClient();
  const current = values ?? defaults;
  const mutation = useMutation({
    mutationFn: updateCommandCenter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Road Command Center updated");
    },
    onError: (error) => toast.error(apiErrorMessage(error))
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({
      launchTitle: String(form.get("launchTitle")),
      launchDetails: String(form.get("launchDetails")),
      membersCount: String(form.get("membersCount")),
      runsCount: String(form.get("runsCount"))
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5" /> Road Command Center</CardTitle></CardHeader>
      <CardContent className="pt-5">
        <form className="grid gap-4" onSubmit={submit} key={JSON.stringify(current)}>
          <label className="grid gap-1 text-sm">Next launch title<Input name="launchTitle" required maxLength={120} defaultValue={current.launchTitle} /></label>
          <label className="grid gap-1 text-sm">Launch details<Input name="launchDetails" required maxLength={240} defaultValue={current.launchDetails} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">Members<Input name="membersCount" required maxLength={20} defaultValue={current.membersCount} /></label>
            <label className="grid gap-1 text-sm">Runs<Input name="runsCount" required maxLength={20} defaultValue={current.runsCount} /></label>
          </div>
          <Button className="sm:justify-self-start" type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Update command center"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
