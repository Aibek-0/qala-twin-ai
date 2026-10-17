from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from .auth import current
from .db import get_db, Product, Sale, Expense, Record
from .schemas import SaleInput, ExpenseInput, ReceiveInput
from .calculations import metrics, money

router = APIRouter(prefix="/api/v1")


@router.post("/operations/sales", status_code=201)
def record_sale(x: SaleInput, b=Depends(current), db=Depends(get_db)):
    p = db.scalar(
        select(Product).where(Product.id == x.product_id, Product.business_id == b.id)
    )
    if not p:
        raise HTTPException(404, detail="not_found")
    changed = db.execute(
        update(Product)
        .where(
            Product.id == p.id,
            Product.business_id == b.id,
            Product.stock_quantity >= x.quantity,
        )
        .values(stock_quantity=Product.stock_quantity - x.quantity)
    )
    if not changed.rowcount:
        raise HTTPException(409, detail="insufficient_stock")
    price = x.unit_price if x.unit_price is not None else p.selling_price
    sale = Sale(
        business_id=b.id,
        product_id=p.id,
        quantity=x.quantity,
        unit_price=price,
        unit_cost=p.cost_price,
        sold_at=datetime.now(ZoneInfo("Asia/Qyzylorda")).replace(tzinfo=None),
    )
    db.add(sale)
    db.commit()
    return {
        "id": sale.id,
        "revenue": money(price * x.quantity),
        "gross_profit": money((price - p.cost_price) * x.quantity),
    }


@router.post("/operations/expenses", status_code=201)
def record_expense(x: ExpenseInput, b=Depends(current), db=Depends(get_db)):
    try:
        when = datetime.fromisoformat(x.date)
    except ValueError:
        raise HTTPException(422, detail="validationError")
    e = Expense(
        business_id=b.id, category=x.category, amount=x.amount, occurred_at=when
    )
    db.add(e)
    db.commit()
    return {"id": e.id, "amount": money(e.amount)}


@router.get("/operations/expenses")
def expenses(b=Depends(current), db=Depends(get_db)):
    return [
        {
            "id": e.id,
            "category": e.category,
            "amount": money(e.amount),
            "date": e.occurred_at.date().isoformat(),
        }
        for e in db.scalars(
            select(Expense)
            .where(Expense.business_id == b.id)
            .order_by(Expense.occurred_at.desc())
            .limit(100)
        )
    ]


@router.delete("/operations/expenses/{id}")
def remove_expense(id: str, b=Depends(current), db=Depends(get_db)):
    e = db.scalar(select(Expense).where(Expense.id == id, Expense.business_id == b.id))
    if not e:
        raise HTTPException(404, detail="not_found")
    db.add(
        Record(
            business_id=b.id,
            kind="expense_deleted",
            data={
                "expense_id": e.id,
                "category": e.category,
                "amount": money(e.amount),
                "date": e.occurred_at.date().isoformat(),
            },
        )
    )
    db.delete(e)
    db.commit()
    return {"ok": True}


@router.post("/inventory/{id}/receive")
def receive(id: str, x: ReceiveInput, b=Depends(current), db=Depends(get_db)):
    result = db.execute(
        update(Product)
        .where(
            Product.id == id,
            Product.business_id == b.id,
            Product.stock_quantity <= 1000000 - x.quantity,
        )
        .values(stock_quantity=Product.stock_quantity + x.quantity)
    )
    if not result.rowcount:
        raise HTTPException(409, detail="stock_limit_or_not_found")
    db.add(
        Record(
            business_id=b.id,
            kind="stock_receipt",
            data={"product_id": id, "quantity": x.quantity},
        )
    )
    db.commit()
    return {"stock_quantity": db.get(Product, id).stock_quantity}


@router.get("/business/actions")
def actions(b=Depends(current), db=Depends(get_db)):
    m = metrics(db, b.id)
    days = max(1, len(m["daily"]))
    rank = {r["id"]: r for r in m["products"]}
    low = []
    loss = []
    budget = Decimal(0)
    for p in db.scalars(select(Product).where(Product.business_id == b.id)):
        daily = rank.get(p.id, {}).get("quantity", 0) / days
        needed = max(0, max(p.reorder_point, round(daily * 3)) - p.stock_quantity)
        if p.stock_quantity < p.reorder_point:
            cost = p.cost_price * needed
            budget += cost
            low.append(
                {
                    "id": p.id,
                    "name": p.name,
                    "name_kk": p.name_kk,
                    "stock": p.stock_quantity,
                    "daily_demand": round(daily, 1),
                    "quantity": needed,
                    "order_cost": money(cost),
                    "days_cover": round(p.stock_quantity / daily, 1) if daily else None,
                }
            )
        if p.selling_price <= p.cost_price:
            loss.append(
                {
                    "id": p.id,
                    "name": p.name,
                    "name_kk": p.name_kk,
                    "price": money(p.selling_price),
                    "cost": money(p.cost_price),
                    "unit_margin": money(p.selling_price - p.cost_price),
                }
            )
    margin = (
        Decimal(m["gross_profit"]) / Decimal(m["revenue"])
        if Decimal(m["revenue"]) > 0
        else Decimal(0)
    )
    return {
        "business_name": b.name,
        "is_demo": b.is_demo,
        "low_stock": low,
        "loss_products": loss,
        "order_budget": money(budget),
        "break_even_revenue": money(Decimal(m["expenses"]) / margin)
        if margin > 0 and Decimal(m["expenses"]) > 0
        else None,
        "margin_percent": m["margin"],
        "expense_total": m["expenses"],
        "history_days": len(m["daily"]),
        "has_sales": m["sale_count"] > 0,
        "has_products": m["product_count"] > 0,
        "lead_time_assumption": 3,
    }


@router.get("/ai/status")
def ai_status(b=Depends(current)):
    import os
    from .ai import provider_state

    configured = bool(os.getenv("OPENAI_API_KEY") and os.getenv("OPENAI_MODEL"))
    return {
        "configured": configured,
        "model": os.getenv("OPENAI_MODEL") if configured else None,
        "provider": "openai" if configured else "deterministic",
        "last_error": provider_state.get("error"),
    }


@router.get("/ai/history")
def ai_history(b=Depends(current), db=Depends(get_db)):
    rows = db.scalars(
        select(Record)
        .where(Record.business_id == b.id, Record.kind == "conversation")
        .order_by(Record.created_at.desc())
        .limit(20)
    ).all()
    return [r.data for r in reversed(rows)]
