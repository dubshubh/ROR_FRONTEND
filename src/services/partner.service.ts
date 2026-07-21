import { api } from "./api";

export type PartnerEnquiryInput = {
  brandName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  category: string;
  message: string;
};

export async function submitPartnerEnquiry(input: PartnerEnquiryInput) {
  const { data } = await api.post("/partner-enquiries", input);
  return data.data;
}

export type PartnerEnquiryStatus = "new" | "reviewed";
export type PartnerEnquiry = PartnerEnquiryInput & {
  _id: string;
  status: PartnerEnquiryStatus;
  createdAt: string;
  updatedAt: string;
};

export async function getPartnerEnquiries(params: { page: number; limit: number; status?: PartnerEnquiryStatus; search?: string }) {
  const { data } = await api.get("/admin/partner-enquiries", { params });
  return data.data as { enquiries: PartnerEnquiry[]; meta: { page: number; limit: number; total: number; totalPages: number } };
}

export async function updatePartnerEnquiryStatus(id: string, status: PartnerEnquiryStatus) {
  const { data } = await api.patch(`/admin/partner-enquiries/${id}`, { status });
  return data.data as PartnerEnquiry;
}

export async function deletePartnerEnquiry(id: string) {
  await api.delete(`/admin/partner-enquiries/${id}`);
}
