"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SiteBrand } from "@/components/layout/site-brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { apiErrorMessage } from "@/services/api";
import { resetPasswordAdmin } from "@/services/auth.service";
import { ResetPasswordInput, resetPasswordSchema } from "@/validations/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromUrl,
      password: "",
      confirmPassword: ""
    }
  });

  useEffect(() => {
    if (tokenFromUrl) {
      setValue("token", tokenFromUrl);
    }
  }, [tokenFromUrl, setValue]);

  const passwordValue = watch("password") || "";
  const confirmValue = watch("confirmPassword") || "";

  // Password criteria indicators
  const hasMinLength = passwordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const hasMatch = passwordValue.length > 0 && passwordValue === confirmValue;

  const resetMutation = useMutation({
    mutationFn: resetPasswordAdmin,
    onSuccess: () => {
      setIsSuccess(true);
      toast.success("Password reset successfully! Redirecting to sign in...");
    },
    onError: (error) => toast.error(apiErrorMessage(error))
  });

  // Countdown timer on success
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.replace("/admin/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSuccess, router]);

  if (isSuccess) {
    return (
      <div className="space-y-6 py-4 text-center font-mono animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-2xl sm:text-3xl text-white">Access Cipher Updated</h3>
          <p className="text-xs text-[#cfbeb6] max-w-md mx-auto leading-relaxed">
            Your administrator password has been securely updated and previous credentials retired. Your session token has been rotated.
          </p>
        </div>

        <div className="p-3 bg-[#111915] border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono max-w-sm mx-auto">
          Redirecting to command sign-in in <strong>{countdown} seconds</strong>...
        </div>

        <Button
          asChild
          className="h-11 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs uppercase font-bold tracking-wider"
        >
          <Link href="/admin/login">Go to Sign In Now</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) =>
        resetMutation.mutate({ token: values.token, password: values.password })
      )}
      className="grid gap-5 sm:gap-6"
    >
      {/* Token field (Hidden or editable if token not in URL) */}
      {!tokenFromUrl ? (
        <label className="grid gap-2 font-mono text-xs">
          <span className="uppercase text-[#ffdad8] font-bold">Reset Authorization Token:</span>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-[#ab8987]" />
            <Input
              className="h-11 pl-10 text-xs bg-[#110d0d] border-[#442828] text-white"
              placeholder="Paste your 32-byte authorization token"
              {...register("token")}
            />
          </div>
          {errors.token ? <span className="text-xs text-destructive">{errors.token.message}</span> : null}
        </label>
      ) : (
        <input type="hidden" {...register("token")} />
      )}

      {/* New Password */}
      <label className="grid gap-2">
        <span className="font-mono text-sm uppercase tracking-[0.18em] text-[#ffdad8]">
          New Access Cipher
        </span>
        <div className="relative">
          <Lock className="absolute left-4 top-4 h-5 w-5 text-[#ab8987]" />
          <Input
            className="h-14 pl-12 pr-12 text-base sm:h-16 sm:text-lg"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Enter new password"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((curr) => !curr)}
            className="absolute right-3 top-3 rounded-md p-2 text-[#ab8987] transition hover:bg-[#2a2a2a] hover:text-[#ffdad8] cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password ? (
          <span className="text-xs text-destructive font-mono">{errors.password.message}</span>
        ) : null}
      </label>

      {/* Confirm Password */}
      <label className="grid gap-2">
        <span className="font-mono text-sm uppercase tracking-[0.18em] text-[#ffdad8]">
          Confirm New Access Cipher
        </span>
        <div className="relative">
          <Lock className="absolute left-4 top-4 h-5 w-5 text-[#ab8987]" />
          <Input
            className="h-14 pl-12 pr-12 text-base sm:h-16 sm:text-lg"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter new password"
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((curr) => !curr)}
            className="absolute right-3 top-3 rounded-md p-2 text-[#ab8987] transition hover:bg-[#2a2a2a] hover:text-[#ffdad8] cursor-pointer"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.confirmPassword ? (
          <span className="text-xs text-destructive font-mono">{errors.confirmPassword.message}</span>
        ) : null}
      </label>

      {/* Password Security Criteria Checklist */}
      <div className="p-3 bg-[#130e0e] border border-[#3e2424] rounded-xl space-y-1.5 font-mono text-xs">
        <span className="text-[10px] text-muted-foreground uppercase block font-bold mb-1">
          Cipher Security Requirements:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-400" : "text-[#8a7672]"}`}>
            {hasMinLength ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            <span>Minimum 8 characters</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-emerald-400" : "text-[#8a7672]"}`}>
            {hasUppercase ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            <span>At least 1 uppercase letter</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-400" : "text-[#8a7672]"}`}>
            {hasNumber ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            <span>At least 1 number</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasMatch ? "text-emerald-400" : "text-[#8a7672]"}`}>
            {hasMatch ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            <span>Passwords match</span>
          </div>
        </div>
      </div>

      <Button
        className="h-14 font-display text-2xl sm:h-16 sm:text-3xl bg-[#ff535b] hover:bg-[#ff3b44] text-white cursor-pointer"
        type="submit"
        disabled={resetMutation.isPending}
      >
        <KeyRound className="h-5 w-5 mr-2" />
        {resetMutation.isPending ? "Updating Cipher..." : "Commit New Cipher"}
      </Button>

      <div className="border-t border-[#5b403f] pt-4 text-center">
        <Link
          href="/admin/login"
          className="font-mono text-xs text-muted-foreground hover:text-[#ffdad8] inline-flex items-center gap-1 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Admin Sign In
        </Link>
      </div>
    </form>
  );
}

export default function AdminResetPasswordPage() {
  const { data: settings } = useSiteSettings();

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-16 sm:p-8">
      <Link
        href="/admin/login"
        className="absolute left-4 top-4 inline-flex min-h-11 items-center gap-2 border border-[#5b403f] bg-black/20 px-4 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground transition hover:border-[#ff535b] hover:text-foreground sm:left-8 sm:top-8"
      >
        <ArrowLeft className="h-4 w-4" /> Admin Login
      </Link>

      <div className="motion-page w-full max-w-2xl">
        <div className="motion-rise mb-7 flex flex-col items-center gap-4 text-center sm:mb-10 sm:gap-6">
          <SiteBrand logo={settings?.logo} />
          <div>
            <h1 className="font-display text-4xl text-foreground sm:text-7xl">Set New Cipher</h1>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#ffb3b1] sm:mt-4 sm:text-sm sm:tracking-[0.35em]">
              Authorized Credential Rotation
            </p>
          </div>
        </div>

        <Card className="rebel-scan relative border-l-8 border-l-[#ff535b] bg-[#181818] shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Configure Access Cipher</CardTitle>
            <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-red-950/40 text-[#ffb3b1] border border-red-900/40 font-bold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-400" /> SECURE RESET
            </span>
          </CardHeader>

          <CardContent>
            <Suspense
              fallback={
                <div className="h-48 flex items-center justify-center font-mono text-xs text-muted-foreground">
                  Loading cryptographic authorization parameters...
                </div>
              }
            >
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

