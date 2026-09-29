import overallImg from "@/assets/product-overall.jpg";
import sprayImg from "@/assets/product-spray.jpg";
import flagImg from "@/assets/product-flag.svg";

// Categories are now open — stored as plain strings in DB.
// These are the built-in starting categories shown in the UI.
export type Category = string;
export const DEFAULT_CATEGORIES: Category[] = ["Overaller", "Sprayflaskor", "Flaggor"];

// Legacy alias — used by shop filter etc.
export const CATEGORIES = DEFAULT_CATEGORIES;

export type ImageKey = "overall" | "spray" | "flag";

export const IMAGE_KEYS: { key: ImageKey; label: string }[] = [
  { key: "overall", label: "Overall" },
  { key: "spray", label: "Sprayflaska" },
  { key: "flag", label: "Flagga" },
];

const IMAGES: Record<ImageKey, string> = {
  overall: overallImg,
  spray: sprayImg,
  flag: flagImg,
};

export const imageFor = (key: string): string =>
  IMAGES[(key as ImageKey)] ?? overallImg;

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  stock: number;
  active: boolean;
  imageKey: ImageKey;
  image: string;
  images: string[];
  imageRecords?: { id: string; url: string }[];
  description: string;
  badge?: string | null;
  sold: number;
};

export type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
  image_key: string;
  description: string;
  badge: string | null;
  sold: number;
};

export function toProduct(row: ProductRow, imageRecords: { id: string; url: string }[] = []): Product {
  const imageKey = (["overall", "spray", "flag"].includes(row.image_key) ? row.image_key : "overall") as ImageKey;
  const images = imageRecords.map((r) => r.url);
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    stock: row.stock,
    active: row.active,
    imageKey,
    image: images[0] ?? imageFor(imageKey),
    images,
    imageRecords,
    description: row.description,
    badge: row.badge,
    sold: row.sold,
  };
}

export const formatSEK = (n: number) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(n);
