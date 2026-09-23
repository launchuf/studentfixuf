import overallImg from "@/assets/product-overall.jpg";
import sprayImg from "@/assets/product-spray.jpg";
import stencilImg from "@/assets/product-stencil.jpg";
import bandImg from "@/assets/product-band.jpg";

export type Category = "Overaller" | "Sprayflaskor" | "Mallar" | "Studentband";

export const CATEGORIES: Category[] = ["Overaller", "Sprayflaskor", "Mallar", "Studentband"];

export type ImageKey = "overall" | "spray" | "stencil" | "band";

export const IMAGE_KEYS: { key: ImageKey; label: string }[] = [
  { key: "overall", label: "Overall" },
  { key: "spray", label: "Sprayflaska" },
  { key: "stencil", label: "Mall" },
  { key: "band", label: "Studentband" },
];

const IMAGES: Record<ImageKey, string> = {
  overall: overallImg,
  spray: sprayImg,
  stencil: stencilImg,
  band: bandImg,
};

export const imageFor = (key: string): string => IMAGES[(key as ImageKey) ?? "overall"] ?? overallImg;

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  stock: number;
  active: boolean;
  imageKey: ImageKey;
  image: string;
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

export function toProduct(row: ProductRow): Product {
  const imageKey = (["overall", "spray", "stencil", "band"].includes(row.image_key) ? row.image_key : "overall") as ImageKey;
  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    price: row.price,
    stock: row.stock,
    active: row.active,
    imageKey,
    image: imageFor(imageKey),
    description: row.description,
    badge: row.badge,
    sold: row.sold,
  };
}

export const formatSEK = (n: number) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(n);
