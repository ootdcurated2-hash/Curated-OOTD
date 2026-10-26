"use client";

import { useState, useRef } from "react";
import { UploadCloud, Link as LinkIcon, Image as ImageIcon, X, CheckCircle2, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export default function ImageUploader({
  value,
  onChange,
  label = "Foto Outfit",
  className = "",
}: ImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<"device" | "url">("device");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Format file harus berupa gambar (JPG, PNG, WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Ukuran file maksimal 10MB.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    // Tampilkan preview lokal instan
    const previewUrl = URL.createObjectURL(file);
    onChange(previewUrl);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengunggah gambar");
      }

      // Update dengan URL persisten dari server / storage
      onChange(data.url);
      setUploadSuccess("Gambar berhasil diunggah!");
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Gagal mengunggah gambar ke server");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black text-foreground">
          {label} <span className="text-red-500">*</span>
        </label>
        <span className="text-[11px] text-foreground/60 font-semibold">
          Bisa upload dari perangkat atau isi link opsional
        </span>
      </div>

      {/* Tab Switcher: Dari Perangkat vs Link URL */}
      <div className="flex items-center p-1 bg-secondary/80 rounded-2xl border border-border gap-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("device")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
            activeTab === "device"
              ? "bg-white text-primary shadow-cartoon-sm border border-border"
              : "text-foreground/70 hover:text-foreground"
          }`}
        >
          <UploadCloud className="h-3.5 w-3.5" />
          Dari Perangkat
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("url")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
            activeTab === "url"
              ? "bg-white text-primary shadow-cartoon-sm border border-border"
              : "text-foreground/70 hover:text-foreground"
          }`}
        >
          <LinkIcon className="h-3.5 w-3.5" />
          Link URL (Opsional)
        </button>
      </div>

      {/* Area Upload dari Perangkat */}
      {activeTab === "device" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-primary bg-primary/10 scale-[0.99]"
              : "border-border/80 bg-white/40 hover:bg-white/70 hover:border-primary/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/gif"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <UploadCloud className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-black text-foreground">
                {uploading
                  ? "Sedang mengunggah gambar..."
                  : "Klik atau Tarik Foto dari Perangkat ke sini"}
              </p>
              <p className="text-[11px] font-bold text-foreground/50 mt-0.5">
                Mendukung JPG, PNG, WEBP hingga 10MB
              </p>
            </div>
            <button
              type="button"
              className="mt-1 cartoon-btn inline-flex items-center gap-1.5 bg-primary text-white text-[11px] font-black px-3.5 py-1.5"
            >
              Pilih dari File / Galeri
            </button>
          </div>
        </div>
      )}

      {/* Input URL Gambar (Opsional) */}
      {activeTab === "url" && (
        <div className="space-y-1.5">
          <div className="relative">
            <input
              type="url"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setUploadError(null);
                setUploadSuccess(null);
              }}
              placeholder="https://images.unsplash.com/... atau URL foto lainnya"
              className="w-full rounded-2xl border border-border bg-white/60 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary pl-9"
            />
            <LinkIcon className="h-4 w-4 text-foreground/40 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <p className="text-[10px] font-bold text-foreground/50">
            *Opsional: Masukkan link gambar langsung jika foto sudah tersedia online di internet.
          </p>
        </div>
      )}

      {/* Feedback Messages */}
      {uploadError && (
        <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
          {uploadError}
        </p>
      )}

      {uploadSuccess && (
        <p className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {uploadSuccess}
        </p>
      )}

      {/* Image Preview & Current URL Indicator */}
      {value && (
        <div className="flex items-center gap-3 p-2.5 bg-white/80 rounded-2xl border border-border">
          <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-border bg-muted flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase text-foreground/50 flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> Foto Terpilih
            </span>
            <p className="text-xs font-bold text-foreground truncate mt-0.5">
              {value}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setUploadSuccess(null);
            }}
            title="Hapus gambar"
            className="p-1.5 text-foreground/60 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
