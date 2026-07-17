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
