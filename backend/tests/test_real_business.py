from decimal import Decimal
from sqlalchemy import select
from backend.app.db import User


def register(client, email="owner@example.kz"):
    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Test-password-2026",
            "business_name": "Real Shop",
            "city": "Taraz",
        },
    )
    assert r.status_code == 200, r.text
    assert not r.json()["is_demo"]
    return r.json()


def add_product(client, stock=10, price="1000.00", cost="600.00"):
    r = client.post(
        "/api/v1/inventory",
        json={
            "sku": "REAL-001",
            "name": "Real product",
            "name_kk": "Real product",
            "cost_price": cost,
            "selling_price": price,
            "stock_quantity": stock,
            "reorder_point": 8,
        },
    )
    assert r.status_code == 201, r.text
    return r.json()


def test_real_account_persists_and_password_hashed(client, db):
    b = register(client)
    assert client.get("/api/v1/inventory").json() == []
    assert client.get("/api/v1/dashboard/overview").json()["revenue"] == "0.00"
    user = db.scalar(select(User).where(User.email == "owner@example.kz"))
    assert user.password_hash.startswith("pbkdf2_sha256$600000$")
    assert "Test-password" not in user.password_hash
    client.post("/api/v1/auth/logout")
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "OWNER@EXAMPLE.KZ", "password": "Test-password-2026"},
    )
    assert r.status_code == 200
    assert r.json()["business_id"] == b["business_id"]
    assert r.json()["name"] == "Real Shop"
    assert (
        client.post(
            "/api/v1/auth/login",
            json={"email": "owner@example.kz", "password": "wrong-password"},
        ).status_code
        == 400
    )


def test_duplicate_registration(client):
    register(client)
    r = client.post(
        "/api/v1/auth/register",
        json={"email": "owner@example.kz", "password": "Test-password-2026"},
    )
    assert r.status_code == 409


def test_sale_reduces_stock_and_expense_reduces_net(client):
    register(client)
    p = add_product(client)
    r = client.post(
        "/api/v1/operations/sales", json={"product_id": p["id"], "quantity": 3}
    )
    assert r.status_code == 201
    assert r.json()["revenue"] == "3000.00"
    assert r.json()["gross_profit"] == "1200.00"
    assert client.get("/api/v1/inventory").json()[0]["stock_quantity"] == 7
    assert (
        client.post(
            "/api/v1/operations/expenses",
            json={"category": "rent", "amount": "500.00", "date": "2026-10-17"},
        ).status_code
        == 201
    )
    m = client.get("/api/v1/dashboard/overview").json()
    assert m["net_profit"] == "700.00"
    r = client.post(
        "/api/v1/operations/sales", json={"product_id": p["id"], "quantity": 8}
    )
    assert r.status_code == 409
    assert client.get("/api/v1/dashboard/overview").json()["revenue"] == "3000.00"


def test_receipt_resolves_stock_problem(client):
    register(client)
    p = add_product(client, stock=2)
    a = client.get("/api/v1/business/actions").json()
    assert len(a["low_stock"]) == 1
    assert a["low_stock"][0]["quantity"] == 6
    assert a["order_budget"] == "3600.00"
    assert (
        client.post(
            "/api/v1/inventory/" + p["id"] + "/receive", json={"quantity": 6}
        ).status_code
        == 200
    )
    assert client.get("/api/v1/business/actions").json()["low_stock"] == []
    assert client.get("/api/v1/inventory").json()[0]["stock_quantity"] == 8


def test_negative_margin_and_break_even(client):
    register(client)
    p = add_product(client, price="500.00", cost="600.00")
    assert len(client.get("/api/v1/business/actions").json()["loss_products"]) == 1
    update = {**p, "selling_price": "1000.00"}
    assert client.patch("/api/v1/inventory/" + p["id"], json=update).status_code == 200
    client.post("/api/v1/operations/sales", json={"product_id": p["id"], "quantity": 1})
    r = client.post(
        "/api/v1/operations/expenses",
        json={"category": "rent", "amount": "500.00", "date": "2026-10-17"},
    )
    assert (
        client.get("/api/v1/business/actions").json()["break_even_revenue"] == "1250.00"
    )
    assert (
        client.delete("/api/v1/operations/expenses/" + r.json()["id"]).status_code
        == 200
    )
    assert client.get("/api/v1/dashboard/overview").json()["net_profit"] is None


def test_real_tenants_cannot_touch_other_business(client):
    register(client)
    p = add_product(client)
    client.post("/api/v1/auth/logout")
    register(client, "other@example.kz")
    assert (
        client.post(
            "/api/v1/operations/sales", json={"product_id": p["id"], "quantity": 1}
        ).status_code
        == 404
    )
    assert (
        client.post(
            "/api/v1/inventory/" + p["id"] + "/receive", json={"quantity": 1}
        ).status_code
        == 409
    )
    assert client.get("/api/v1/inventory").json() == []


def test_advisor_history_is_persistent_and_tenant_scoped(client):
    register(client)
    r = client.post(
        "/api/v1/ai/chat", json={"question": "What should I improve?", "locale": "kk"}
    )
    assert r.status_code == 200
    assert len(client.get("/api/v1/ai/history").json()) == 1
    client.post("/api/v1/auth/logout")
    register(client, "other@example.kz")
    assert client.get("/api/v1/ai/history").json() == []
