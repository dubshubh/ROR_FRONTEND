"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { FileUp, Send } from "lucide-react";
import { FieldError, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/form/form-field";
import { PublicHeader } from "@/components/layout/public-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/services/api";
import { registerRider } from "@/services/rider.service";
import { RiderRegistrationInput, riderRegistrationSchema } from "@/validations/rider";

const genders = ["Male", "Female", "Other"];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function JoinGroupPage() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<RiderRegistrationInput>({
    resolver: zodResolver(riderRegistrationSchema),
    defaultValues: { joinedOtherGroupBefore: false, previousGroupLeaveReason: "", terms: false }
  });
  const joinedOtherGroupBefore = watch("joinedOtherGroupBefore");

  const mutation = useMutation({
    mutationFn: registerRider,
    onSuccess: () => {
      toast.success("Registration submitted");
      reset();
    },
    onError: (error) => toast.error(apiErrorMessage(error))
  });

  function onSubmit(values: RiderRegistrationInput) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value instanceof FileList) {
        if (value.length > 0) formData.append(key, value[0]);
        return;
      }
      if (value === undefined || value === null || value === "") return;
      formData.append(key, String(value));
    });
    mutation.mutate(formData);
  }

  const fileError = (name: keyof RiderRegistrationInput) => errors[name] as FieldError | undefined;

  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />
      <section className="motion-page border-b-2 border-red-600 bg-[#0a0a0a]">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="font-display text-4xl text-[#d91b1b] sm:text-6xl">Rider Registration</h1>
          <p className="mt-3 max-w-2xl text-sm text-[#e8d9c9]">Fuel your passion. Join the elite brotherhood of Rebels On Roads. Complete the form below to begin your journey.</p>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="motion-stagger mx-auto grid max-w-6xl gap-5 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <FormField label="Full Name" error={errors.fullName}>
              <Input {...register("fullName")} />
            </FormField>
            <FormField label="Email" error={errors.email}>
              <Input type="email" {...register("email")} />
            </FormField>
            <FormField label="Phone Number" error={errors.phone}>
              <Input {...register("phone")} maxLength={10} />
            </FormField>
            <FormField label="Date Of Birth" error={errors.dob}>
              <Input type="date" {...register("dob")} />
            </FormField>
            <FormField label="Gender" error={errors.gender}>
              <Select {...register("gender")}>
                <option value="">Select gender</option>
                {genders.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </FormField>
            <FormField label="Blood Group" error={errors.bloodGroup}>
              <Select {...register("bloodGroup")}>
                <option value="">Select group</option>
                {bloodGroups.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </FormField>
            <FormField label="Emergency Contact" error={errors.emergencyContact}>
              <Input {...register("emergencyContact")} maxLength={10} />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Address</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <FormField label="City" error={errors.city}>
              <Input {...register("city")} />
            </FormField>
            <FormField label="State" error={errors.state}>
              <Input {...register("state")} />
            </FormField>
            <FormField label="Bike Model" error={errors.bikeModel}>
              <Input {...register("bikeModel")} />
            </FormField>
            <FormField label="Bike Number" error={errors.bikeNumber}>
              <Input {...register("bikeNumber")} />
            </FormField>
            <FormField label="Riding Experience (Years)" error={errors.ridingExperience}>
              <Input type="number" min={0} {...register("ridingExperience")} />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Identity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField label="Driving License Number (Optional)" error={errors.dlNumber}>
              <Input {...register("dlNumber")} />
            </FormField>
            <FormField label="Aadhaar Number" error={errors.aadhaarNumber}>
              <Input {...register("aadhaarNumber")} maxLength={12} />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Group History</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField label="Have you joined any other riding group before?" error={errors.joinedOtherGroupBefore}>
              <Select {...register("joinedOtherGroupBefore", { setValueAs: (value) => value === "true" })}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </FormField>
            {joinedOtherGroupBefore ? (
              <FormField label="Reason to leave that group" error={errors.previousGroupLeaveReason}>
                <Textarea
                  placeholder="Explain why you left or want to leave the previous riding group."
                  {...register("previousGroupLeaveReason")}
                />
              </FormField>
            ) : null}
            <FormField label="Why do you want to join this group? (Optional)" error={errors.joinReason}>
              <Textarea
                placeholder="Share your riding goals, expectations, and what you want from this group."
                {...register("joinReason")}
              />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Document Uploads</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {[
              ["Driving License Front Image (Optional)", "dlFront"],
              ["Driving License Back Image (Optional)", "dlBack"],
              ["Aadhaar Front Image", "aadhaarFront"],
              ["Aadhaar Back Image", "aadhaarBack"]
            ].map(([label, name]) => (
              <FormField key={name} label={label} error={fileError(name as keyof RiderRegistrationInput)}>
                <div className="flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-muted-foreground" />
                  <Input type="file" accept=".jpg,.jpeg,.png,.pdf" {...register(name as keyof RiderRegistrationInput)} />
                </div>
              </FormField>
            ))}
          </CardContent>
        </Card>

        <div className="rebel-frame rebel-hover flex flex-col gap-4 border-l-8 border-l-[#ffb3b1] bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-start gap-3 text-sm font-bold italic">
            <input type="checkbox" className="mt-1 h-4 w-4" {...register("terms")} />
            <span>I accept the terms and conditions for group verification and document review.</span>
          </label>
          {errors.terms ? <span className="text-xs text-destructive">{errors.terms.message}</span> : null}
          <Button type="submit" disabled={mutation.isPending}>
            <Send className="h-4 w-4" />
            {mutation.isPending ? "Submitting" : "Submit Registration"}
          </Button>
        </div>
        <div className="motion-rise py-10 font-display text-6xl leading-none text-white/5 sm:text-8xl">
          Respect<br />& Ride
        </div>
      </form>
      <SiteFooter />
    </main>
  );
}
