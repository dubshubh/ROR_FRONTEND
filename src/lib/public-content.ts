import { getPublicContent } from "@/services/content.service";
import type { PublicContent } from "@/types/content";

const emptyContent: PublicContent = { events: [], rides: [], intercity: [], photos: [], brands: [] };

export async function loadPublicContent() {
  try { return { ...emptyContent, ...(await getPublicContent()) }; }
  catch { return emptyContent; }
}
