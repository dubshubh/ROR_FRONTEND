"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AtSign, Eye, EyeOff, Lock, LogIn, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SiteBrand } from "@/components/layout/site-brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { apiErrorMessage } from "@/services/api";
import { loginAdmin } from "@/services/auth.service";
import { LoginInput, loginSchema } from "@/validations/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: settings } = useSiteSettings();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: loginAdmin,
    onSuccess: ({ token }) => {
      localStorage.setItem("adminToken", token);
      document.cookie = `adminToken=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
      router.replace("/admin/dashboard");
    },
    onError: (error) => toast.error(apiErrorMessage(error))
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="motion-page w-full max-w-3xl">
        <div className="motion-rise mb-10 flex flex-col items-center gap-6 text-center">
          <SiteBrand logo={settings?.logo} />
          <div>
            <h1 className="font-display text-5xl text-foreground sm:text-7xl">Command Center</h1>
            <p className="mt-4 font-mono text-sm uppercase tracking-[0.35em] text-[#ffb3b1]">Authorized personnel only</p>
          </div>
        </div>
        <Card className="rebel-scan relative border-l-8 border-l-[#ffb3b1] bg-[#181818] shadow-2xl">
          <CardHeader>
            <CardTitle>Initialize Access</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="grid gap-8">
            <label className="grid gap-3">
              <span className="font-mono text-sm uppercase tracking-[0.18em] text-[#ffdad8]">Identification / Email</span>
              <div className="relative">
                <AtSign className="absolute left-4 top-4 h-5 w-5 text-[#ab8987]" />
                <Input className="h-16 pl-12 text-lg uppercase" type="email" placeholder="admin@ironriders.mc" {...register("email")} />
              </div>
              {errors.email ? <span className="text-xs text-destructive">{errors.email.message}</span> : null}
            </label>
            <label className="grid gap-3">
              <span className="font-mono text-sm uppercase tracking-[0.18em] text-[#ffdad8]">Access Cipher</span>
              <div className="relative">
                <Lock className="absolute left-4 top-4 h-5 w-5 text-[#ab8987]" />
                <Input className="h-16 pl-12 pr-12 text-lg" type={showPassword ? "text" : "password"} {...register("password")} />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-3 rounded-md p-2 text-[#ab8987] transition hover:bg-[#2a2a2a] hover:text-[#ffdad8]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password ? <span className="text-xs text-destructive">{errors.password.message}</span> : null}
            </label>
            <Button className="h-16 font-display text-3xl" type="submit" disabled={mutation.isPending}>
              <LogIn className="h-4 w-4" />
              {mutation.isPending ? "Initializing" : "Initialize Access"}
            </Button>
            <div className="border-t border-[#5b403f] pt-8 text-center">
              <div className="mb-5 flex items-center justify-center gap-4 font-mono text-sm uppercase tracking-[0.24em] text-[#ffdad8]">
                <span className="h-px w-16 bg-[#5b403f]" />
                <ShieldCheck className="h-4 w-4" />
                <span className="h-px w-16 bg-[#5b403f]" />
              </div>
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">Secure uplink established. All actions are logged and subject to club discipline.</p>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </main>
  );
}
