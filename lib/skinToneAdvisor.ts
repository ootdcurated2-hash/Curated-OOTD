export interface StyleTip {
  title: string;
  advice: string;
  colorPalette: { name: string; hex: string }[];
  avoidColors?: string[];
  recommendedStyles: string[];
  examplePieces: { name: string; category: string; reason: string }[];
}

export interface RecommendationResponse {
  skinToneKey: string;
  skinToneTitle: string;
  summary: string;
  undertoneAnalysis: string;
  tips: StyleTip;
  quickPrompts: string[];
}

export const SKIN_TONE_DATA: Record<string, RecommendationResponse> = {
  cokelat: {
    skinToneKey: "cokelat",
    skinToneTitle: "Kulit Cokelat / Sawo Matang (Warm & Tan Undertone)",
    summary:
      "Kulit sawo matang atau eksotis memiliki nuansa warm undertone alami yang memancarkan pesona tropis. Warna hangat, kontras seimbang, dan earth tone akan membuat kulit Anda terlihat bersinar (glowing), sehat, dan berkarakter kuat.",
    undertoneAnalysis:
      "Karakteristik sawo matang Indonesia umumnya condong ke warm hingga neutral-warm dengan kilau keemasan. Menghindari warna yang terlalu kusam (dull greyish) dan memilih warna kaya pigmen seperti Terracotta, Mustard, Olive, serta Broken White adalah kunci utama.",
    tips: {
      title: "Formula Warna Terbaik untuk Kulit Cokelat / Sawo Matang",
      advice:
        "Gunakan aturan kontras kontemporer: padukan warna terang bernuansa hangat (seperti Broken White, Warm Cream) dengan warna kontras dalam (Deep Navy, Forest Green, Terracotta, Rich Chocolate). Jangan gunakan warna abu-abu pucat atau neon pudar tanpa layering.",
      colorPalette: [
        { name: "Terracotta Warm", hex: "#C86D51" },
        { name: "Mustard Gold", hex: "#E5A93C" },
        { name: "Deep Olive / Army", hex: "#556B2F" },
        { name: "Broken White / Ivory", hex: "#F5F2EB" },
        { name: "Rich Chocolate Brown", hex: "#4B2810" },
        { name: "Deep Navy Blue", hex: "#1C2841" },
        { name: "Sage Green Light", hex: "#9CAF88" },
      ],
      avoidColors: [
        "Abu-abu pudar dingin (Cool Slate / Heather Grey tanpa aksen)",
        "Kuning neon pucat (membuat wajah tampak kusam)",
        "Magenta pucat dingin / Lilac pudar berlebih",
      ],
      recommendedStyles: ["Earth Tone Minimalist", "Urban Streetwear Baggy", "Smart Casual Warm Linen", "Vintage Retro 90s"],
      examplePieces: [],
    },
    quickPrompts: [
      "Warna apa yang cocok untuk kulit sawo matang?",
      "Outfit apa yang cocok untuk kulit cokelat?",
      "Rekomendasi warna baju cowok sawo matang",
      "Apakah warna sage green cocok untuk kulit cokelat?",
      "OOTD streetwear untuk kulit sawo matang",
    ],
  },

  kuning_langsat: {
    skinToneKey: "kuning_langsat",
    skinToneTitle: "Kulit Kuning Langsat (Neutral Warm)",
    summary:
      "Kulit kuning langsat sangat fleksibel. Warna-warna pastel hangat, coral, emerald green, dan navy tua akan membuat kompleksi wajah terlihat cerah dan segar.",
    undertoneAnalysis:
      "Memiliki perpaduan pigmen kuning cerah alami. Sangat cocok dengan palet permata (jewel tones) dan warna alam lembut.",
    tips: {
      title: "Panduan Gaya Kulit Kuning Langsat",
      advice:
        "Padukan atasan warna cerah hangat seperti Peach, Coral, atau Sky Blue dengan celana berkarakter seperti dark denim atau khaki.",
      colorPalette: [
        { name: "Coral Peach", hex: "#F88379" },
        { name: "Emerald Green", hex: "#1B4D3E" },
        { name: "Warm Khaki", hex: "#C3B091" },
        { name: "Classic Navy", hex: "#000080" },
        { name: "Sky Blue", hex: "#87CEEB" },
      ],
      avoidColors: ["Kuning neon menyilaukan", "Mustard kusam"],
      recommendedStyles: ["Korean Minimalist", "Smart Casual Blazer", "Casual Weekend Chic"],
      examplePieces: [],
    },
    quickPrompts: [
      "Warna baju untuk kulit kuning langsat",
      "Gaya outfit cowok kuning langsat",
      "Apakah warna hitam cocok untuk kulit kuning langsat?",
    ],
  },

  gelap: {
    skinToneKey: "gelap",
    skinToneTitle: "Kulit Gelap Eksotis / Deep Dark Skin Tone",
    summary:
      "Kulit deep dark memiliki keunggulan spektakuler: mampu mengenakan warna-warna kontras tinggi, bold jewel tones, dan monokrom putih bersih dengan sangat stand out!",
    undertoneAnalysis:
      "Kontras tinggi adalah sahabat terbaik Anda. Pure White, Cobalt Blue, Bold Gold, Burgundy, dan Emerald menciptakan visual yang memukau dan berkelas tinggi.",
    tips: {
      title: "Eksplorasi Kontras Tinggi dan Warna Berani",
      advice:
        "Jangan ragu memakai Pure Optical White, Merah Maroon / Burgundy pekat, atau Kuning Emas. Kenakan aksesori emas berkilau untuk sentuhan luxury maksimal.",
      colorPalette: [
        { name: "Pure Bright White", hex: "#FFFFFF" },
        { name: "Cobalt Royal Blue", hex: "#0047AB" },
        { name: "Deep Burgundy", hex: "#800020" },
        { name: "Rich Gold", hex: "#DAA520" },
        { name: "Emerald Jewel", hex: "#046307" },
      ],
      avoidColors: ["Cokelat kusam yang sama persis dengan warna kulit tanpa pembeda kontras"],
      recommendedStyles: ["High-Street Fashion", "Old Money Monokrom", "Edgy Modern Streetwear"],
      examplePieces: [],
    },
    quickPrompts: [
      "Warna baju untuk kulit hitam / gelap",
      "OOTD kontras tinggi untuk deep skin",
    ],
  },

  terang: {
    skinToneKey: "terang",
    skinToneTitle: "Kulit Putih / Cerah (Fair / Cool Undertone)",
    summary:
      "Kulit cerah cenderung memiliki undertone sejuk atau netral. Pilihan warna pastel elegan, navy, forest green, dan earthy charcoal akan mencegah tampilan terlihat pucat.",
    undertoneAnalysis:
      "Perlu warna dengan saturasi medium hingga tinggi agar tidak tampak 'washed out' (pucat). Hindari mengenakan full outfit warna beige nude tanpa layering kontras.",
    tips: {
      title: "Keseimbangan Kontras untuk Kulit Cerah",
      advice:
        "Gunakan pakaian bernada dalam seperti Navy, Maroon, Bottle Green, atau pastel sejuk seperti Lavender dan Mint.",
      colorPalette: [
        { name: "Deep Navy", hex: "#1A2A44" },
        { name: "Forest Green", hex: "#228B22" },
        { name: "Soft Lavender", hex: "#E6E6FA" },
        { name: "Wine Red", hex: "#722F37" },
        { name: "Charcoal Grey", hex: "#36454F" },
      ],
      avoidColors: ["Beige nude pucat tanpa kontras", "Putih pucat total tanpa aksesoris"],
      recommendedStyles: ["Minimalist Smart Casual", "Preppy Look", "Monochrome Streetwear"],
      examplePieces: [],
    },
    quickPrompts: [
      "Warna baju untuk kulit putih terang",
      "Kombinasi warna agar tidak terlihat pucat",
    ],
  },
};

export function getConsultationResponse(query: string): RecommendationResponse {
  const normalized = query.toLowerCase();

  // 1. Deteksi pertanyaan Berat Badan / Proporsi Tubuh (misal: "berat badan 67kg", "bb 60", "gemuk", "kurus")
  const weightMatch = normalized.match(/(\d{2,3})\s*(kg|kilo|kilogram)?/);
  const isWeightQuery =
    Boolean(weightMatch) ||
    normalized.includes("berat badan") ||
    normalized.includes("berat") ||
    normalized.includes("bb") ||
    normalized.includes("gemuk") ||
    normalized.includes("kurus") ||
    normalized.includes("berisi") ||
    normalized.includes("proporsi") ||
    normalized.includes("perut");

  if (isWeightQuery) {
    const weightNum = weightMatch ? parseInt(weightMatch[1], 10) : 67;
    const isMediumToSolid = weightNum >= 60 && weightNum <= 80;

    return {
      skinToneKey: "custom",
      skinToneTitle: `Panduan Gaya Proporsi Tubuh (~${weightNum} kg)`,
      summary: `Untuk postur tubuh sekitar ${weightNum} kg, kunci utamanya adalah memilih siluet pakaian dengan struktur rapi (*clean cut*), potongan regular atau relaxed fit yang tidak terlalu ketat, serta permainan warna monokrom atau kontras vertikal untuk menciptakan siluet tubuh yang proporsional dan percaya diri.`,
      undertoneAnalysis: `Proporsi tubuh ${weightNum} kg sangat ideal bila didukung ilusi visual garis vertikal (seperti kancing vertikal, celana straight cut, atau jaket/overshirt terbuka) yang memperpanjang postur dan memberi kesan tegap proporsional.`,
      tips: {
        title: `Formula Outfit Ideal untuk Berat ~${weightNum} kg`,
        advice: isMediumToSolid
          ? "Gunakan atasan potongan Regular atau Relaxed Fit dengan bahan berbobot sedang (seperti Oxford, Heavy Cotton, atau Linen). Padukan dengan celana Straight-leg atau Tapered Pants berpinggang mid-rise agar siluet kaki tampak jenjang."
          : "Pilih teknik layering (kaos + overshirt/outer) dan potongan celana straight-leg untuk memberi volume yang seimbang pada postur tubuh.",
        colorPalette: [
          { name: "Deep Charcoal Black", hex: "#1F2326" },
          { name: "Navy Blue Solid", hex: "#1C2841" },
          { name: "Olive Green Earth", hex: "#4A5D4E" },
          { name: "Broken White", hex: "#F5F2EB" },
          { name: "Terracotta Muted", hex: "#B85D43" },
          { name: "Warm Khaki", hex: "#C3B091" },
        ],
        avoidColors: [
          "Garis horizontal lebar yang membuat tubuh terlihat lebih lebar",
          "Bahan spandex/stretch yang terlalu menempel ketat di badan",
          "Warna neon mencolok di area yang ingin disamarkan",
        ],
        recommendedStyles: [
          "Smart Casual dengan Overshirt & Straight Chino",
          "Clean Minimalist Monokrom",
          "Urban Casual dengan Relaxed Denim",
          "Layering Ringan (T-shirt + Kemeja Terbuka)",
        ],
        examplePieces: [
          { name: "Kemeja Overshirt Katun", category: "Atasan", reason: "Memberi garis vertikal tegas dan menyamarkan lekuk torso" },
          { name: "Straight Fit Chino Pant", category: "Bawahan", reason: "Membuat proporsi kaki tampak seimbang dan jenjang" },
          { name: "Clean Minimalist Sneakers", category: "Alas Kaki", reason: "Menyempurnakan postur dengan gaya bersih elegan" },
        ],
      },
      quickPrompts: [
        "Outfit kondangan pria sawo matang",
        "Warna baju yang bikin terlihat langsing",
        "Kombinasi celana straight cut dan kemeja",
        "Gaya kasual santai untuk nongkrong",
      ],
    };
  }

  // 2. Deteksi Acara / Event / Formal / Kasual / Kantor / Kuliah
  if (
    normalized.includes("kondangan") ||
    normalized.includes("formal") ||
    normalized.includes("nikahan") ||
    normalized.includes("kantor") ||
    normalized.includes("kerja") ||
    normalized.includes("interview")
  ) {
    return {
      skinToneKey: "custom",
      skinToneTitle: "Gaya Formal & Semi-Formal Elegan",
      summary: "Tampilan rapi dan berkelas dicapai melalui perpaduan kemeja berkerah rapi, celana bahan tailored/ankle pant, serta warna-warna bernada dalam yang memberi kesan profesional dan berkarakter kuat.",
      undertoneAnalysis: "Warna-warna permata (Navy, Charcoal, Deep Emerald, Wine Red) berpadu sempurna untuk acara formal karena memancarkan aura wibawa tanpa berlebihan.",
      tips: {
        title: "Formula Smart Formal & Semi-Formal",
        advice: "Padukan blazer atau kemeja kancing terstruktur dengan celana bahan slim-straight berpotongan rapi di atas mata kaki. Gunakan sepatu pantofel atau loafers kulit bernuansa netral.",
        colorPalette: [
          { name: "Midnight Navy", hex: "#1A2536" },
          { name: "Charcoal Slate", hex: "#343A40" },
          { name: "Clean White", hex: "#FFFFFF" },
          { name: "Deep Maroon", hex: "#5C1D24" },
          { name: "Caramel Leather", hex: "#8A5A36" },
        ],
        avoidColors: ["Warna neon menyala", "Bahan denim belel di acara resmi"],
        recommendedStyles: ["Smart Casual Tailored", "Semi-Formal Suit", "Modern Minimalist Batik"],
        examplePieces: [
          { name: "Blazer Unstructured", category: "Atasan", reason: "Elegan namun tetap nyaman dipakai berjam-jam" },
          { name: "Trousers Ankle Cut", category: "Bawahan", reason: "Siluet modern yang tidak menumpuk di sepatu" },
        ],
      },
      quickPrompts: [
        "Warna baju kondangan untuk kulit sawo matang",
        "Sepatu yang cocok untuk kemeja formal",
      ],
    };
  }

  // 3. Deteksi Warna Kulit
  if (
    normalized.includes("cokelat") ||
    normalized.includes("coklat") ||
    normalized.includes("sawo matang") ||
    normalized.includes("tan") ||
    normalized.includes("gelap hangat") ||
    normalized.includes("kulit sawo")
  ) {
    return SKIN_TONE_DATA.cokelat;
  }

  if (
    normalized.includes("kuning") ||
    normalized.includes("langsat") ||
    normalized.includes("kuning langsat")
  ) {
    return SKIN_TONE_DATA.kuning_langsat;
  }

  if (
    normalized.includes("gelap") ||
    normalized.includes("hitam") ||
    normalized.includes("deep") ||
    normalized.includes("dark")
  ) {
    return SKIN_TONE_DATA.gelap;
  }

  if (
    normalized.includes("putih") ||
    normalized.includes("cerah") ||
    normalized.includes("terang") ||
    normalized.includes("fair")
  ) {
    return SKIN_TONE_DATA.terang;
  }

  // 4. Default: Rekomendasi pintar umum berbasis pertanyaan user
  return {
    ...SKIN_TONE_DATA.cokelat,
    skinToneTitle: `Rekomendasi Gaya: "${query.trim().slice(0, 45)}"`,
    summary: `Berdasarkan pertanyaan Anda tentang "${query.trim()}", formula terbaik adalah mengombinasikan warna earth tone hangat yang kontras seimbang dengan siluet potongan busana yang proporsional dan nyaman dipakai sehari-hari.`,
  };
}
