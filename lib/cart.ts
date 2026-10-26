export interface CartItem {
  id: string;
  name: string;
  brand?: string;
  price?: number;
  affiliate_url: string;
  outfitId?: string;
  outfitTitle?: string;
  outfitImage?: string;
  quantity: number;
  addedAt: number;
}

const STORAGE_KEY = "curated_ootd_cart";
export const CART_UPDATED_EVENT = "cart_updated";

function readAll(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}

export function getCart(): CartItem[] {
  return readAll();
}

export function getCartCount(): number {
  return readAll().reduce((sum, item) => sum + (item.quantity || 1), 0);
}

export function isInCart(itemId: string): boolean {
  return readAll().some((item) => item.id === itemId);
}

export function addToCart(item: Omit<CartItem, "addedAt" | "quantity"> & { quantity?: number }): CartItem[] {
  const current = readAll();
  const existingIndex = current.findIndex((i) => i.id === item.id);
  const qtyToAdd = item.quantity && item.quantity > 0 ? item.quantity : 1;

  if (existingIndex >= 0) {
    current[existingIndex].quantity = (current[existingIndex].quantity || 1) + qtyToAdd;
  } else {
    current.unshift({
      ...item,
      quantity: qtyToAdd,
      addedAt: Date.now(),
    });
  }

  writeAll(current);
  return current;
}

export function updateCartQuantity(itemId: string, delta: number): CartItem[] {
  const current = readAll();
  const index = current.findIndex((i) => i.id === itemId);
  if (index >= 0) {
    const newQty = (current[index].quantity || 1) + delta;
    if (newQty <= 0) {
      current.splice(index, 1);
    } else {
      current[index].quantity = newQty;
    }
    writeAll(current);
  }
  return current;
}

export function removeFromCart(itemId: string): CartItem[] {
  const next = readAll().filter((item) => item.id !== itemId);
  writeAll(next);
  return next;
}

export function clearCart(): void {
  writeAll([]);
}
