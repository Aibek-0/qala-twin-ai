from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict


class Credentials(BaseModel):
    email: str = Field(
        min_length=5, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
    )
    password: str = Field(min_length=8, max_length=128)


class QueueInput(BaseModel):
    customers_per_hour: float = Field(default=48, gt=0, le=600)
    service_time: float = Field(default=65, ge=5, le=600)
    cashiers: int = Field(default=1, ge=1, le=8)
    labor_cost: Decimal = Field(default=Decimal("1500"), ge=0, le=100000)
    hours: int = Field(default=8, ge=1, le=24)
    seed: int = Field(default=42, ge=0, le=1000000)


class PriceInput(BaseModel):
    current_price: Decimal = Field(gt=0, le=10000000)
    purchase_cost: Decimal = Field(ge=0, le=10000000)
    average_sales: int = Field(gt=0, le=1000000)
    change_percent: float = Field(ge=-80, le=100)
    elasticity: float = Field(default=-1.2, ge=-5, le=0)


class StockInput(BaseModel):
    current_stock: int = Field(ge=0, le=1000000)
    daily_demand: float = Field(gt=0, le=100000)
    lead_time: int = Field(ge=1, le=365)
    safety_stock: int = Field(ge=0, le=100000)


class ProductInput(BaseModel):
    sku: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=160)
    name_kk: str = Field(default="", max_length=160)
    category: str = Field(default="grocery", max_length=60)
    cost_price: Decimal = Field(ge=0, le=10000000)
    selling_price: Decimal = Field(gt=0, le=10000000)
    stock_quantity: int = Field(ge=0, le=1000000)
    reorder_point: int = Field(default=20, ge=0, le=1000000)


class ChatInput(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    locale: Literal["kk", "ru"] = "kk"


class LayoutInput(BaseModel):
    cashiers: int = Field(default=2, ge=1, le=8)
    shelves: int = Field(default=8, ge=2, le=16)


class ProfileInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    city: str = Field(min_length=1, max_length=120)


class ReportInput(BaseModel):
    format: Literal["csv", "pdf"] = "csv"
    locale: Literal["kk", "ru"] = "kk"
