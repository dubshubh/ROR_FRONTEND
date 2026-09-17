"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Check, Eye, EyeOff, KeyRound, Lock, ShieldAlert, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/services/api";
import { changePasswordAdmin } from "@/services/auth.service";
import { ChangePasswordInput, changePasswordSchema } from "@/validations/auth";

type ChangePasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const newPasswordValue = watch("newPassword") || "";
  const confirmPasswordValue = watch("confirmPassword") || "";

  const hasMinLength = newPasswordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPasswordValue);
  const hasNumber = /[0-9]/.test(newPasswordValue);
  const hasMatch = newPasswordValue.length > 0 && newPasswordValue === confirmPasswordValue;

  const mutation = useMutation({
    mutationFn: (values: ChangePasswordInput) =>
      changePasswordAdmin({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      }),
    onSuccess: () => {
      toast.success("Administrator password updated successfully!");
      reset();
      onOpenChange(false);
    },
    onError: (error) => toast.error(apiErrorMessage(error))
  });

  if (!open) return null;

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <Card className="w-full max-w-lg p-5 sm:p-6 bg-[#141010] border-[#552e2e] shadow-2xl rebel-frame rounded-2xl relative z-[10000] max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3e2424] pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-red-500/10 text-[#ffb3b1] border border-red-500/30 font-bold flex items-center gap-1 shrink-0">
              <KeyRound className="h-3 w-3 text-[#ff535b]" /> Command Security
            </span>
            <h3 className="font-display text-xl text-white">Change Admin Cipher</h3>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="text-muted-foreground hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto pr-0.5 space-y-4">
          <div className="p-3 bg-[#1d1314] border border-[#442828] rounded-xl flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-[#ff535b] shrink-0 mt-0.5" />
            <p className="font-mono text-[11px] text-[#cfbeb6] leading-relaxed">
              Updating your credentials will archive your current cipher in the audit history. Previously used passwords cannot be reused.
            </p>
          </div>

          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4 font-mono text-xs"
          >
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-[#ffdad8] block">
                Current Access Cipher:
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#ab8987]" />
                <Input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current password"
                  className="h-11 pl-10 pr-10 text-xs bg-[#110d0d] border-[#442828] text-white"
                  {...register("currentPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-3 text-[#ab8987] hover:text-white cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <span className="text-[11px] text-destructive block">
                  {errors.currentPassword.message}
                </span>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-[#ffdad8] block">
                New Access Cipher:
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#ab8987]" />
                <Input
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new password (min 8 chars)"
                  className="h-11 pl-10 pr-10 text-xs bg-[#110d0d] border-[#442828] text-white"
                  {...register("newPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-3 text-[#ab8987] hover:text-white cursor-pointer"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <span className="text-[11px] text-destructive block">
                  {errors.newPassword.message}
                </span>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-[#ffdad8] block">
                Confirm New Cipher:
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#ab8987]" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter new password"
                  className="h-11 pl-10 pr-10 text-xs bg-[#110d0d] border-[#442828] text-white"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 text-[#ab8987] hover:text-white cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="text-[11px] text-destructive block">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>

            {/* Criteria Checklist */}
            <div className="p-3 bg-[#130e0e] border border-[#3e2424] rounded-xl space-y-1.5 text-[11px]">
              <span className="text-[10px] text-muted-foreground uppercase block font-bold mb-1">
                Password Rules:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-400" : "text-[#7a6662]"}`}>
                  {hasMinLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-emerald-400" : "text-[#7a6662]"}`}>
                  {hasUppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>1 uppercase</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-400" : "text-[#7a6662]"}`}>
                  {hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>1 number</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasMatch ? "text-emerald-400" : "text-[#7a6662]"}`}>
                  {hasMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>Match</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-10 px-4 border-[#552e2e] text-[#ffdad8] hover:bg-[#251818] cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="h-10 px-5 bg-[#ff535b] hover:bg-[#ff3b44] text-white font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_12px_rgba(255,83,91,0.25)]"
              >
                <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                {mutation.isPending ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

