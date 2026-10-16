from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP
from datetime import timedelta
import random, math, heapq
from sqlalchemy import select
from .db import Sale, Expense, Product


def money(v):
    return str(Decimal(v).quantize(Decimal(".01"), rounding=ROUND_HALF_UP))


def metrics(db, business_id, start=None, end=None):
    query = select(Sale).where(Sale.business_id == business_id)
    eq = select(Expense).where(Expense.business_id == business_id)
    if start:
        query = query.where(Sale.sold_at >= start)
        eq = eq.where(Expense.occurred_at >= start)
    if end:
        query = query.where(Sale.sold_at < end)
        eq = eq.where(Expense.occurred_at < end)
    sales = db.scalars(query).all()
    expenses = db.scalars(eq).all()
    products = db.scalars(
        select(Product).where(Product.business_id == business_id)
    ).all()
    revenue = Decimal(0)
    cost = Decimal(0)
    daily = defaultdict(lambda: [Decimal(0), Decimal(0), 0])
    ranking = defaultdict(lambda: [Decimal(0), Decimal(0), 0])
    for s in sales:
        r = s.unit_price * s.quantity
        c = s.unit_cost * s.quantity
        revenue += r
        cost += c
        key = s.sold_at.date().isoformat()
        daily[key][0] += r
        daily[key][1] += r - c
        daily[key][2] += s.quantity
        ranking[s.product_id][0] += r
        ranking[s.product_id][1] += r - c
        ranking[s.product_id][2] += s.quantity
    if daily:
        from datetime import date

        lo = date.fromisoformat(min(daily))
        hi = date.fromisoformat(max(daily))
        for n in range((hi - lo).days + 1):
            daily[(lo + timedelta(days=n)).isoformat()]
    expense = sum((e.amount for e in expenses), Decimal(0))
    gross = revenue - cost
    low = sum(p.stock_quantity < p.reorder_point for p in products)
    ordered = sorted(daily.items())
    previous = sum((v[0] for _, v in ordered[-14:-7]), Decimal(0))
    recent = sum((v[0] for _, v in ordered[-7:]), Decimal(0))
    growth = float((recent / previous - 1) * 100) if previous else None
    score = (
        round(
            max(
                0,
                min(
                    100,
                    100
                    - float(expense / revenue) * 35
                    - low / max(1, len(products)) * 30
                    - max(0, -(growth or 0)) * 0.5
                    - 8,
                ),
            )
        )
        if revenue
        else None
    )
    ranks = [
        {
            "id": p.id,
            "name": p.name,
            "name_kk": p.name_kk,
            "revenue": money(ranking[p.id][0]),
            "gross_profit": money(ranking[p.id][1]),
            "quantity": ranking[p.id][2],
        }
        for p in products
    ]
    return {
        "revenue": money(revenue),
        "cost": money(cost),
        "gross_profit": money(gross),
        "expenses": money(expense),
        "net_profit": money(gross - expense) if expenses else None,
        "margin": round(float(gross / revenue * 100), 1) if revenue else 0,
        "growth": round(growth, 1) if growth is not None else None,
        "health_score": score,
        "low_stock": low,
        "product_count": len(products),
        "sale_count": len(sales),
        "daily": [
            {"date": k, "revenue": money(v[0]), "profit": money(v[1]), "quantity": v[2]}
            for k, v in ordered
        ],
        "products": sorted(
            ranks, key=lambda x: Decimal(x["gross_profit"]), reverse=True
        ),
    }


def forecast(daily):
    if len(daily) < 14:
        return {
            "available": False,
            "reason": "insufficient_history",
            "minimum_days": 14,
            "days": [],
        }
    # Seasonal naive: same weekday one week earlier; rolling holdout MAE.
    values = [Decimal(d["revenue"]) for d in daily]
    mae = sum(
        (abs(values[i] - values[i - 7]) for i in range(7, len(values))), Decimal(0)
    ) / Decimal(len(values) - 7)
    from datetime import date

    last = date.fromisoformat(daily[-1]["date"])
    return {
        "available": True,
        "method": "seasonal_naive_7",
        "backtest_mae": money(mae),
        "days": [
            {
                "date": (last + timedelta(days=i + 1)).isoformat(),
                "revenue": money(values[-7 + i]),
                "lower": money(max(Decimal(0), values[-7 + i] - mae * 2)),
                "upper": money(values[-7 + i] + mae * 2),
            }
            for i in range(7)
        ],
    }


def queue_simulation(x):
    # Same Poisson arrivals and exponential service draws for every staffing scenario.
    rng = random.Random(x.seed)
    arrivals = []
    t = 0.0
    horizon = x.hours * 3600
    while True:
        t += rng.expovariate(x.customers_per_hour / 3600)
        if t >= horizon:
            break
        arrivals.append((t, rng.expovariate(1 / x.service_time)))

    def run(n):
        available = [0.0] * n
        heapq.heapify(available)
        waits = []
        completed = 0
        events = []
        for arrival, service in arrivals:
            ready = heapq.heappop(available)
            begin = max(arrival, ready)
            finish = begin + service
            heapq.heappush(available, finish)
            waits.append(begin - arrival)
            if finish <= horizon:
                completed += 1
            if begin > arrival:
                events.extend([(arrival, 1), (begin, -1)])
        q = 0
        area = 0.0
        last = 0.0
        peak = 0
        for when, delta in sorted(events):
            if when > horizon:
                break
            area += q * (when - last)
            q += delta
            last = when
            peak = max(peak, q)
        area += q * (horizon - last)
        return {
            "cashiers": n,
            "average_wait_seconds": round(sum(waits) / max(1, len(waits)), 1),
            "average_queue": round(area / horizon, 2),
            "peak_queue": peak,
            "served_customers": completed,
            "arrivals": len(arrivals),
            "operational_cost": money(x.labor_cost * n * x.hours),
            "utilization": round(
                min(100, x.customers_per_hour * x.service_time / (n * 36)), 1
            ),
        }

    before = run(x.cashiers)
    after = run(min(8, x.cashiers + 1))
    return {
        "before": before,
        "after": after,
        "wait_reduction_percent": round(
            (1 - after["average_wait_seconds"] / before["average_wait_seconds"]) * 100,
            1,
        )
        if before["average_wait_seconds"]
        else 0,
        "seed": x.seed,
        "method": "discrete_event_poisson_exponential",
        "measurement": "simulation",
        "assumptions": [
            "Poisson arrivals",
            "Exponential service",
            "FIFO; no abandonment",
            "8 hour default horizon",
        ],
    }


def pricing(x):
    factor = Decimal(str(1 + x.change_percent / 100))
    price = x.current_price * factor
    demand = max(0, round(x.average_sales * float(factor) ** x.elasticity))
    return {
        "before": {
            "revenue": money(x.current_price * x.average_sales),
            "gross_profit": money(
                (x.current_price - x.purchase_cost) * x.average_sales
            ),
            "demand": x.average_sales,
        },
        "after": {
            "price": money(price),
            "revenue": money(price * demand),
            "gross_profit": money((price - x.purchase_cost) * demand),
            "demand": demand,
        },
        "measurement": "assumption_scenario",
    }


def stock(x):
    needed = math.ceil(x.daily_demand * x.lead_time) + x.safety_stock
    return {
        "forecast_demand": math.ceil(x.daily_demand * x.lead_time),
        "reorder_point": needed,
        "reorder_quantity": max(0, needed - x.current_stock),
        "days_cover": round(x.current_stock / x.daily_demand, 1),
        "stockout_risk": x.current_stock < x.daily_demand * x.lead_time,
        "measurement": "assumption_scenario",
    }
