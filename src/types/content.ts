export type ContentKind = "ride" | "photo" | "brand";

export type ContentItem = {
  _id: string;
  kind: ContentKind;
  title: string;
  description: string;
  date?: string;
  status: "upcoming" | "completed";
  location: string;
  category: string;
  image?: { publicId: string; url: string };
  sortOrder: number;
};

export type PublicContent = {
  rides: ContentItem[];
  photos: ContentItem[];
  brands: ContentItem[];
};
