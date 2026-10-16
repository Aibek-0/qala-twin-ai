export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch("/api/v1" + path, {
    ...options,
    credentials: "same-origin",
    signal:
      options.signal ||
      AbortSignal.timeout(path.includes("video") ? 180000 : 30000),
    headers:
      options.body instanceof FormData
        ? options.headers
        : { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "error" }));
    throw new ApiError(
      typeof body.detail === "string"
        ? body.detail
        : body.detail?.code || "validationError",
      res.status,
    );
  }
  return res.json();
}
export function errorKey(e: unknown) {
  return e instanceof ApiError ? e.code : "error";
}
export function fmt(
  v: string | number | null,
  locale: string,
  currency = false,
) {
  if (v === null || v === undefined) return "—";
  return (
    new Intl.NumberFormat(locale === "kk" ? "kk-KZ" : "ru-RU", {
      maximumFractionDigits: currency ? 0 : 1,
    }).format(Number(v)) + (currency ? " ₸" : "")
  );
}
export interface Business {
  business_id: string;
  name: string;
  city: string;
  is_demo: boolean;
  auth_configured?: boolean;
}
export interface Day {
  date: string;
  revenue: string;
  profit?: string;
  quantity?: number;
  lower?: string;
  upper?: string;
}
export interface Rank {
  id: string;
  name: string;
  name_kk: string;
  revenue: string;
  gross_profit: string;
  quantity: number;
}
export interface Forecast {
  available: boolean;
  days: Day[];
  backtest_mae?: string;
  method?: string;
}
export interface Overview {
  revenue: string;
  gross_profit: string;
  net_profit: string | null;
  expenses: string;
  cost: string;
  margin: number;
  growth: number | null;
  health_score: number | null;
  low_stock: number;
  product_count: number;
  sale_count: number;
  daily: Day[];
  products: Rank[];
  forecast: Forecast;
  occupancy: number;
  occupancy_source: string;
  is_demo: boolean;
  period: { start: string | null; end: string | null };
}
export interface Product {
  id: string;
  sku: string;
  name: string;
  name_kk: string;
  category: string;
  cost_price: string;
  selling_price: string;
  stock_quantity: number;
  reorder_point: number;
  daily_demand?: number;
  low_stock?: boolean;
  suggested_reorder?: number;
}
export interface TwinState {
  occupancy: number;
  measurement: string;
  stale: boolean;
  updated_at?: string;
  coordinates_available: boolean;
}
export interface Layout {
  cashiers: number;
  shelves: number;
  version: number;
}
