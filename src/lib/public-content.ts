import { unstable_noStore as noStore } from "next/cache";
import { getPublicContent } from "@/services/content.service";
import type { PublicContent } from "@/types/content";

const emptyContent: PublicContent = { events: [], rides: [], intercity: [], photos: [], brands: [] };

export async function loadPublicContent() {
  // Content is managed at runtime from the admin panel. Opt every page using
  // this loader out of static generation so a deployment-time API response is
  // never served indefinitely after an admin creates or updates an item.
  noStore();
  try { return { ...emptyContent, ...(await getPublicContent()) }; }
  catch { return emptyContent; }
}
