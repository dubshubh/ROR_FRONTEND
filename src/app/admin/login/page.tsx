"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  AtSign,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  Send,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
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
import { forgotPasswordAdmin, loginAdmin } from "@/services/auth.service";
import {
  ForgotPasswordInput,
  forgotPasswordSchema,
  LoginInput,
  loginSchema
} from "@/validations/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: settings } = useSiteSettings();
  const [view, setView] = useState<"login" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotSubmittedEmail, setForgotSubmittedEmail] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  // Login form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "" }
  });

  const loginMutation = useMutation({
    mutationFn: loginAdmin,
    onSuccess: () => {
      router.replace("/admin/dashboard");
      router.refresh();
    },
    onError: (error) => toast.error(apiErrorMessage(error))
  });

  // Forgot password form
  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors },
    reset: resetForgotForm
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" }
  });

  const forgotMutation = useMutation({
    mutationFn: forgotPasswordAdmin,
    onSuccess: (data, variables) => {
      setForgotSubmittedEmail(variables.email);
      if (data?.data?.devResetUrl) {
        const rawUrl = data.data.devResetUrl;
        const normalized = typeof window !== "undefined"
          ? rawUrl.replace(/^https?:\/\/[^/]+/, window.location.origin)
          : rawUrl;
        setDevResetUrl(normalized);
      }
      toast.success("Password reset instructions dispatched!");
    },
    onError: (error) => toast.error(apiErrorMessage(error))
  });

  function switchToForgot() {
    setView("forgot");
    setForgotSubmittedEmail(null);
    setDevResetUrl(null);
    resetForgotForm();
  }

  function switchToLogin() {
    setView("login");
    setForgotSubmittedEmail(null);
    setDevResetUrl(null);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-16 sm:p-8">
      <Link
        href="/"
        className="absolute left-4 top-4 inline-flex min-h-11 items-center gap-2 border border-[#5b403f] bg-black/20 px-4 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground transition hover:border-[#ff535b] hover:text-foreground sm:left-8 sm:top-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to site
      </Link>

      <div className="motion-page w-full max-w-2xl">
        <div className="motion-rise mb-7 flex flex-col items-center gap-4 text-center sm:mb-10 sm:gap-6">
          <SiteBrand logo={settings?.logo} />
          <div>
            <h1 className="font-display text-4xl text-foreground sm:text-7xl">Admin Control</h1>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#ffb3b1] sm:mt-4 sm:text-sm sm:tracking-[0.35em]">
              Rebels on Roads management
            </p>
          </div>
        </div>

        <Card className="rebel-scan relative border-l-8 border-l-[#ffb3b1] bg-[#181818] shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {view === "login" ? "Secure sign in" : "Recover Access Cipher"}
            </CardTitle>
            <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-red-950/40 text-[#ffb3b1] border border-red-900/40 font-bold">
              {view === "login" ? "AUTHORIZATION" : "RECOVERY PROTOCOL"}
            </span>
          </CardHeader>

          <CardContent>
            {view === "login" ? (
              /* VIEW 1: SIGN IN FORM */
              <form
                onSubmit={handleLoginSubmit((values) => loginMutation.mutate(values))}
                className="grid gap-5 sm:gap-8"
              >
                <label className="grid gap-3">
                  <span className="font-mono text-sm uppercase tracking-[0.18em] text-[#ffdad8]">
                    Identification / Email
                  </span>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-4 h-5 w-5 text-[#ab8987]" />
                    <Input
                      className="h-14 pl-12 text-base sm:h-16 sm:text-lg"
                      type="email"
                      autoComplete="username"
                      placeholder="Enter admin email"
                      {...registerLogin("email")}
                    />
                  </div>
                  {loginErrors.email ? (
                    <span className="text-xs text-destructive">{loginErrors.email.message}</span>
                  ) : null}
                </label>

                <label className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm uppercase tracking-[0.18em] text-[#ffdad8]">
                      Access Cipher
                    </span>
                    <button
                      type="button"
                      onClick={switchToForgot}
                      className="font-mono text-xs text-[#00f0ff] hover:text-[#5ce8ff] underline transition cursor-pointer"
                    >
                      Forgot Cipher / Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-4 h-5 w-5 text-[#ab8987]" />
                    <Input
                      className="h-14 pl-12 pr-12 text-base sm:h-16 sm:text-lg"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter access cipher"
                      {...registerLogin("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-3 rounded-md p-2 text-[#ab8987] transition hover:bg-[#2a2a2a] hover:text-[#ffdad8] cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {loginErrors.password ? (
                    <span className="text-xs text-destructive">{loginErrors.password.message}</span>
                  ) : null}
                </label>

                <Button
                  className="h-14 font-display text-2xl sm:h-16 sm:text-3xl cursor-pointer"
                  type="submit"
                  disabled={loginMutation.isPending}
                >
                  <LogIn className="h-4 w-4" />
                  {loginMutation.isPending ? "Signing in..." : "Sign in securely"}
                </Button>

                <div className="border-t border-[#5b403f] pt-8 text-center">
                  <div className="mb-5 flex items-center justify-center gap-4 font-mono text-sm uppercase tracking-[0.24em] text-[#ffdad8]">
                    <span className="h-px w-16 bg-[#5b403f]" />
                    <ShieldCheck className="h-4 w-4" />
                    <span className="h-px w-16 bg-[#5b403f]" />
                  </div>
                  <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    Secure uplink established. All actions are logged and subject to club discipline.
                  </p>
                </div>
              </form>
            ) : forgotSubmittedEmail ? (
              /* VIEW 2: FORGOT PASSWORD DISPATCHED CONFIRMATION */
              <div className="space-y-6 py-2 text-center font-mono animate-in fade-in zoom-in-95 duration-200">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-display text-2xl text-white">Reset Instructions Dispatched</h3>
                  <p className="text-xs text-[#cfbeb6] max-w-md mx-auto leading-relaxed">
                    If <strong>{forgotSubmittedEmail}</strong> matches an active administrator account, an authorization link has been beamed to your inbox. The link expires in <strong>15 minutes</strong>.
                  </p>
                </div>

                {/* Direct Action Link */}
                {devResetUrl && (
                  <div className="p-4 bg-[#141d18] border border-emerald-500/40 rounded-xl text-left space-y-3 max-w-md mx-auto">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        <KeyRound className="h-3.5 w-3.5" /> Direct Reset Ready:
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        Valid for 15m
                      </span>
                    </div>

                    <p className="text-xs text-[#bfe0cd] leading-relaxed">
                      You can click below to proceed directly to the password reset form without waiting for your email:
                    </p>

                    <Button
                      asChild
                      className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer"
                    >
                      <Link href={devResetUrl}>
                        <KeyRound className="h-4 w-4 mr-2 text-black" /> Open Reset Password Form Now
                      </Link>
                    </Button>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={switchToLogin}
                    className="w-full sm:w-auto h-11 px-6 border-[#552e2e] text-[#ffdad8] hover:bg-[#251818] cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Sign In
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setForgotSubmittedEmail(null);
                      setDevResetUrl(null);
                    }}
                    className="w-full sm:w-auto h-11 px-6 bg-[#ff535b] hover:bg-[#ff3b44] text-white cursor-pointer"
                  >
                    Send to Another Email
                  </Button>
                </div>
              </div>
            ) : (
              /* VIEW 3: FORGOT PASSWORD REQUEST FORM */
              <form
                onSubmit={handleForgotSubmit((values) => forgotMutation.mutate(values))}
                className="grid gap-5 sm:gap-6 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="p-3 bg-[#1d1414] border border-[#442828] rounded-xl flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-[#ff535b] shrink-0 mt-0.5" />
                  <p className="font-mono text-xs text-[#d6c5be] leading-relaxed">
                    Enter your registered administrator email. A single-use, 15-minute cryptographic authorization cipher will be dispatched to your inbox.
                  </p>
                </div>

                <label className="grid gap-3">
                  <span className="font-mono text-sm uppercase tracking-[0.18em] text-[#ffdad8]">
                    Administrator Email Address
                  </span>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-4 h-5 w-5 text-[#ab8987]" />
                    <Input
                      className="h-14 pl-12 text-base sm:h-16 sm:text-lg"
                      type="email"
                      autoComplete="email"
                      placeholder="e.g. rebelsonroads@gmail.com"
                      {...registerForgot("email")}
                    />
                  </div>
                  {forgotErrors.email ? (
                    <span className="text-xs text-destructive">{forgotErrors.email.message}</span>
                  ) : null}
                </label>

                <div className="grid gap-3 sm:grid-cols-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={switchToLogin}
                    className="h-12 border-[#552e2e] text-[#ffdad8] hover:bg-[#251818] font-mono text-xs uppercase cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Cancel & Sign In
                  </Button>

                  <Button
                    className="h-12 bg-[#ff535b] hover:bg-[#ff3b44] text-white font-mono text-xs uppercase font-bold tracking-wider cursor-pointer"
                    type="submit"
                    disabled={forgotMutation.isPending}
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    {forgotMutation.isPending ? "Dispatching..." : "Dispatch Reset Link"}
                  </Button>
                </div>

                <div className="border-t border-[#5b403f] pt-6 text-center">
                  <p className="font-mono text-[11px] text-muted-foreground uppercase">
                    Rate limited to 5 requests per 15 minutes. All reset inquiries are audited.
                  </p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
