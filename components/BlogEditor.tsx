"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateSlug, normalizeBlogImageUrl } from "@/lib/blog";
import {
  Save,
  Eye,
  Globe,
  FileText,
  X,
  Upload,
  Download,
  Image as ImageIcon,
  Tag,
  ChevronDown,
  Loader2,
  CheckCircle,
  AlertCircle,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Undo2,
  Redo2,
  Highlighter,
  Quote,
  Minus,
  RemoveFormatting,
} from "lucide-react";

interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  author_name: string;
  tags: string[];
  status: "draft" | "published";
}

interface Props {
  initialPost?: BlogPost & { id: string };
}

export default function BlogEditor({ initialPost }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<BlogPost>(
    initialPost ?? {
      slug: "",
      title: "",
      excerpt: "",
      content: "",
      cover_image: "",
      author_name: "Admin",
      tags: [],
      status: "draft",
    }
  );
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [preview, setPreview] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingContentImage, setUploadingContentImage] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const contentImageInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChangeRef = useRef(false);

  // Sync content into editable div when component mounts or form.content is changed externally (e.g. Word import)
  useEffect(() => {
    if (editorRef.current && !isInternalChangeRef.current) {
      if (editorRef.current.innerHTML !== form.content) {
        editorRef.current.innerHTML = form.content || "";
      }
    }
    isInternalChangeRef.current = false;
  }, [form.content]);

  // Update active state of formatting buttons based on current selection
  const updateActiveFormats = useCallback(() => {
    if (typeof document === "undefined") return;
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
        justifyFull: document.queryCommandState("justifyFull"),
      });
    } catch {
      // Ignore security or document state errors
    }
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: f.id ? f.slug : generateSlug(title),
    }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  // Sync editor innerHTML to state
  const handleEditorInput = () => {
    if (editorRef.current) {
      isInternalChangeRef.current = true;
      setForm((f) => ({ ...f, content: editorRef.current?.innerHTML ?? "" }));
      updateActiveFormats();
    }
  };

  // Execute rich text formatting commands
  const execCmd = (cmd: string, value: string | undefined = undefined) => {
    if (typeof document === "undefined") return;
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    handleEditorInput();
    updateActiveFormats();
  };

  const handleInsertLink = () => {
    const url = prompt("Masukkan URL tautan (link):", "https://");
    if (url && url !== "https://") {
      execCmd("createLink", url);
    }
  };

  const handleInsertImage = () => {
    const choice = confirm(
      "Klik OK untuk UPLOAD FOTO dari perangkat komputer/HP ini.\nAtau klik CANCEL jika ingin memasukkan LINK URL gambar."
    );
    if (choice) {
      contentImageInputRef.current?.click();
    } else {
      const url = prompt("Masukkan URL gambar:", "https://");
      if (url && url !== "https://") {
        execCmd("insertImage", normalizeBlogImageUrl(url));
      }
    }
  };

  const handleUploadContentImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("error", "Harap pilih file gambar (JPG, PNG, WebP)!");
      return;
    }

    setUploadingContentImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Gagal mengunggah gambar");
      }

      execCmd("insertImage", data.url);
      showToast("success", "Gambar berhasil diunggah ke dalam konten!");
    } catch (err: unknown) {
      console.error(err);
      showToast("error", (err as Error).message || "Gagal mengunggah gambar");
    } finally {
      setUploadingContentImage(false);
      if (contentImageInputRef.current) contentImageInputRef.current.value = "";
    }
  };

  const handleUploadCoverImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("error", "Harap pilih file gambar (JPG, PNG, WebP)!");
      return;
    }

    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Gagal mengunggah foto cover");
      }

      setForm((f) => ({ ...f, cover_image: data.url }));
      showToast("success", "Foto cover berhasil diunggah!");
    } catch (err: unknown) {
      console.error(err);
      showToast("error", (err as Error).message || "Gagal mengunggah foto cover");
    } finally {
      setUploadingCover(false);
      if (coverImageInputRef.current) coverImageInputRef.current.value = "";
    }
  };

  const handleFormatBlock = (tag: string) => {
    execCmd("formatBlock", `<${tag}>`);
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!form.title.trim()) {
      showToast("error", "Judul artikel wajib diisi!");
      return;
    }
    const cleanContent = (form.content || "").replace(/<[^>]*>/g, "").trim();
    if (!cleanContent && !form.content.includes("<img")) {
      showToast("error", "Konten artikel wajib diisi!");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        ...form,
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
      };

      let error;
      if (form.id) {
        ({ error } = await supabase
          .from("blog_posts")
          .update(payload)
          .eq("id", form.id));
      } else {
        ({ error } = await supabase.from("blog_posts").insert(payload));
      }

      if (error) throw error;
      showToast(
        "success",
        status === "published" ? "Artikel berhasil dipublikasikan!" : "Draf tersimpan!"
      );
      setTimeout(() => router.push("/admin/blog"), 1200);
    } catch (err: unknown) {
      showToast("error", (err as Error).message ?? "Gagal menyimpan artikel.");
    } finally {
      setSaving(false);
    }
  };

  // Import from .docx using mammoth
  const handleImportDocx = useCallback(async (file: File) => {
    setImportLoading(true);
    try {
      const mammoth = (await import("mammoth")).default;
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;

      isInternalChangeRef.current = false;
      setForm((f) => ({
        ...f,
        content: html,
        title: f.title || file.name.replace(/\.docx?$/i, ""),
        slug: f.slug || generateSlug(file.name.replace(/\.docx?$/i, "")),
      }));

      if (editorRef.current) {
        editorRef.current.innerHTML = html;
      }
      showToast("success", "Dokumen Word berhasil diimpor!");
    } catch {
      showToast("error", "Gagal mengimpor file Word. Pastikan format .docx.");
    } finally {
      setImportLoading(false);
    }
  }, []);

  // Export to .docx using docx library
  const handleExportDocx = async () => {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");

      // Strip HTML tags to get plain text sections
      const parser = new DOMParser();
      const doc2 = parser.parseFromString(form.content, "text/html");
      const elements = Array.from(doc2.body.children);

      const children = elements.length > 0
        ? elements.map((el) => {
            const text = el.textContent ?? "";
            if (el.tagName === "H1")
              return new Paragraph({ text, heading: HeadingLevel.HEADING_1 });
            if (el.tagName === "H2")
              return new Paragraph({ text, heading: HeadingLevel.HEADING_2 });
            if (el.tagName === "H3")
              return new Paragraph({ text, heading: HeadingLevel.HEADING_3 });
            return new Paragraph({ children: [new TextRun(text)] });
          })
        : [new Paragraph({ children: [new TextRun(form.content.replace(/<[^>]*>/g, ""))] })];

      const docFile = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: form.title,
                heading: HeadingLevel.TITLE,
              }),
              new Paragraph({ children: [new TextRun("")] }),
              ...children,
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(docFile);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${form.slug || "artikel"}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("success", "Artikel berhasil diekspor ke Word (.docx)!");
    } catch (err) {
      console.error(err);
      showToast("error", "Gagal mengekspor ke Word.");
    }
  };

  const htmlContent = form.content.includes("<")
    ? form.content
    : form.content
        .split("\n\n")
        .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
        .join("");

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-24 right-4 z-[200] flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-cartoon text-sm font-bold transition-all ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Top Header Actions */}
      <div className="sticky top-[8.5rem] z-40 bg-white/95 backdrop-blur-xl border-b border-border/60 -mx-3 sm:-mx-6 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-black text-foreground">
          <FileText className="h-4 w-4 text-primary" />
          {form.id ? "Edit Artikel" : "Tulis Artikel Baru"}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Import Word */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".doc,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportDocx(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importLoading}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-secondary hover:border-primary/40 transition-all disabled:opacity-60"
            title="Import dokumen dari Microsoft Word (.docx)"
          >
            {importLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : (
              <Upload className="h-3.5 w-3.5 text-primary" />
            )}
            Import Word
          </button>

          {/* Export Word */}
          <button
            type="button"
            onClick={handleExportDocx}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-secondary hover:border-primary/40 transition-all"
            title="Download sebagai file Microsoft Word (.docx)"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            Export Word
          </button>

          {/* Preview toggle */}
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all ${
              preview
                ? "bg-primary text-white border-primary shadow-cartoon-sm"
                : "border-border bg-white text-foreground hover:bg-secondary"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            {preview ? "Tutup Preview" : "Preview Web"}
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-4 py-1.5 text-xs font-black text-foreground hover:bg-secondary/80 transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Simpan Draf
          </button>

          {/* Publish */}
          <button
            type="button"
            onClick={() => handleSave("published")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary text-white px-4 py-1.5 text-xs font-black shadow-cartoon-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
            Publikasikan
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 mt-6">
        {/* Main Editor */}
        <div className="space-y-5">
          {/* Title */}
          <div>
            <input
              id="blog-title"
              type="text"
              placeholder="Judul artikel yang menarik..."
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full text-2xl sm:text-3xl font-black font-nunito tracking-tight bg-transparent border-0 border-b-2 border-border focus:border-primary outline-none px-0 py-3 text-foreground placeholder:text-muted-foreground/50 transition-colors"
            />
          </div>

          {/* Slug */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-xl px-3 py-2">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="opacity-70">/blog/</span>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="flex-1 bg-transparent outline-none font-mono text-primary font-bold"
              placeholder="slug-artikel"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="text-xs font-black text-muted-foreground block mb-1.5">Ringkasan (Excerpt)</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              placeholder="Ringkasan singkat artikel untuk ditampilkan di halaman daftar blog dan Google search preview..."
              rows={2}
              className="w-full text-sm bg-secondary/40 border border-border rounded-2xl px-4 py-3 outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/50 resize-none transition-colors"
            />
          </div>

          {/* Word-like Rich Content Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-muted-foreground">
                Konten Artikel (Microsoft Word Style Editor)
              </label>
              <span className="text-[11px] font-bold text-muted-foreground/70">
                Pilih teks untuk format atau gunakan toolbar di bawah
              </span>
            </div>

            {preview ? (
              <div
                className="min-h-[460px] bg-white border border-border rounded-3xl p-6 sm:p-8 shadow-sm text-foreground/90 leading-relaxed font-sans"
                style={{
                  lineHeight: "1.75",
                  wordBreak: "break-word",
                }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            ) : (
              <div className="border border-border/80 rounded-3xl overflow-hidden bg-white shadow-cartoon-sm focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                {/* Word Ribbon Toolbar */}
                <div className="bg-[#1f2430] text-gray-200 border-b border-border/40 p-2 sm:p-2.5 flex flex-wrap items-center gap-1 sm:gap-1.5 select-none text-xs">
                  {/* Group 1: History / Undo Redo */}
                  <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => execCmd("undo")}
                      title="Undo (Ctrl+Z)"
                      className="p-1.5 hover:bg-white/15 rounded text-gray-300 hover:text-white transition-colors"
                    >
                      <Undo2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd("redo")}
                      title="Redo (Ctrl+Y)"
                      className="p-1.5 hover:bg-white/15 rounded text-gray-300 hover:text-white transition-colors"
                    >
                      <Redo2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Group 2: Paragraph / Heading Styles */}
                  <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) handleFormatBlock(val);
                      }}
                      defaultValue="p"
                      className="bg-transparent text-gray-200 text-xs font-bold px-2 py-1 outline-none cursor-pointer rounded hover:bg-white/10"
                      title="Gaya Teks (Styles)"
                    >
                      <option value="p" className="bg-[#1f2430] text-white">Normal (Paragraf)</option>
                      <option value="h1" className="bg-[#1f2430] text-white">Heading 1 (Judul Utama)</option>
                      <option value="h2" className="bg-[#1f2430] text-white">Heading 2 (Sub Judul)</option>
                      <option value="h3" className="bg-[#1f2430] text-white">Heading 3 (Bagian)</option>
                      <option value="pre" className="bg-[#1f2430] text-white">Code Block</option>
                    </select>

                    <div className="h-4 w-[1px] bg-white/20 mx-0.5" />

                    {/* Font Size */}
                    <select
                      onChange={(e) => execCmd("fontSize", e.target.value)}
                      defaultValue="3"
                      className="bg-transparent text-gray-200 text-xs font-bold px-1.5 py-1 outline-none cursor-pointer rounded hover:bg-white/10"
                      title="Ukuran Font"
                    >
                      <option value="1" className="bg-[#1f2430] text-white">10 pt</option>
                      <option value="2" className="bg-[#1f2430] text-white">12 pt</option>
                      <option value="3" className="bg-[#1f2430] text-white">14 pt (Normal)</option>
                      <option value="4" className="bg-[#1f2430] text-white">16 pt</option>
                      <option value="5" className="bg-[#1f2430] text-white">20 pt</option>
                      <option value="6" className="bg-[#1f2430] text-white">26 pt</option>
                      <option value="7" className="bg-[#1f2430] text-white">36 pt</option>
                    </select>
                  </div>

                  {/* Group 3: Character Formatting (Bold, Italic, Underline, Strikethrough) */}
                  <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => execCmd("bold")}
                      title="Tebal (Ctrl+B)"
                      className={`p-1.5 rounded transition-all font-black ${
                        activeFormats.bold
                          ? "bg-primary text-white shadow-sm"
                          : "text-gray-300 hover:text-white hover:bg-white/15"
                      }`}
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd("italic")}
                      title="Miring (Ctrl+I)"
                      className={`p-1.5 rounded transition-all italic ${
                        activeFormats.italic
                          ? "bg-primary text-white shadow-sm"
                          : "text-gray-300 hover:text-white hover:bg-white/15"
                      }`}
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd("underline")}
                      title="Garis Bawah (Ctrl+U)"
                      className={`p-1.5 rounded transition-all underline ${
                        activeFormats.underline
                          ? "bg-primary text-white shadow-sm"
                          : "text-gray-300 hover:text-white hover:bg-white/15"
                      }`}
                    >
                      <Underline className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd("strikeThrough")}
                      title="Coretan (Strikethrough)"
                      className={`p-1.5 rounded transition-all line-through ${
                        activeFormats.strikeThrough
                          ? "bg-primary text-white shadow-sm"
                          : "text-gray-300 hover:text-white hover:bg-white/15"
                      }`}
                    >
                      <Strikethrough className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Group 4: Text Color & Highlight */}
                  <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                    {/* Text Color */}
                    <label
                      title="Warna Teks (Font Color)"
                      className="flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-white/15 text-gray-300 hover:text-white transition-colors"
                    >
                      <span className="font-black text-xs border-b-2 border-primary">A</span>
                      <input
                        type="color"
                        defaultValue="#1f2430"
                        onChange={(e) => execCmd("foreColor", e.target.value)}
                        className="w-4 h-4 rounded border-0 p-0 cursor-pointer bg-transparent"
                      />
                    </label>

                    {/* Highlight Color */}
                    <label
                      title="Warna Sorotan (Highlight / Text Background)"
                      className="flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-white/15 text-gray-300 hover:text-white transition-colors"
                    >
                      <Highlighter className="h-3.5 w-3.5 text-yellow-400" />
                      <input
                        type="color"
                        defaultValue="#fef08a"
                        onChange={(e) => execCmd("hiliteColor", e.target.value)}
                        className="w-4 h-4 rounded border-0 p-0 cursor-pointer bg-transparent"
                      />
                    </label>
                  </div>

                  {/* Group 5: Alignment */}
                  <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => execCmd("justifyLeft")}
                      title="Rata Kiri (Align Left)"
                      className={`p-1.5 rounded transition-all ${
                        activeFormats.justifyLeft
                          ? "bg-primary text-white"
                          : "text-gray-300 hover:text-white hover:bg-white/15"
                      }`}
                    >
                      <AlignLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd("justifyCenter")}
                      title="Rata Tengah (Align Center)"
                      className={`p-1.5 rounded transition-all ${
                        activeFormats.justifyCenter
                          ? "bg-primary text-white"
                          : "text-gray-300 hover:text-white hover:bg-white/15"
                      }`}
                    >
                      <AlignCenter className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd("justifyRight")}
                      title="Rata Kanan (Align Right)"
                      className={`p-1.5 rounded transition-all ${
                        activeFormats.justifyRight
                          ? "bg-primary text-white"
                          : "text-gray-300 hover:text-white hover:bg-white/15"
                      }`}
                    >
                      <AlignRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd("justifyFull")}
                      title="Rata Kiri-Kanan (Justify)"
                      className={`p-1.5 rounded transition-all ${
                        activeFormats.justifyFull
                          ? "bg-primary text-white"
                          : "text-gray-300 hover:text-white hover:bg-white/15"
                      }`}
                    >
                      <AlignJustify className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Group 6: Lists */}
                  <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => execCmd("insertUnorderedList")}
                      title="Daftar Poin (Bullet List)"
                      className={`p-1.5 rounded transition-all ${
                        activeFormats.insertUnorderedList
                          ? "bg-primary text-white"
                          : "text-gray-300 hover:text-white hover:bg-white/15"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd("insertOrderedList")}
                      title="Daftar Angka (Numbered List)"
                      className={`p-1.5 rounded transition-all ${
                        activeFormats.insertOrderedList
                          ? "bg-primary text-white"
                          : "text-gray-300 hover:text-white hover:bg-white/15"
                      }`}
                    >
                      <ListOrdered className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Group 7: Inserts (Link, Image, Quote, HR) */}
                  <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/10">
                    <button
                      type="button"
                      onClick={handleInsertLink}
                      title="Sisipkan Tautan Web (Link)"
                      className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-white/15 transition-all"
                    >
                      <Link2 className="h-4 w-4" />
                    </button>
                    <input
                      ref={contentImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadContentImage}
                    />
                    <button
                      type="button"
                      onClick={handleInsertImage}
                      disabled={uploadingContentImage}
                      title="Sisipkan Gambar (Upload dari Perangkat atau dari Link URL)"
                      className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-white/15 transition-all disabled:opacity-50"
                    >
                      {uploadingContentImage ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <ImageIcon className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatBlock("blockquote")}
                      title="Kutipan (Quote)"
                      className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-white/15 transition-all"
                    >
                      <Quote className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd("insertHorizontalRule")}
                      title="Garis Pembatas (Divider)"
                      className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-white/15 transition-all"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd("removeFormat")}
                      title="Hapus Format (Clear Formatting)"
                      className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-white/15 transition-all"
                    >
                      <RemoveFormatting className="h-4 w-4 text-red-300" />
                    </button>
                  </div>
                </div>

                {/* Sub-toolbar Quick Format Bar (H1, H2, H3 buttons) */}
                <div className="bg-[#282e3d] text-gray-300 px-3 py-1.5 border-b border-border/40 flex items-center gap-2 text-[11px] overflow-x-auto">
                  <span className="font-bold text-gray-400 shrink-0">Preset Cepat:</span>
                  <button
                    type="button"
                    onClick={() => handleFormatBlock("h1")}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 font-bold text-white transition-colors shrink-0"
                  >
                    H1 Judul
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatBlock("h2")}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 font-bold text-white transition-colors shrink-0"
                  >
                    H2 Sub-judul
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatBlock("h3")}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 font-bold text-white transition-colors shrink-0"
                  >
                    H3 Bagian
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatBlock("p")}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 font-bold text-white transition-colors shrink-0"
                  >
                    Normal Paragraf
                  </button>
                </div>

                {/* Word Page Simulation ContentEditable Area */}
                <div className="bg-muted/30 p-3 sm:p-6 overflow-x-auto">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    onKeyUp={updateActiveFormats}
                    onMouseUp={updateActiveFormats}
                    data-placeholder="Mulai menulis artikel OOTD di sini... Format teks layaknya di Microsoft Word!"
                    className="min-h-[480px] bg-white border border-border/70 rounded-2xl p-6 sm:p-10 shadow-sm outline-none text-foreground text-sm sm:text-base leading-relaxed max-w-4xl mx-auto focus:shadow-md transition-shadow
                      [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground/40 [&:empty]:before:pointer-events-none
                      [&_h1]:text-2xl sm:[&_h1]:text-3xl [&_h1]:font-black [&_h1]:font-nunito [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-foreground
                      [&_h2]:text-xl sm:[&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:font-nunito [&_h2]:mt-5 [&_h2]:mb-2.5 [&_h2]:text-foreground
                      [&_h3]:text-lg sm:[&_h3]:text-xl [&_h3]:font-bold [&_h3]:font-nunito [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-foreground
                      [&_p]:mb-3 [&_p]:leading-relaxed
                      [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3
                      [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3
                      [&_li]:my-1
                      [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-secondary/40 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-3 [&_blockquote]:rounded-r-xl [&_blockquote]:italic
                      [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:shadow-cartoon-sm [&_img]:my-4
                      [&_a]:text-primary [&_a]:underline [&_a]:font-bold
                      [&_hr]:my-6 [&_hr]:border-border"
                  />
                </div>

                {/* Status Bar (Word-like footer: word count, characters) */}
                <div className="bg-[#1f2430] text-gray-400 px-4 py-2 border-t border-border/40 text-[11px] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-4">
                    <span>
                      Kata:{" "}
                      <strong className="text-gray-200">
                        {form.content
                          .replace(/<[^>]*>/g, " ")
                          .trim()
                          .split(/\s+/)
                          .filter(Boolean).length}
                      </strong>
                    </span>
                    <span>
                      Karakter:{" "}
                      <strong className="text-gray-200">
                        {form.content.replace(/<[^>]*>/g, "").length}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <span>Microsoft Word WYSIWYG Mode</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Status */}
          <div className="cartoon-card bg-white p-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Status</h3>
            <div className="relative">
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as "draft" | "published" }))
                }
                className="w-full appearance-none text-sm font-bold bg-secondary border border-border rounded-xl px-3 py-2 outline-none focus:border-primary text-foreground cursor-pointer pr-8"
              >
                <option value="draft">📝 Draf</option>
                <option value="published">🌍 Dipublikasikan</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Cover Image */}
          <div className="cartoon-card bg-white p-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" /> Gambar Cover
            </h3>

            {/* Input URL atau Upload File */}
            <div className="space-y-2">
              <input
                type="url"
                value={form.cover_image}
                onChange={(e) => setForm((f) => ({ ...f, cover_image: e.target.value }))}
                placeholder="Masukkan URL (https://...)"
                className="w-full text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/50"
              />

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-bold uppercase">atau</span>
                <input
                  ref={coverImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadCoverImage}
                />
                <button
                  type="button"
                  onClick={() => coverImageInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-all disabled:opacity-50"
                >
                  {uploadingCover ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload dari Perangkat</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {form.cover_image && (
              <div className="relative rounded-xl overflow-hidden h-36 border border-border/80 bg-secondary/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={normalizeBlogImageUrl(form.cover_image)}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='12' y1='8' x2='12' y2='12'/%3E%3Cline x1='12' y1='16' x2='12.01' y2='16'/%3E%3C/svg%3E";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, cover_image: "" }))}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                  title="Hapus Cover"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Author */}
          <div className="cartoon-card bg-white p-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Penulis</h3>
            <input
              type="text"
              value={form.author_name}
              onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
              className="w-full text-sm bg-secondary/50 border border-border rounded-xl px-3 py-2 outline-none focus:border-primary text-foreground"
            />
          </div>

          {/* Tags */}
          <div className="cartoon-card bg-white p-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> Tag
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="fashion, ootd..."
                className="flex-1 text-xs bg-secondary/50 border border-border rounded-xl px-3 py-2 outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/50"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-black"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-secondary text-secondary-foreground"
                >
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
