import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Backend base URL.
 * - Android emulator reaches your dev machine at 10.0.2.2
 * - Physical devices need your machine's LAN IP (set EXPO_PUBLIC_API_URL in .env)
 * - Production: your deployed web app URL
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000");

const TOKEN_KEY = "plate3d_token";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; formData?: FormData } = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

/* ---------- Types ---------- */

export type User = { id: string; name: string; email: string };

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  description: string;
  caption: string;
  address: string;
  phone: string;
  currency: string;
  accentColor: string;
  theme: "midnight" | "espresso" | "ivory";
  layout: "list" | "grid";
  showReel: boolean;
  logoUrl: string;
  coverUrl: string;
  isPublished: boolean;
  _count?: { items: number; categories: number };
};

export type Category = {
  id: string;
  name: string;
  sortOrder: number;
  availableFrom: string;
  availableTo: string;
  items: MenuItem[];
};

export type ModifierOption = { id: string; name: string; priceDelta: number };

export type ModifierGroup = {
  id: string;
  name: string;
  type: "single" | "multi";
  required: boolean;
  options: ModifierOption[];
};

export type ModifierGroupInput = {
  name: string;
  type: "single" | "multi";
  required: boolean;
  options: { name: string; priceDelta: number }[];
};

export type MenuItem = {
  id: string;
  name: string;
  caption: string;
  description: string;
  price: number;
  imageUrl: string;
  videoUrl: string;
  storyVideoUrl: string;
  modelUrl: string;
  modelUsdzUrl: string;
  modelStatus: "NONE" | "PROCESSING" | "READY" | "FAILED";
  soldOutDate: string;
  isVegetarian: boolean;
  isSpicy: boolean;
  isAvailable: boolean;
  categoryId: string;
  restaurantId: string;
  modifierGroups?: ModifierGroup[];
};

export type RestaurantFull = Restaurant & { categories: Category[] };

/* ---------- Auth ---------- */

export const api = {
  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: { name, email, password },
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  me: () => request<{ user: User }>("/api/me"),

  /* ---------- Restaurants ---------- */

  listRestaurants: () => request<{ restaurants: Restaurant[] }>("/api/restaurants"),

  createRestaurant: (data: Partial<Restaurant> & { name: string }) =>
    request<{ restaurant: Restaurant }>("/api/restaurants", { method: "POST", body: data }),

  getRestaurant: (id: string) =>
    request<{ restaurant: RestaurantFull }>(`/api/restaurants/${id}`),

  updateRestaurant: (id: string, data: Partial<Restaurant>) =>
    request<{ restaurant: Restaurant }>(`/api/restaurants/${id}`, { method: "PATCH", body: data }),

  deleteRestaurant: (id: string) =>
    request<{ ok: true }>(`/api/restaurants/${id}`, { method: "DELETE" }),

  getQr: (id: string) =>
    request<{ menuUrl: string; qrDataUrl: string }>(`/api/restaurants/${id}/qr?format=json`),

  /* ---------- Categories ---------- */

  createCategory: (restaurantId: string, name: string) =>
    request<{ category: Category }>(`/api/restaurants/${restaurantId}/categories`, {
      method: "POST",
      body: { name },
    }),

  updateCategory: (
    id: string,
    data: { name?: string; sortOrder?: number; availableFrom?: string; availableTo?: string }
  ) => request<{ category: Category }>(`/api/categories/${id}`, { method: "PATCH", body: data }),

  deleteCategory: (id: string) =>
    request<{ ok: true }>(`/api/categories/${id}`, { method: "DELETE" }),

  /* ---------- Items ---------- */

  createItem: (restaurantId: string, data: Partial<MenuItem> & { categoryId: string; name: string; price: number }) =>
    request<{ item: MenuItem }>(`/api/restaurants/${restaurantId}/items`, {
      method: "POST",
      body: data,
    }),

  getItem: (id: string) => request<{ item: MenuItem }>(`/api/items/${id}`),

  updateItem: (id: string, data: Partial<MenuItem> & { soldOutToday?: boolean }) =>
    request<{ item: MenuItem }>(`/api/items/${id}`, { method: "PATCH", body: data }),

  /* ---------- Modifiers ---------- */

  createModifierGroup: (itemId: string, data: ModifierGroupInput) =>
    request<{ group: ModifierGroup }>(`/api/items/${itemId}/modifier-groups`, {
      method: "POST",
      body: data,
    }),

  updateModifierGroup: (id: string, data: Partial<ModifierGroupInput>) =>
    request<{ group: ModifierGroup }>(`/api/modifier-groups/${id}`, {
      method: "PATCH",
      body: data,
    }),

  deleteModifierGroup: (id: string) =>
    request<{ ok: true }>(`/api/modifier-groups/${id}`, { method: "DELETE" }),

  /* ---------- Billing ---------- */

  billing: () =>
    request<{
      plan: "free" | "pro";
      label: string;
      limits: { maxRestaurants: number; gen3d: boolean };
      usage: { restaurants: number };
      billingConfigured: boolean;
    }>("/api/billing"),

  checkout: () => request<{ url: string }>("/api/billing/checkout", { method: "POST" }),

  billingPortal: () => request<{ url: string }>("/api/billing/portal", { method: "POST" }),

  deleteItem: (id: string) => request<{ ok: true }>(`/api/items/${id}`, { method: "DELETE" }),

  generate3d: (itemId: string) =>
    request<{ item: MenuItem }>(`/api/items/${itemId}/generate-3d`, { method: "POST" }),

  check3d: (itemId: string) =>
    request<{ item: MenuItem; progress?: number; error?: string }>(
      `/api/items/${itemId}/generate-3d`
    ),

  /** Upload a raw "how it's made" clip; the server auto-edits it. */
  uploadStoryVideo: (itemId: string, uri: string) => {
    const name = uri.split("/").pop() ?? "story.mp4";
    const mime = name.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4";
    const form = new FormData();
    form.append("file", { uri, name, type: mime } as unknown as Blob);
    return request<{ item: MenuItem; edited: boolean }>(`/api/items/${itemId}/story-video`, {
      method: "POST",
      formData: form,
    });
  },

  /* ---------- Uploads ---------- */

  upload: async (uri: string, type: "image" | "video") => {
    const name = uri.split("/").pop() ?? (type === "image" ? "photo.jpg" : "video.mp4");
    const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : type === "image" ? "jpg" : "mp4";
    const mime =
      type === "image"
        ? ext === "png"
          ? "image/png"
          : "image/jpeg"
        : ext === "mov"
          ? "video/quicktime"
          : "video/mp4";
    const form = new FormData();
    // React Native FormData accepts { uri, name, type } file descriptors
    form.append("file", { uri, name, type: mime } as unknown as Blob);
    return request<{ url: string }>("/api/upload", { method: "POST", formData: form });
  },
};

/** Turn a relative upload path into an absolute URL for display. */
export function mediaUrl(path: string): string {
  if (!path) return "";
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}
