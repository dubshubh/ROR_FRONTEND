"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, Bike, Check, CheckCircle2, FileCheck2, FileUp, Fingerprint, HeartPulse, LockKeyhole, MapPin, Send, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";
import { FieldError, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/form/form-field";
import { PublicHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/services/api";
import { registerRider } from "@/services/rider.service";
import { RiderRegistrationInput, riderRegistrationSchema } from "@/validations/rider";

const genders = ["Male", "Female", "Other"];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const steps = ["Rider identity", "Machine profile", "Verification", "Riding history", "Documents"];

export default function JoinGroupPage() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<RiderRegistrationInput>({ resolver: zodResolver(riderRegistrationSchema), defaultValues: { joinedOtherGroupBefore: false, previousGroupLeaveReason: "", terms: false } });
  const joinedOtherGroupBefore = watch("joinedOtherGroupBefore");
  const mutation = useMutation({ mutationFn: registerRider, onSuccess: () => { toast.success("Application received"); setSubmitted(true); reset(); window.scrollTo({ top: 0, behavior: "smooth" }); }, onError: (error) => toast.error(apiErrorMessage(error)) });

  function onSubmit(values: RiderRegistrationInput) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => { if (value instanceof FileList) { if (value.length > 0) formData.append(key, value[0]); return; } if (value === undefined || value === null || value === "") return; formData.append(key, String(value)); });
    mutation.mutate(formData);
  }
  const fileError = (name: keyof RiderRegistrationInput) => errors[name] as FieldError | undefined;

  if (submitted) return <main className="min-h-screen bg-[#070707]"><PublicHeader /><section className="join-success"><div className="join-success-ring"><CheckCircle2 /></div><p className="join-label">Transmission received</p><h1>Your application<br /><span>is in review.</span></h1><p>The road captain will verify your information and documents. A confirmation has been sent to your email, and you&apos;ll receive a separate welcome message after approval.</p><div><Button onClick={() => setSubmitted(false)} variant="outline">Submit another application</Button><Button asChild><Link href="/calendar">Explore road calendar <ArrowRight className="h-4 w-4" /></Link></Button></div></section><SiteFooter /></main>;

  return <main className="join-page min-h-screen bg-[#070707]"><PublicHeader />
    <section className="join-hero"><div className="join-hero-grid" aria-hidden="true" /><div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1fr_.72fr] lg:items-end lg:py-24"><div><p className="join-label"><Sparkles className="h-4 w-4" /> Membership application</p><h1 className="join-title mt-5">Earn your place.<br /><span>Join the crew.</span></h1><p className="mt-6 max-w-xl text-base leading-8 text-[#aa978c]">Rebels on Roads is built on discipline, trust and shared responsibility. Tell us who you are, what you ride and why the road matters to you.</p></div><div className="join-hero-promise"><ShieldCheck /><div><strong>Verified membership</strong><span>Every rider is reviewed by the command center before joining.</span></div></div></div></section>

    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[260px_1fr] lg:items-start lg:py-16">
      <aside className="join-sidebar">
        <p>Application route</p>
        <ol>{steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><i /><strong>{step}</strong></li>)}</ol>
        <div className="join-secure"><LockKeyhole /><div><strong>Private & secure</strong><span>Documents are available only to authenticated administrators during verification.</span></div></div>
      </aside>

      <div className="join-form-stack">
        <FormSection number="01" icon={UserRound} eyebrow="Rider identity" title="Let&apos;s start with you.">
          <div className="join-field-grid sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Full name" error={errors.fullName}><Input autoComplete="name" placeholder="Your legal name" {...register("fullName")} /></FormField>
            <FormField label="Email" error={errors.email}><Input type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} /></FormField>
            <FormField label="Phone number" error={errors.phone}><Input inputMode="numeric" autoComplete="tel" placeholder="10-digit number" {...register("phone")} maxLength={10} /></FormField>
            <FormField label="Date of birth" error={errors.dob}><Input type="date" {...register("dob")} /></FormField>
            <FormField label="Gender" error={errors.gender}><Select {...register("gender")}><option value="">Select gender</option>{genders.map((item) => <option key={item}>{item}</option>)}</Select></FormField>
            <FormField label="Blood group" error={errors.bloodGroup}><Select {...register("bloodGroup")}><option value="">Select group</option>{bloodGroups.map((item) => <option key={item}>{item}</option>)}</Select></FormField>
            <FormField label="Emergency contact" error={errors.emergencyContact}><Input inputMode="numeric" placeholder="10-digit number" {...register("emergencyContact")} maxLength={10} /></FormField>
          </div>
        </FormSection>

        <FormSection number="02" icon={Bike} eyebrow="Machine profile" title="You and your machine.">
          <div className="join-field-grid sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="City" error={errors.city}><Input autoComplete="address-level2" placeholder="Dehradun" {...register("city")} /></FormField>
            <FormField label="State" error={errors.state}><Input autoComplete="address-level1" placeholder="Uttarakhand" {...register("state")} /></FormField>
            <FormField label="Bike model" error={errors.bikeModel}><Input placeholder="Make and model" {...register("bikeModel")} /></FormField>
            <FormField label="Bike number" error={errors.bikeNumber}><Input placeholder="UK 00 XX 0000" {...register("bikeNumber")} /></FormField>
            <FormField label="Riding experience" error={errors.ridingExperience}><Input type="number" min={0} placeholder="Years" {...register("ridingExperience")} /></FormField>
          </div>
        </FormSection>

        <FormSection number="03" icon={Fingerprint} eyebrow="Verification" title="Identity checkpoint.">
          <div className="join-field-grid sm:grid-cols-2"><FormField label="Driving licence number (optional)" error={errors.dlNumber}><Input placeholder="Licence number" {...register("dlNumber")} /></FormField><FormField label="Aadhaar number" error={errors.aadhaarNumber}><Input inputMode="numeric" placeholder="12-digit number" {...register("aadhaarNumber")} maxLength={12} /></FormField></div>
        </FormSection>

        <FormSection number="04" icon={HeartPulse} eyebrow="Riding history" title="What brings you here?">
          <div className="join-field-grid"><FormField label="Have you joined another riding group?" error={errors.joinedOtherGroupBefore}><Select {...register("joinedOtherGroupBefore", { setValueAs: (value) => value === "true" })}><option value="false">No</option><option value="true">Yes</option></Select></FormField>{joinedOtherGroupBefore ? <FormField label="Why did you leave that group?" error={errors.previousGroupLeaveReason}><Textarea rows={4} placeholder="Give the command center some context." {...register("previousGroupLeaveReason")} /></FormField> : null}<FormField label="Why Rebels on Roads? (optional)" error={errors.joinReason}><Textarea rows={4} placeholder="Share your goals, expectations and the kind of rider you want to become." {...register("joinReason")} /></FormField></div>
        </FormSection>

        <FormSection number="05" icon={FileCheck2} eyebrow="Documents" title="Final verification files.">
          <div className="join-upload-grid">{[["Driving licence · Front (optional)", "dlFront"], ["Driving licence · Back (optional)", "dlBack"], ["Aadhaar · Front", "aadhaarFront"], ["Aadhaar · Back", "aadhaarBack"]].map(([label, name]) => <FormField key={name} label={label} error={fileError(name as keyof RiderRegistrationInput)}><div className="join-upload"><FileUp /><div><strong>Choose file</strong><span>JPG, PNG or PDF</span></div><Input type="file" accept=".jpg,.jpeg,.png,.pdf" {...register(name as keyof RiderRegistrationInput)} /></div></FormField>)}</div>
        </FormSection>

        <div className="join-submit"><label><input type="checkbox" {...register("terms")} /><span className="join-check"><Check /></span><span>I consent to membership verification and secure document review by authorized Rebels on Roads administrators.</span></label>{errors.terms ? <p>{errors.terms.message}</p> : null}<Button type="submit" size="lg" disabled={mutation.isPending}><Send className="h-4 w-4" />{mutation.isPending ? "Transmitting application…" : "Submit application"}</Button></div>
      </div>
    </form>
    <SiteFooter />
  </main>;
}

function FormSection({ number, icon: Icon, eyebrow, title, children }: { number: string; icon: typeof MapPin; eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="join-form-card"><span className="join-form-number">{number}</span><header><div className="join-form-icon"><Icon /></div><div><p>{eyebrow}</p><h2>{title}</h2></div></header>{children}</section>;
}
