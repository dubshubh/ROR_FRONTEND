"use client";

import Link from "next/link";
import { ArrowLeft, AtSign, KeyRound, MailCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/services/api";
import { requestPasswordReset } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const mutation = useMutation({ mutationFn: requestPasswordReset, onSuccess: (result) => { setSent(true); setPreviewUrl(result.data?.previewResetUrl); } });
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); mutation.mutate(String(new FormData(event.currentTarget).get("email"))); }
  return <main className="admin-auth-page"><div className="admin-auth-glow" /><div className="relative w-full max-w-lg"><Link href="/admin/login" className="admin-auth-back"><ArrowLeft /> Back to login</Link><div className="mb-7 text-center"><span className="admin-auth-icon"><KeyRound /></span><h1 className="mt-5 font-display text-4xl text-[#f2dfd0] sm:text-6xl">Recover Access</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Receive a secure, single-use password reset link.</p></div><Card className="border-[#6c2d30] bg-[#111]/95"><CardContent className="p-5 sm:p-7">{sent ? <div className="text-center"><MailCheck className="mx-auto h-12 w-12 text-emerald-400"/><h2 className="mt-4 font-display text-2xl">Check your inbox</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">If the account exists, instructions were sent to rebelsonroads@gmail.com. The link expires in 30 minutes.</p>{previewUrl ? <Button asChild className="mt-6 w-full"><a href={previewUrl}>Open development reset link</a></Button> : null}</div> : <form onSubmit={submit} className="grid gap-5"><label className="grid gap-2"><span className="admin-auth-label">Administrator email</span><div className="relative"><AtSign className="absolute left-4 top-4 h-5 w-5 text-[#9a7775]"/><Input name="email" type="email" required defaultValue="rebelsonroads@gmail.com" autoComplete="email" className="h-14 pl-12"/></div></label>{mutation.isError ? <p className="text-sm text-red-400">{apiErrorMessage(mutation.error)}</p> : null}<Button type="submit" className="w-full" disabled={mutation.isPending}>{mutation.isPending ? "Sending..." : "Send reset link"}</Button></form>}</CardContent></Card></div></main>;
}
