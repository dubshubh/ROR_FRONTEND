export type ContentKind = "event" | "ride" | "brand" | "photo" | "intercity";

export type ContentItem = {
  _id: string;
  kind: ContentKind;
  title: string;
  description: string;
  date?: string;
  endDate?: string;
  status: "upcoming" | "completed";
  location: string;
  startLocation: string;
  destination: string;
  category: string;
  videoUrl: string;
  image?: { publicId: string; url: string };
  images: { publicId: string; url: string }[];
  videos: { publicId: string; url: string }[];
  sortOrder: number;
};

export type PublicContent = {
  events: ContentItem[];
  rides: ContentItem[];
  intercity: ContentItem[];
  photos: ContentItem[];
  brands: ContentItem[];
};
