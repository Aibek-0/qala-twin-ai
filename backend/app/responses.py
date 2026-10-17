from typing import Literal
from pydantic import BaseModel, Field


class BusinessOut(BaseModel):
    business_id: str
    name: str
    city: str
    is_demo: bool
    auth_configured: bool | None = None


class DayOut(BaseModel):
    date: str
    revenue: str
    profit: str | None = None
    quantity: int | None = None
    lower: str | None = None
    upper: str | None = None


class RankingOut(BaseModel):
    id: str
    name: str
    name_kk: str
    revenue: str
    gross_profit: str
    quantity: int


class ForecastOut(BaseModel):
    available: bool
    days: list[DayOut]
    method: str | None = None
    backtest_mae: str | None = None
    minimum_days: int | None = None
    reason: str | None = None


class MetricsOut(BaseModel):
    revenue: str
    cost: str
    gross_profit: str
    expenses: str
    net_profit: str | None
    margin: float
    growth: float | None
    health_score: int | None
    low_stock: int
    product_count: int
    sale_count: int
    daily: list[DayOut]
    products: list[RankingOut]


class OverviewOut(MetricsOut):
    forecast: ForecastOut
    occupancy: int
    occupancy_source: str
    is_demo: bool
    business: dict[str, str]
    period: dict[str, str | None]


class ProductOut(BaseModel):
    id: str
    sku: str
    name: str
    name_kk: str
    category: str
    cost_price: str
    selling_price: str
    stock_quantity: int
    reorder_point: int
    daily_demand: float
    low_stock: bool
    suggested_reorder: int


class QueueScenarioOut(BaseModel):
    cashiers: int
    average_wait_seconds: float
    average_queue: float
    peak_queue: int
    served_customers: int
    arrivals: int
    operational_cost: str
    utilization: float


class QueueOut(BaseModel):
    before: QueueScenarioOut
    after: QueueScenarioOut
    wait_reduction_percent: float
    seed: int
    method: str
    measurement: Literal["simulation"]
    assumptions: list[str]


class TwinOut(BaseModel):
    occupancy: int
    measurement: str
    updated_at: str | None = None
    stale: bool
    coordinates_available: bool


class LayoutOut(BaseModel):
    cashiers: int
    shelves: int
    version: int


class ChatOut(BaseModel):
    provider_error: str | None = None
    answer: str
    explanation: str | None = None
    mode: Literal["deterministic", "openai_explanation"]
    locale: Literal["kk", "ru"]
    evidence: dict
    data_source: Literal["demo", "imported"]


class ImportOut(BaseModel):
    headers: list[str]
    missing: list[str]
    preview: list[dict]
    errors: list[dict]
    valid_count: int = 0
    rejected_count: int = 0
    committed: bool
