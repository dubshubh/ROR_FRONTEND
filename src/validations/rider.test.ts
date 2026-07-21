import { describe, expect, it } from "vitest";
import { riderRegistrationSchema } from "./rider";

const validFiles = {
  aadhaarFront: [new File(["front"], "front.png", { type: "image/png" })],
  aadhaarBack: [new File(["back"], "back.png", { type: "image/png" })]
};

const validRider = {
  fullName: "Test Rider", email: "rider@example.com", phone: "9876543210", dob: "1990-01-01",
  gender: "Male", bloodGroup: "O+", emergencyContact: "9876543211", city: "Dehradun", state: "Uttarakhand",
  bikeModel: "Test Bike", bikeNumber: "UK07AB1234", ridingExperience: "5", dlNumber: "", aadhaarNumber: "123456789012",
  joinedOtherGroupBefore: false, previousGroupLeaveReason: "", joinReason: "", terms: true, ...validFiles
};

describe("riderRegistrationSchema", () => {
  it("accepts a valid adult rider with required documents", () => {
    expect(riderRegistrationSchema.safeParse(validRider).success).toBe(true);
  });

  it("requires previous-group details conditionally", () => {
    const result = riderRegistrationSchema.safeParse({ ...validRider, joinedOtherGroupBefore: true });
    expect(result.success).toBe(false);
  });
});
