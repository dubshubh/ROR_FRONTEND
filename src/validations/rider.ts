import { z } from "zod";

const maxFileSize = 5 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
const booleanFromForm = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());
const optionalString = z.preprocess((value) => (value === "" ? undefined : value), z.string().optional());
const fileSchema = z
  .any()
  .refine((files) => files?.length === 1, "File is required")
  .refine((files) => files?.[0]?.size <= maxFileSize, "Maximum file size is 5MB")
  .refine((files) => allowedTypes.includes(files?.[0]?.type), "Only jpg, jpeg, png, and pdf are allowed");
const optionalFileSchema = z
  .any()
  .refine((files) => !files?.length || files[0]?.size <= maxFileSize, "Maximum file size is 5MB")
  .refine((files) => !files?.length || allowedTypes.includes(files[0]?.type), "Only jpg, jpeg, png, and pdf are allowed");

function isAtLeast18(value: string) {
  const dob = new Date(value);
  const today = new Date();
  const minDob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return dob <= minDob;
}

export const riderRegistrationSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid Indian phone number"),
  dob: z.string().min(1, "Date of birth is required").refine(isAtLeast18, "Rider must be at least 18 years old"),
  gender: z.string().min(1, "Gender is required"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  emergencyContact: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid Indian phone number"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  bikeModel: z.string().min(1, "Bike model is required"),
  bikeNumber: z.string().min(1, "Bike number is required"),
  ridingExperience: z.coerce.number().min(0, "Experience cannot be negative"),
  dlNumber: optionalString,
  aadhaarNumber: z.string().regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
  joinedOtherGroupBefore: booleanFromForm,
  previousGroupLeaveReason: z.string().optional().default(""),
  joinReason: z.string().optional().default(""),
  dlFront: optionalFileSchema,
  dlBack: optionalFileSchema,
  aadhaarFront: fileSchema,
  aadhaarBack: fileSchema,
  terms: z.boolean().refine(Boolean, "Accept the terms and conditions")
}).superRefine((values, ctx) => {
  if (values.joinedOtherGroupBefore && !values.previousGroupLeaveReason.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["previousGroupLeaveReason"],
      message: "Reason to leave previous group is required"
    });
  }
});

export type RiderRegistrationInput = z.infer<typeof riderRegistrationSchema>;
