"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, AtSign, Eye, EyeOff, Lock, LogIn, ShieldCheck } from "lucide-react";
import Link from "next/link";
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
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "rebelsonroads@gmail.com" } });

  const mutation = useMutation({
    mutationFn: loginAdmin,
    onSuccess: () => {
      router.replace("/admin/dashboard");
      router.refresh();
    },
    onError: (error) => toast.error(apiErrorMessage(error))
  });

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-16 sm:p-8">
      <Link href="/" className="absolute left-4 top-4 inline-flex min-h-11 items-center gap-2 border border-[#5b403f] bg-black/20 px-4 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground transition hover:border-[#ff535b] hover:text-foreground sm:left-8 sm:top-8"><ArrowLeft className="h-4 w-4" /> Back to site</Link>
      <div className="motion-page w-full max-w-2xl">
        <div className="motion-rise mb-7 flex flex-col items-center gap-4 text-center sm:mb-10 sm:gap-6">
          <SiteBrand logo={settings?.logo} />
          <div>
            <h1 className="font-display text-4xl text-foreground sm:text-7xl">Admin Control</h1>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#ffb3b1] sm:mt-4 sm:text-sm sm:tracking-[0.35em]">Rebels on Roads management</p>
          </div>
        </div>
        <Card className="rebel-scan relative border-l-8 border-l-[#ffb3b1] bg-[#181818] shadow-2xl">
          <CardHeader>
            <CardTitle>Secure sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="grid gap-5 sm:gap-8">
            <label className="grid gap-3">
              <span className="font-mono text-sm uppercase tracking-[0.18em] text-[#ffdad8]">Identification / Email</span>
              <div className="relative">
                <AtSign className="absolute left-4 top-4 h-5 w-5 text-[#ab8987]" />
                <Input className="h-14 pl-12 text-base sm:h-16 sm:text-lg" type="email" autoComplete="email" placeholder="rebelsonroads@gmail.com" {...register("email")} />
              </div>
              {errors.email ? <span className="text-xs text-destructive">{errors.email.message}</span> : null}
            </label>
            <label className="grid gap-3">
              <span className="font-mono text-sm uppercase tracking-[0.18em] text-[#ffdad8]">Access Cipher</span>
              <div className="relative">
                <Lock className="absolute left-4 top-4 h-5 w-5 text-[#ab8987]" />
                <Input className="h-14 pl-12 pr-12 text-base sm:h-16 sm:text-lg" type={showPassword ? "text" : "password"} autoComplete="current-password" {...register("password")} />
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
              <Link href="/admin/forgot-password" className="justify-self-end font-mono text-[10px] uppercase tracking-[.12em] text-[#ff777d] transition hover:text-white">Forgot password?</Link>
            </label>
            <Button className="h-14 font-display text-2xl sm:h-16 sm:text-3xl" type="submit" disabled={mutation.isPending}>
              <LogIn className="h-4 w-4" />
              {mutation.isPending ? "Signing in" : "Sign in securely"}
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
