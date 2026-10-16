import io, csv
from decimal import Decimal
from datetime import datetime
import pytest
from pydantic import ValidationError
from openpyxl import Workbook
from backend.app.schemas import QueueInput, PriceInput, StockInput
from backend.app.calculations import queue_simulation, forecast, pricing, stock, metrics
from backend.app.db import Business, Product, Sale, Expense


def test_money_and_profit(db):
    b = Business(owner_id="test")
    db.add(b)
    db.flush()
    p = Product(
        business_id=b.id,
        sku="x",
        name="x",
        cost_price=Decimal("0.10"),
        selling_price=Decimal("0.30"),
    )
    db.add(p)
    db.flush()
    db.add(
        Sale(
            business_id=b.id,
            product_id=p.id,
            quantity=3,
            unit_price=Decimal("0.30"),
            unit_cost=Decimal("0.10"),
            sold_at=datetime(2026, 10, 16),
        )
    )
    db.flush()
    m = metrics(db, b.id)
    assert m["revenue"] == "0.90"
    assert m["gross_profit"] == "0.60"
    assert m["net_profit"] is None
    db.add(
        Expense(
            business_id=b.id,
            category="test",
            amount=Decimal("0.20"),
            occurred_at=datetime(2026, 10, 16),
        )
    )
    db.flush()
    assert metrics(db, b.id)["net_profit"] == "0.40"


def test_queue_reproducible_and_extra_cashier():
    x = QueueInput()
    a = queue_simulation(x)
    b = queue_simulation(x)
    assert a == b
    assert a["after"]["average_wait_seconds"] < a["before"]["average_wait_seconds"]
    assert a["after"]["operational_cost"] == "24000.00"
    assert a["before"]["operational_cost"] == "12000.00"
    assert a["after"]["arrivals"] == a["before"]["arrivals"]
    assert a["after"]["served_customers"] <= a["after"]["arrivals"]


@pytest.mark.parametrize(
    "values",
    [
        {"service_time": 0},
        {"customers_per_hour": -1},
        {"cashiers": 0},
        {"hours": 25},
        {"seed": -1},
    ],
)
def test_queue_validation(values):
    with pytest.raises(ValidationError):
        QueueInput(**values)


def test_forecast_insufficient_and_holdout():
    assert not forecast([])["available"]
    from datetime import timedelta

    days = [
        {
            "date": (datetime(2026, 10, 1) + timedelta(days=i)).date().isoformat(),
            "revenue": "100.00",
        }
        for i in range(14)
    ]
    f = forecast(days)
    assert len(f["days"]) == 7
    assert f["backtest_mae"] == "0.00"
    assert f["days"][0]["date"] == "2026-10-15"


def test_price_scenario():
    r = pricing(
        PriceInput(
            current_price="100",
            purchase_cost="60",
            average_sales=100,
            change_percent=10,
            elasticity=0,
        )
    )
    assert r["before"]["gross_profit"] == "4000.00"
    assert r["after"]["gross_profit"] == "5000.00"


def test_stock():
    r = stock(
        StockInput(current_stock=12, daily_demand=18, lead_time=3, safety_stock=20)
    )
    assert r["reorder_quantity"] == 62
    assert r["stockout_risk"]


def test_auth_required(client):
    for route in [
        "/dashboard/overview",
        "/inventory",
        "/analytics/sales",
        "/twin/state",
        "/reports",
    ]:
        assert client.get("/api/v1" + route).status_code == 401
    client.cookies.set("qala_session", "forged")
    assert client.get("/api/v1/auth/me").status_code == 401


def test_demo_consistency(demo):
    m = demo.get("/api/v1/dashboard/overview").json()
    sales = demo.get("/api/v1/analytics/sales").json()
    assert len(m["daily"]) == 30
    assert m["product_count"] == 48
    total = sum(Decimal(s["unit_price"]) * s["quantity"] for s in sales)
    assert total == Decimal(m["revenue"])
    assert sum(Decimal(d["revenue"]) for d in m["daily"]) == total
    assert Decimal(m["net_profit"]) == Decimal(m["gross_profit"]) - Decimal(
        m["expenses"]
    )


def test_import_preview_commit_and_duplicate(demo):
    content = b"date,product_name,quantity,unit_price,unit_cost\n2026-10-16,Imported,3,100.10,60.20\n"
    before = Decimal(demo.get("/api/v1/dashboard/overview").json()["revenue"])
    r = demo.post(
        "/api/v1/analytics/import", files={"file": ("test.csv", content, "text/csv")}
    )
    assert r.status_code == 200
    assert r.json()["valid_count"] == 1
    assert Decimal(demo.get("/api/v1/dashboard/overview").json()["revenue"]) == before
    r = demo.post(
        "/api/v1/analytics/import",
        files={"file": ("test.csv", content)},
        data={"commit": "true"},
    )
    assert r.status_code == 200
    assert Decimal(
        demo.get("/api/v1/dashboard/overview").json()["revenue"]
    ) == before + Decimal("300.30")
    assert (
        demo.post(
            "/api/v1/analytics/import",
            files={"file": ("test.csv", content)},
            data={"commit": "true"},
        ).status_code
        == 409
    )


def test_invalid_import_is_atomic(demo):
    content = b"date,product_name,quantity,unit_price,unit_cost\n2026-10-16,X,1,100,60\n2026-10-16,Y,-1,100,60\n"
    before = demo.get("/api/v1/dashboard/overview").json()["revenue"]
    r = demo.post(
        "/api/v1/analytics/import",
        files={"file": ("bad.csv", content)},
        data={"commit": "true"},
    )
    assert r.status_code == 422
    assert demo.get("/api/v1/dashboard/overview").json()["revenue"] == before


def test_xlsx_and_mapping(demo):
    wb = Workbook()
    ws = wb.active
    ws.append(["day", "name", "count", "price", "cost"])
    ws.append(["2026-10-16", "Imported", 2, 500, 300])
    out = io.BytesIO()
    wb.save(out)
    import json

    r = demo.post(
        "/api/v1/analytics/import",
        files={"file": ("test.xlsx", out.getvalue())},
        data={
            "mapping": json.dumps(
                dict(
                    zip(
                        ["date", "product_name", "quantity", "unit_price", "unit_cost"],
                        ["day", "name", "count", "price", "cost"],
                    )
                )
            )
        },
    )
    assert r.status_code == 200
    assert r.json()["valid_count"] == 1


def test_tenant_isolation_and_layout(demo):
    first_id = demo.get("/api/v1/inventory").json()[0]["id"]
    demo.post("/api/v1/auth/demo")
    assert demo.delete("/api/v1/inventory/" + first_id).status_code == 404
    assert (
        demo.patch(
            "/api/v1/twin/layout", json={"cashiers": 3, "shelves": 10}
        ).status_code
        == 200
    )
    assert demo.get("/api/v1/twin/layout").json()["cashiers"] == 3


def test_localized_advisor(demo):
    for locale, question in [
        ("kk", "Қай тауар көп пайда әкеледі?"),
        ("ru", "Какой товар приносит прибыль?"),
    ]:
        r = demo.post("/api/v1/ai/chat", json={"question": question, "locale": locale})
        assert r.status_code == 200
        d = r.json()
        assert d["mode"] == "deterministic"
        assert d["locale"] == locale
        assert d["answer"]
        assert d["evidence"]["revenue"]


def test_reports_csv_pdf_and_authorization(demo):
    for fmt in ["csv", "pdf"]:
        r = demo.post("/api/v1/reports/generate", json={"format": fmt, "locale": "kk"})
        assert r.status_code == 200
        url = r.json()["download_url"]
        report = demo.get(url)
        assert report.status_code == 200
        if fmt == "pdf":
            assert report.content.startswith(b"%PDF")
        else:
            assert b"revenue_KZT" in report.content
        demo.post("/api/v1/auth/demo")
        assert demo.get(url).status_code == 404


def test_origin_protection(demo):
    assert (
        demo.post(
            "/api/v1/auth/demo", headers={"Origin": "https://evil.example"}
        ).status_code
        == 403
    )


def test_vision_disabled_is_honest(demo, monkeypatch):
    monkeypatch.setenv("VISION_ENABLED", "false")
    r = demo.post("/api/v1/vision/analyze-frame", files={"file": ("frame.jpg", b"no")})
    assert r.status_code == 503
    assert r.json()["detail"] == "vision_not_configured"


def test_date_range_validation(demo):
    assert (
        demo.get(
            "/api/v1/dashboard/overview?start=2026-10-20&end=2026-10-01"
        ).status_code
        == 422
    )
