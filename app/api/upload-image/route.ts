import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    // Maksimal 10MB untuk foto outfit resolusi tinggi
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 10MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const cleanExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
    const filename = `outfit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;

    // 1. Coba upload ke Supabase Storage (bucket: 'outfits') jika konfigurasi ada
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY);

        // Pastikan bucket outfits sudah ada
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        const hasBucket = buckets?.some((b) => b.name === "outfits");
        if (!hasBucket) {
          await supabaseAdmin.storage.createBucket("outfits", {
            public: true,
            fileSizeLimit: 10 * 1024 * 1024,
          });
        }

        const { data, error } = await supabaseAdmin.storage
          .from("outfits")
          .upload(filename, buffer, {
            contentType: file.type || `image/${cleanExt}`,
            upsert: false,
          });

        if (!error && data) {
          const { data: urlData } = supabaseAdmin.storage
            .from("outfits")
            .getPublicUrl(data.path);

          return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            source: "supabase",
          });
        }
        console.warn("Supabase Storage outfits upload warning:", error?.message);
      } catch (storageErr) {
        console.warn("Supabase Storage outfits exception:", storageErr);
      }
    }

    // 2. Fallback: Simpan ke folder lokal /public/uploads
    try {
      const { writeFile, mkdir } = await import("fs/promises");
      const path = await import("path");
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);
      const publicUrl = `/uploads/${filename}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        source: "local",
      });
    } catch (fsErr) {
      console.warn("Local storage fallback failed:", fsErr);
    }

    // 3. Fallback darurat: Data URL Base64 jika storage lokal/cloud tidak dapat diakses
    const base64 = buffer.toString("base64");
    const mime = file.type || `image/${cleanExt}`;
    const dataUrl = `data:${mime};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      source: "data_url",
    });
  } catch (error: any) {
    console.error("Upload outfit image error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal mengunggah gambar" },
      { status: 500 }
    );
  }
}
