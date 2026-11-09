export type DietType = 'VEG' | 'NON_VEG' | 'EGG';
export type GalleryCategory = 'INTERIOR' | 'FOOD' | 'AMBIENCE' | 'EVENTS' | 'BRANCHES';
export type EnquiryStatus = 'NEW' | 'CONTACTED' | 'CONFIRMED' | 'CLOSED' | 'CANCELLED';
export type AdminRole = 'OWNER' | 'ADMIN' | 'EDITOR';

export interface Settings {
  brandName: string;
  brandNameLocal: string;
  tagline: string;
  logoUrl: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtext: string;
  heroImageUrl: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  bookCtaText: string;
  aboutHeading: string;
  aboutText: string;
  aboutImageUrl: string;
  aboutHighlights: string[];
  experienceHeading: string;
  experienceItems: { title: string; text: string }[];
  phone: string;
  email: string;
  whatsapp: string;
  generalHours: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  footerText: string;
  reservationEnquiriesEnabled: boolean;
  reservationNote: string;
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
}

export interface BranchSummary {
  id: string;
  slug: string;
  name: string;
  area: string;
  city: string;
  address: string | null;
  pincode: string | null;
  phone: string | null;
  whatsapp: string | null;
  openingHours: string | null;
  mapUrl: string | null;
  imageUrl: string | null;
  services: string[];
  isMain: boolean;
  isVegOnly: boolean;
  isVerified: boolean;
  latitude: number | null;
  longitude: number | null;
}

export interface Branch extends BranchSummary {
  email: string | null;
  mapEmbedUrl: string | null;
  intro: string | null;
  menuNote: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  galleryImages?: GalleryImage[];
  reservationCount?: number;
  galleryCount?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  priceNote: string | null;
  imageUrl: string | null;
  dietType: DietType;
  isAvailable: boolean;
  isFeatured: boolean;
  isSpecial: boolean;
  sortOrder: number;
  categoryId: string;
  category?: { id: string; name: string };
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  items?: MenuItem[];
  itemCount?: number;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  caption: string | null;
  altText: string | null;
  category: GalleryCategory;
  branchId: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  branch?: { id?: string; name: string; slug?: string } | null;
}

export interface Founder {
  id: number;
  name: string;
  nameLocal: string | null;
  designation: string;
  photoUrl: string | null;
  heading: string;
  message: string;
  signatureUrl: string | null;
  isPublished: boolean;
  isApproved: boolean;
  updatedAt: string;
}

export interface SiteData {
  settings: Settings;
  founder: Founder | null;
  branches: BranchSummary[];
}

export interface ReservationEnquiry {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  branchId: string | null;
  branch: { id: string; name: string } | null;
  date: string;
  time: string;
  guests: number;
  specialRequest: string | null;
  status: EnquiryStatus;
  internalNotes: string | null;
  createdAt: string;
}

export interface ContactEnquiry {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  subject: string;
  message: string;
  branchId: string | null;
  branch: { id: string; name: string } | null;
  status: EnquiryStatus;
  internalNotes: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface ActivityEntry {
  id: string;
  action: string;
  entity: string;
  summary: string;
  createdAt: string;
  admin: { name: string } | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const GALLERY_LABELS: Record<GalleryCategory, string> = {
  INTERIOR: 'Restaurant Interior',
  FOOD: 'Food & Dishes',
  AMBIENCE: 'Ambience',
  EVENTS: 'Events',
  BRANCHES: 'Branches',
};
