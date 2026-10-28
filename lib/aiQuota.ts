export interface AIQuotaStatus {
  limit: number;
  used: number;
  remaining: number;
  isAdmin: boolean;
  canAsk: boolean;
  resetsAt: string; // ISO string
  resetDateStr: string; // YYYY-MM-DD
}

const STORAGE_KEY = "curated_ootd_ai_daily_usage";
export const DAILY_LIMIT = 10;

/** Mendapatkan tanggal hari ini dalam format YYYY-MM-DD sesuai zona waktu lokal (WIB / browser) */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Mendapatkan waktu reset (tengah malam besok) */
export function getNextResetTime(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

export interface StoredUsage {
  date: string;
  count: number;
}

/** Membaca usage hari ini dari localStorage */
export function getLocalUsage(): StoredUsage {
  if (typeof window === "undefined") {
    return { date: getTodayDateString(), count: 0 };
  }

  const today = getTodayDateString();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: today, count: 0 };

    const parsed: StoredUsage = JSON.parse(raw);
    // Jika tanggal berbeda (sudah ganti hari), otomatis reset ke 0
    if (parsed.date !== today) {
      const fresh = { date: today, count: 0 };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return parsed;
  } catch {
    return { date: today, count: 0 };
  }
}

/** Menambah count usage hari ini */
export function recordLocalUsage(increment: number = 1): StoredUsage {
  if (typeof window === "undefined") {
    return { date: getTodayDateString(), count: increment };
  }

  const today = getTodayDateString();
  const current = getLocalUsage();
  const newCount = (current.date === today ? current.count : 0) + increment;
  const updated: StoredUsage = { date: today, count: newCount };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Gagal menyimpan quota ke localStorage:", err);
  }

  return updated;
}

/** Menghitung status kuota di browser untuk user biasa */
export function getClientQuotaStatus(isAdmin: boolean = false): AIQuotaStatus {
  const resetsAt = getNextResetTime().toISOString();
  const today = getTodayDateString();

  if (isAdmin) {
    return {
      limit: DAILY_LIMIT,
      used: 0,
      remaining: 9999,
      isAdmin: true,
      canAsk: true,
      resetsAt,
      resetDateStr: today,
    };
  }

  const usage = getLocalUsage();
  const used = Math.min(DAILY_LIMIT, Math.max(0, usage.count));
  const remaining = Math.max(0, DAILY_LIMIT - used);

  return {
    limit: DAILY_LIMIT,
    used,
    remaining,
    isAdmin: false,
    canAsk: remaining > 0,
    resetsAt,
    resetDateStr: today,
  };
}
