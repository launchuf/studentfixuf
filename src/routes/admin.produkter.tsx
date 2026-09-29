import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, EyeOff, Eye, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useAdminStore } from "@/lib/admin-store";
import { DEFAULT_CATEGORIES, formatSEK, type Product } from "@/lib/products";
import { ActiveBadge } from "@/components/admin/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import placeholderImg from "@/assets/product-overall.jpg";

export const Route = createFileRoute("/admin/produkter")({ component: ProductsPage });

type Draft = Omit<Product, "id" | "sold">;
const empty: Draft = { name: "", category: "Overaller", price: 0, stock: 0, active: true, imageKey: "overall", image: placeholderImg, images: [], description: "" };

function ProductsPage() {
  const { products, addProduct, updateProduct, saveProductImages, removeProducts } = useAdminStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("alla");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  // Derive all categories dynamically from existing products + defaults
  const allCats = useMemo(() => {
    const fromProducts = products.map((p) => p.category);
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...fromProducts])).sort();
  }, [products]);

  const list = useMemo(
    () => products.filter((p) => (cat === "alla" || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase())),
    [products, q, cat],
  );
  const allChecked = list.length > 0 && list.every((p) => selected.includes(p.id));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Produkter</h1>
          <p className="text-muted-foreground">{products.length} produkter i katalogen</p>
        </div>
        <button onClick={() => setEditing("new")} className="flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 font-semibold text-primary-foreground transition-transform hover:scale-[1.02]">
          <Plus className="h-4 w-4" /> Lägg till produkt
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sök produkt…" className="h-9 w-64 rounded-lg border-border bg-card pl-9" />
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
          {(["alla", ...allCats]).map((c) => (
            <button key={c} onClick={() => setCat(c)} className={cn("rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors", cat === c ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {c}
            </button>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-violet/40 bg-violet/10 px-3 py-1.5 text-xs animate-rise">
            <span className="font-semibold">{selected.length} valda</span>
            <button className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-secondary" onClick={() => { selected.forEach((id) => updateProduct(id, { active: false })); toast.success("Produkter dolda"); setSelected([]); }}>
              <EyeOff className="h-3.5 w-3.5" /> Dölj
            </button>
            <button className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-secondary" onClick={() => { selected.forEach((id) => updateProduct(id, { active: true })); setSelected([]); }}>
              <Eye className="h-3.5 w-3.5" /> Visa
            </button>
            <button className="flex items-center gap-1 rounded-md px-2 py-1 text-destructive hover:bg-destructive/10" onClick={() => { removeProducts(selected); toast.success(`${selected.length} produkter borttagna`); setSelected([]); }}>
              <Trash2 className="h-3.5 w-3.5" /> Ta bort
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-surface hover:bg-surface">
              <TableHead className="w-10"><Checkbox checked={allChecked} onCheckedChange={(v) => setSelected(v ? list.map((p) => p.id) : [])} /></TableHead>
              <TableHead>Produkt</TableHead><TableHead>Kategori</TableHead><TableHead>Pris</TableHead><TableHead>Lager</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Åtgärder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((p) => (
              <TableRow key={p.id} className={cn("border-border", selected.includes(p.id) && "bg-violet/5")}>
                <TableCell><Checkbox checked={selected.includes(p.id)} onCheckedChange={(v) => setSelected((s) => (v ? [...s, p.id] : s.filter((x) => x !== p.id)))} /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt="" width={40} height={40} loading="lazy" className="h-10 w-10 rounded-md object-cover" />
                    <div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.sold} sålda</p></div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.category}</TableCell>
                <TableCell className="font-semibold">{formatSEK(p.price)}</TableCell>
                <TableCell>
                  <span className={cn("font-semibold", p.stock === 0 ? "text-destructive" : p.stock <= 8 ? "text-warning" : "")}>{p.stock}</span>
                  {p.stock <= 8 && p.stock > 0 && <span className="ml-2 text-[10px] uppercase tracking-wider text-warning">Lågt</span>}
                </TableCell>
                <TableCell><ActiveBadge active={p.active} /></TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => updateProduct(p.id, { active: !p.active })} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Växla synlighet">
                      {p.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setEditing(p)} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Redigera"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => { removeProducts([p.id]); toast.success("Produkt borttagen"); }} className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Ta bort"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {list.length === 0 && (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Inga produkter matchar.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ProductDialog
        key={editing === "new" ? "new" : editing?.id ?? "closed"}
        open={editing !== null}
        initial={editing && editing !== "new" ? editing : null}
        existingCategories={allCats}
        onClose={() => setEditing(null)}
        onSave={async (d, newFiles, removedImageIds) => {
          try {
            if (editing && editing !== "new") {
              updateProduct(editing.id, d);
              await saveProductImages(editing.id, newFiles, removedImageIds);
              toast.success("Produkt uppdaterad");
            } else {
              await addProduct(d, newFiles);
              toast.success("Produkt tillagd");
            }
            setEditing(null);
          } catch { /* toast shown in store */ }
        }}
      />
    </div>
  );
}

function ProductDialog({ open, initial, existingCategories, onClose, onSave }: {
  open: boolean;
  initial: Product | null;
  existingCategories: string[];
  onClose: () => void;
  onSave: (d: Draft, newFiles: File[], removedImageIds: string[]) => void | Promise<void>;
}) {
  const [d, setD] = useState<Draft>(initial ? { ...initial } : empty);
  const [showCustom, setShowCustom] = useState(false);
  const [customCat, setCustomCat] = useState("");
  const [existingImages, setExistingImages] = useState(initial?.imageRecords ?? []);
  const [newFiles, setNewFiles] = useState<{ file: File; preview: string }[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const allPreviews = [...existingImages.map((r) => r.url), ...newFiles.map((f) => f.preview)];

  const handleCategoryChange = (val: string) => {
    if (val === "__custom__") {
      setShowCustom(true);
      setCustomCat("");
      return;
    }
    setShowCustom(false);
    setCustomCat("");
    set("category", val);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{initial ? "Redigera produkt" : "Ny produkt"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!d.name) return;
            const finalCat = (showCustom && customCat.trim()) ? customCat.trim() : d.category;
            setSaving(true);
            await onSave({ ...d, category: finalCat }, newFiles.map((f) => f.file), removedImageIds);
            setSaving(false);
          }}
          className="space-y-4"
        >
          {/* Image upload */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Bilder</p>
            <div className="flex flex-wrap gap-2">
              {allPreviews.map((src, i) => (
                <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                  <img src={src} alt="" width={160} height={160} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => {
                    if (i < existingImages.length) {
                      setRemovedImageIds((ids) => [...ids, existingImages[i]!.id]);
                      setExistingImages((imgs) => imgs.filter((_, idx) => idx !== i));
                    } else {
                      const j = i - existingImages.length;
                      setNewFiles((fs) => fs.filter((_, idx) => idx !== j));
                    }
                  }} className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100" aria-label="Ta bort bild">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-surface text-muted-foreground hover:border-violet hover:text-foreground">
                <Upload className="h-4 w-4" />
                <span className="text-[10px]">Lägg till</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setNewFiles((fs) => [...fs, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
                  e.target.value = "";
                }} />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Första bilden visas som huvudbild i shopen.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Namn</Label>
            <Input value={d.name} onChange={(e) => set("name", e.target.value)} required className="border-border bg-surface" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-1">
              <Label>Kategori</Label>
              <Select value={showCustom ? "__custom__" : d.category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="border-border bg-surface"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {existingCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  <SelectItem value="__custom__">+ Ny kategori…</SelectItem>
                </SelectContent>
              </Select>
              {showCustom && (
                <Input
                  autoFocus
                  placeholder="Skriv kategorinamn…"
                  value={customCat}
                  onChange={(e) => setCustomCat(e.target.value)}
                  className="mt-1 border-border bg-surface text-sm"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Pris (kr)</Label>
              <Input type="number" min={0} value={d.price} onChange={(e) => set("price", Number(e.target.value))} className="border-border bg-surface" />
            </div>
            <div className="space-y-1.5">
              <Label>Lager</Label>
              <Input type="number" min={0} value={d.stock} onChange={(e) => set("stock", Number(e.target.value))} className="border-border bg-surface" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Beskrivning</Label>
            <Textarea rows={3} value={d.description} onChange={(e) => set("description", e.target.value)} className="border-border bg-surface" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
            <div><p className="font-medium">Aktiv i butiken</p><p className="text-xs text-muted-foreground">Dolda produkter syns inte för kunder</p></div>
            <Switch checked={d.active} onCheckedChange={(v) => set("active", v)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-secondary">Avbryt</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-brand-gradient px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60">
              {saving ? "Sparar…" : "Spara"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
