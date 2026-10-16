import os
from decimal import Decimal
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import (
    create_engine,
    String,
    Numeric,
    Integer,
    DateTime,
    JSON,
    Index,
    ForeignKey,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./qala.db")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {},
    pool_pre_ping=True,
)
Session = sessionmaker(engine, expire_on_commit=False)


def uid():
    return str(uuid4())


def now():
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class Business(Base):
    __tablename__ = "businesses"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    owner_id: Mapped[str] = mapped_column(String(100), index=True)
    name: Mapped[str] = mapped_column(String(120), default="QALA MART")
    city: Mapped[str] = mapped_column(String(120), default="Taraz")
    is_demo: Mapped[bool] = mapped_column(default=False)


class Product(Base):
    __tablename__ = "products"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    business_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("businesses.id"), index=True
    )
    sku: Mapped[str] = mapped_column(String(80))
    name: Mapped[str] = mapped_column(String(160))
    name_kk: Mapped[str] = mapped_column(String(160), default="")
    category: Mapped[str] = mapped_column(String(60), default="grocery")
    cost_price: Mapped[Decimal] = mapped_column(Numeric(16, 2))
    selling_price: Mapped[Decimal] = mapped_column(Numeric(16, 2))
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    reorder_point: Mapped[int] = mapped_column(Integer, default=20)


class Sale(Base):
    __tablename__ = "sales"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    business_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("businesses.id"), index=True
    )
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id"), index=True
    )
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(16, 2))
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(16, 2))
    sold_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    __table_args__ = (Index("ix_sales_business_time", "business_id", "sold_at"),)


class Expense(Base):
    __tablename__ = "expenses"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    business_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("businesses.id"), index=True
    )
    category: Mapped[str] = mapped_column(String(60))
    amount: Mapped[Decimal] = mapped_column(Numeric(16, 2))
    occurred_at: Mapped[datetime] = mapped_column(DateTime)


class Record(Base):
    """Versioned tenant-scoped events, simulations, layouts, imports and reports."""

    __tablename__ = "records"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    business_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("businesses.id"), index=True
    )
    kind: Mapped[str] = mapped_column(String(40), index=True)
    data: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


def get_db():
    with Session() as db:
        yield db
