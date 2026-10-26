"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Sparkles, Tag, Plus } from "lucide-react";
import HotspotEditor from "@/components/HotspotEditor";
import ImageUploader from "@/components/ImageUploader";
import { OutfitItem } from "@/components/OutfitCard";
import { createClient } from "@/lib/supabase/client";
import { Category, getStoredCategories, syncCategoriesToLocal } from "@/lib/categories";

export default function NewOutfitPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const [items, setItems] = useState<OutfitItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        const json = await res.json();
        if (json.success && Array.isArray(json.categories) && json.categories.length > 0) {
          setAvailableCategories(json.categories);
          syncCategoriesToLocal(json.categories);
          return;
        }
      } catch {
        // ignore
      }
      setAvailableCategories(getStoredCategories());
    }
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) {
      alert("Judul dan Foto Outfit wajib diisi!");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      // Insert outfit
      const { data: outfitData, error: outfitError } = await supabase
        .from("outfits")
        .insert({
          title,
          description,
          image_url: imageUrl,
          tags: tagList,
        })
        .select()
        .single();

      if (outfitError) throw outfitError;

      // Insert outfit items
      if (items.length > 0 && outfitData) {
        const itemsToInsert = items.map((it) => ({
          outfit_id: outfitData.id,
          name: it.name,
          brand: it.brand || null,
          price: (() => {
            if (it.price === undefined || it.price === null) return null;
            if (typeof it.price === "number") return isNaN(it.price) ? null : Math.round(it.price);
            const digits = String(it.price).replace(/[^\d]/g, "");
            return digits ? parseInt(digits, 10) : null;
          })(),
          affiliate_url: it.affiliate_url,
          x:
            it.x !== undefined && it.x !== null && !isNaN(Number(it.x))
              ? Math.round(Number(it.x))
              : null,
          y:
            it.y !== undefined && it.y !== null && !isNaN(Number(it.y))
              ? Math.round(Number(it.y))
              : null,
        }));

        const { error: itemsError } = await supabase
          .from("outfit_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      setMessage("Berhasil menyimpan outfit!");
      setTimeout(() => {
        router.push("/admin");
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setMessage(`Gagal menyimpan: ${err.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container max-w-5xl py-8 px-4 sm:px-6 space-y-6">
      <Link
        href="/admin"
        className="cartoon-btn inline-flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2 text-xs font-black text-foreground border border-border"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Admin
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-secondary shadow-cartoon-sm">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-nunito tracking-tighter text-foreground">
            Upload Outfit Baru
          </h1>
          <p className="text-xs sm:text-sm font-bold text-foreground/70">
            Tambahkan inspirasi gaya OOTD lengkap dengan tautan affiliasi produk
          </p>
        </div>
      </div>

      {message && (
        <div className="cartoon-card border border-border bg-secondary p-4 text-xs sm:text-sm font-black text-foreground">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="cartoon-card bg-white/60 backdrop-blur-2xl p-6 sm:p-8 space-y-5 border-white/40">
          <div className="border-b border-border pb-3">
            <h2 className="font-black font-nunito text-lg tracking-tighter text-foreground">Informasi Outfit</h2>
            <p className="text-xs font-bold text-foreground/70">Detail deskripsi dan gambar utama kurasi</p>
          </div>
          <div>
            <label className="block text-xs font-black text-foreground mb-1.5">Judul Outfit</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="mis. Gaya Kasual Musim Panas Minimalis"
              className="w-full rounded-2xl border border-border bg-white/60 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-foreground mb-1.5">Deskripsi</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat gaya pakaian atau inspirasi..."
              className="w-full rounded-2xl border border-border bg-white/60 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <ImageUploader
                value={imageUrl}
                onChange={setImageUrl}
                label="Foto Outfit"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black text-foreground">Tags (pisahkan koma)</label>
                <Link
                  href="/admin/categories"
                  target="_blank"
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Kelola Kategori &rarr;
                </Link>
              </div>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="musim panas, kasual, warna bumi"
                className="w-full rounded-2xl border border-border bg-white/60 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {/* Gender Quick Tags */}
              <div className="mt-2.5 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
                  Target Gender (Cepat):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "👨 Pria", tag: "pria" },
                    { label: "👩 Wanita", tag: "wanita" },
                    { label: "👦 Anak Pria", tag: "anak pria" },
                    { label: "👧 Anak Wanita", tag: "anak wanita" },
                    { label: "👶 Anak-Anak", tag: "anak-anak" },
                  ].map((g) => {
                    const currentTagsArray = tags
                      .split(",")
                      .map((t) => t.trim().toLowerCase())
                      .filter(Boolean);
                    const isSelected = currentTagsArray.includes(g.tag.toLowerCase());

                    return (
                      <button
                        key={g.tag}
                        type="button"
                        onClick={() => {
                          const list = tags
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean);
                          if (isSelected) {
                            setTags(list.filter((t) => t.toLowerCase() !== g.tag.toLowerCase()).join(", "));
                          } else {
                            setTags([...list, g.tag].join(", "));
                          }
                        }}
                        className={`text-[11px] font-black px-2.5 py-1 rounded-xl border transition-all ${
                          isSelected
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-white/80 text-foreground border-border hover:bg-secondary"
                        }`}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Quick Tags */}
              {availableCategories.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50">
                    Pilih Kategori Gaya:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {availableCategories
                      .filter((c) => c.slug !== "all")
                      .map((cat) => {
                        const currentTagsArray = tags
                          .split(",")
                          .map((t) => t.trim().toLowerCase())
                          .filter(Boolean);
                        const isSelected =
                          currentTagsArray.includes(cat.name.toLowerCase()) ||
                          currentTagsArray.includes(cat.slug.toLowerCase());

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              const list = tags
                                .split(",")
                                .map((t) => t.trim())
                                .filter(Boolean);
                              if (isSelected) {
                                // Hapus tag
                                const next = list.filter(
                                  (t) =>
                                    t.toLowerCase() !== cat.name.toLowerCase() &&
                                    t.toLowerCase() !== cat.slug.toLowerCase()
                                );
                                setTags(next.join(", "));
                              } else {
                                // Tambah nama kategori sebagai tag
                                setTags([...list, cat.name].join(", "));
                              }
                            }}
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-all border ${
                              isSelected
                                ? "bg-primary text-white border-primary shadow-sm"
                                : "bg-white/70 text-foreground/70 border-border hover:border-primary/40 hover:bg-secondary"
                            }`}
                          >
                            {isSelected ? `✓ ${cat.name}` : `+ ${cat.name}`}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hotspot tagging */}
        <div className="cartoon-card bg-white/60 backdrop-blur-2xl p-6 sm:p-8 space-y-4 border-white/40">
          <div className="border-b border-border pb-3">
            <h2 className="font-black font-nunito text-lg tracking-tighter text-foreground">Tag Hotspot Pakaian &amp; Produk Affiliate</h2>
            <p className="text-xs font-bold text-foreground/70">Klik pada gambar untuk menandai produk pakaian</p>
          </div>
          <HotspotEditor
            imageUrl={imageUrl}
            items={items}
            onChange={setItems}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/admin"
            className="cartoon-btn bg-white/60 backdrop-blur-md px-5 py-2.5 text-xs sm:text-sm font-black text-foreground border border-border"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="cartoon-btn inline-flex items-center gap-2 bg-primary px-6 py-2.5 text-xs sm:text-sm font-black text-white disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Menyimpan..." : "Simpan Outfit"}
          </button>
        </div>
      </form>
    </main>
  );
}
