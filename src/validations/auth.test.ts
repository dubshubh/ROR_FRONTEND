import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema
} from "./auth";

describe("Frontend Auth Schemas", () => {
  describe("loginSchema", () => {
    it("validates valid admin login input", () => {
      expect(loginSchema.safeParse({ email: "rebelsonroads@gmail.com", password: "Password123" }).success).toBe(true);
    });

    it("rejects invalid email or short password", () => {
      expect(loginSchema.safeParse({ email: "invalid", password: "short" }).success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("validates legitimate admin email", () => {
      expect(forgotPasswordSchema.safeParse({ email: "rebelsonroads@gmail.com" }).success).toBe(true);
    });

    it("rejects malformed email", () => {
      expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("accepts valid token and matching strong password", () => {
      const res = resetPasswordSchema.safeParse({
        token: "tok_1234567890",
        password: "StrongPassword1",
        confirmPassword: "StrongPassword1"
      });
      expect(res.success).toBe(true);
    });

    it("rejects mismatched confirm password", () => {
      const res = resetPasswordSchema.safeParse({
        token: "tok_1234567890",
        password: "StrongPassword1",
        confirmPassword: "DifferentPassword2"
      });
      expect(res.success).toBe(false);
    });

    it("rejects password missing digits or uppercase", () => {
      const res = resetPasswordSchema.safeParse({
        token: "tok_1234567890",
        password: "lowercaseonly",
        confirmPassword: "lowercaseonly"
      });
      expect(res.success).toBe(false);
    });
  });

  describe("changePasswordSchema", () => {
    it("validates current and matching new strong passwords", () => {
      const res = changePasswordSchema.safeParse({
        currentPassword: "OldPassword123",
        newPassword: "NewSecretPassword999",
        confirmPassword: "NewSecretPassword999"
      });
      expect(res.success).toBe(true);
    });

    it("rejects mismatched new passwords", () => {
      const res = changePasswordSchema.safeParse({
        currentPassword: "OldPassword123",
        newPassword: "NewSecretPassword999",
        confirmPassword: "MismatchPassword888"
      });
      expect(res.success).toBe(false);
    });
  });
});

