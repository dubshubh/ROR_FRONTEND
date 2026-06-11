"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/services/api";
import { updateSiteLogo } from "@/services/settings.service";
import { SiteLogo } from "@/types/settings";

export function LogoUploader({ logo }: { logo?: SiteLogo }) {
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateSiteLogo,
    onSuccess: () => {
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Logo updated");
    },
    onError: (error) => toast.error(apiErrorMessage(error))
  });

  return (
    <Card className="max-w-xl border-primary">
      <CardHeader>
        <CardTitle>Logo Assets</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="mx-auto flex h-56 w-56 items-center justify-center border-2 border-primary bg-white p-4">
          {logo?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo.url} alt="Current logo" className="h-full w-full object-contain" />
          ) : (
            <ImageUp className="h-10 w-10 text-[#131313]" />
          )}
        </div>
        <div className="grid gap-3">
          <Input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <div className="grid gap-3">
            <Button className="w-full" disabled={!file || mutation.isPending} onClick={() => file && mutation.mutate(file)}>
              <ImageUp className="h-4 w-4" />
              {mutation.isPending ? "Uploading" : "Upload New Logo"}
            </Button>
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Supported: JPG, PNG, WEBP. Max 2MB.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
