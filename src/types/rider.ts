export type RiderStatus = "pending" | "approved" | "rejected";

export type RiderFile = {
  available: boolean;
  kind: "image" | "pdf";
};

export type Rider = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  emergencyContact: string;
  city: string;
  state: string;
  bikeModel: string;
  bikeNumber: string;
  ridingExperience: number;
  dlNumber?: string;
  aadhaarNumber: string;
  joinedOtherGroupBefore: boolean;
  previousGroupLeaveReason: string;
  joinReason: string;
  dlFront: RiderFile | null;
  dlBack: RiderFile | null;
  aadhaarFront: RiderFile;
  aadhaarBack: RiderFile;
  status: RiderStatus;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedRiders = {
  riders: Rider[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type DashboardStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};
