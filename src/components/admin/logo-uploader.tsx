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
    <Card className="admin-settings-card max-w-xl border-primary">
      <CardHeader>
        <CardTitle>Logo Assets</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="admin-logo-preview mx-auto flex h-48 w-48 items-center justify-center p-4 sm:h-56 sm:w-56">
          {logo?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo.url} alt="Current logo" className="h-full w-full object-contain" />
          ) : (
            <ImageUp className="h-10 w-10 text-[#ff535b]" />
          )}
        </div>
        <div className="grid gap-3">
          <Input id="admin-logo-file"
            className="sr-only"
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <label htmlFor="admin-logo-file" className="admin-file-picker"><ImageUp className="h-5 w-5"/><span>{file ? file.name : "Choose a logo image"}</span><b>Browse</b></label>
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
