"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/services/api";
import { resetAdminPassword } from "@/services/auth.service";
import { ResetPasswordInput, resetPasswordSchema } from "@/validations/auth";

export default function ResetPasswordPage() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });
  const mutation = useMutation({ mutationFn: resetAdminPassword, onSuccess: () => router.replace("/admin/login?password=updated") });
  return <main className="admin-auth-page"><div className="admin-auth-glow"/><div className="relative w-full max-w-lg"><div className="mb-7 text-center"><span className="admin-auth-icon"><KeyRound/></span><h1 className="mt-5 font-display text-4xl text-[#f2dfd0] sm:text-6xl">New Password</h1><p className="mt-3 text-sm text-muted-foreground">Choose a strong password for the admin account.</p></div><Card className="border-[#6c2d30] bg-[#111]/95"><CardContent className="p-5 sm:p-7">{!token ? <div className="text-center"><p className="text-red-400">This reset link is incomplete.</p><Button asChild className="mt-5"><Link href="/admin/forgot-password">Request another link</Link></Button></div> : <form onSubmit={handleSubmit(({ password }) => mutation.mutate({ token, password }))} className="grid gap-5"><PasswordField label="New password" name="password" visible={visible} toggle={() => setVisible((v) => !v)} register={register}/>{errors.password ? <p className="text-xs text-red-400">{errors.password.message}</p> : null}<PasswordField label="Confirm password" name="confirmPassword" visible={visible} toggle={() => setVisible((v) => !v)} register={register}/>{errors.confirmPassword ? <p className="text-xs text-red-400">{errors.confirmPassword.message}</p> : null}{mutation.isError ? <p className="text-sm text-red-400">{apiErrorMessage(mutation.error)}</p> : null}<Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Updating..." : "Update password"}</Button></form>}</CardContent></Card></div></main>;
}

function PasswordField({ label, name, visible, toggle, register }: { label: string; name: "password" | "confirmPassword"; visible: boolean; toggle: () => void; register: ReturnType<typeof useForm<ResetPasswordInput>>["register"] }) { return <label className="grid gap-2"><span className="admin-auth-label">{label}</span><div className="relative"><Lock className="absolute left-4 top-4 h-5 w-5 text-[#9a7775]"/><Input {...register(name)} type={visible ? "text" : "password"} autoComplete="new-password" className="h-14 pl-12 pr-12"/><button type="button" onClick={toggle} className="absolute right-3 top-3 p-2 text-[#a58a82]" aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}</button></div></label>; }
