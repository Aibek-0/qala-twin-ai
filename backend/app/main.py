import csv, io, os, json, time, hashlib
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path
from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Request,
    Response,
    UploadFile,
    File,
    Form,
    Query,
)
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, delete
from .db import Base, engine, get_db, Session, Business, Product, Sale, Expense, Record
from .seed import seed_demo
from .auth import current, issue, clone_demo, authenticate, COOKIE
from .schemas import (
    Credentials,
    QueueInput,
    PriceInput,
    StockInput,
    ProductInput,
    ChatInput,
    LayoutInput,
    ProfileInput,
    ReportInput,
)
from .calculations import metrics, forecast, queue_simulation, pricing, stock, money
from .importer import parse_file, LIMIT, REQUIRED
from .responses import (
    BusinessOut,
    OverviewOut,
    DayOut,
    RankingOut,
    ForecastOut,
    ProductOut,
    QueueOut,
    TwinOut,
    LayoutOut,
    ChatOut,
    ImportOut,
)


@asynccontextmanager
async def lifespan(app):
    Base.metadata.create_all(engine)
    with Session() as db:
        seed_demo(db)
    yield


app = FastAPI(title="QALA TWIN AI", version="1.0.0", lifespan=lifespan)
origins = os.getenv(
    "CORS_ORIGINS", "http://127.0.0.1:3000,http://localhost:3000"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)
requests = defaultdict(deque)


@app.middleware("http")
async def guard(request, call_next):
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        origin = request.headers.get("origin")
        if origin and origin not in origins:
            return JSONResponse({"detail": "origin_not_allowed"}, status_code=403)
        if int(request.headers.get("content-length", "0") or 0) > 55 * 1024 * 1024:
            return JSONResponse({"detail": "file_too_large"}, status_code=413)
    if request.url.path.startswith("/api/v1/auth/") or request.method == "POST":
        key = (request.client.host if request.client else "unknown", request.url.path)
        q = requests[key]
        now = time.monotonic()
        while q and q[0] < now - 60:
            q.popleft()
        if len(q) >= 60:
            return JSONResponse({"detail": "rate_limited"}, status_code=429)
        q.append(now)
        if len(requests) > 10000:
            for k in list(requests):
                if not requests[k] or requests[k][-1] < now - 60:
                    del requests[k]
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "no-store"
    return response


P = "/api/v1"


@app.get("/health")
def health():
    with engine.connect() as conn:
        from sqlalchemy import text

        conn.execute(text("SELECT 1"))
    return {
        "status": "ok",
        "database": engine.dialect.name,
        "vision_enabled": os.getenv("VISION_ENABLED", "false") == "true",
    }


@app.post(P + "/auth/demo", response_model=BusinessOut)
def demo(response: Response, db=Depends(get_db)):
    return issue(response, clone_demo(db))


@app.post(P + "/auth/login")
async def login(x: Credentials, response: Response, db=Depends(get_db)):
    owner = await authenticate(x, db)
    b = db.scalar(select(Business).where(Business.owner_id == owner))
    if not b:
        b = Business(owner_id=owner, name="My business", city="Taraz")
        db.add(b)
        db.commit()
    return issue(response, b)


@app.post(P + "/auth/register")
async def register(x: Credentials, response: Response, db=Depends(get_db)):
    owner = await authenticate(x, db, True)
    if owner is None:
        return {"confirmation_required": True}
    b = db.scalar(select(Business).where(Business.owner_id == owner))
    if not b:
        b = Business(
            owner_id=owner, name=x.business_name.strip() or "My business", city=x.city
        )
        db.add(b)
        db.commit()
    return issue(response, b)


@app.get(P + "/auth/me", response_model=BusinessOut)
def me(b=Depends(current)):
    return {
        "business_id": b.id,
        "name": b.name,
        "city": b.city,
        "is_demo": b.is_demo,
        "auth_configured": bool(os.getenv("SUPABASE_URL")),
    }


@app.post(P + "/auth/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE, path="/")
    return {"ok": True}


def period(start, end):
    try:
        a = datetime.fromisoformat(start) if start else None
        z = datetime.fromisoformat(end) + timedelta(days=1) if end else None
        if a and z and a >= z:
            raise ValueError()
        return a, z
    except ValueError:
        raise HTTPException(422, detail="invalid_date_range")


@app.get(P + "/dashboard/overview", response_model=OverviewOut)
def overview(
    start: str | None = None,
    end: str | None = None,
    b=Depends(current),
    db=Depends(get_db),
):
    a, z = period(start, end)
    m = metrics(db, b.id, a, z)
    state = twin_state(b, db)
    return {
        **m,
        "forecast": forecast(m["daily"]),
        "occupancy": state["occupancy"],
        "occupancy_source": state["measurement"],
        "is_demo": b.is_demo,
        "business": {"name": b.name, "city": b.city},
        "period": {
            "start": m["daily"][0]["date"] if m["daily"] else None,
            "end": m["daily"][-1]["date"] if m["daily"] else None,
        },
    }


@app.get(P + "/dashboard/revenue", response_model=list[DayOut])
def revenue(b=Depends(current), db=Depends(get_db)):
    return metrics(db, b.id)["daily"]


@app.get(P + "/analytics/sales")
def sales(b=Depends(current), db=Depends(get_db)):
    products = {
        p.id: p for p in db.scalars(select(Product).where(Product.business_id == b.id))
    }
    rows = db.scalars(
        select(Sale)
        .where(Sale.business_id == b.id)
        .order_by(Sale.sold_at.desc())
        .limit(10000)
    )
    return [
        {
            "id": s.id,
            "date": s.sold_at.isoformat(),
            "product_name": products[s.product_id].name,
            "quantity": s.quantity,
            "unit_price": money(s.unit_price),
            "unit_cost": money(s.unit_cost),
        }
        for s in rows
    ]


@app.get(P + "/analytics/products", response_model=list[RankingOut])
def product_ranking(b=Depends(current), db=Depends(get_db)):
    return metrics(db, b.id)["products"]


@app.get(P + "/analytics/forecast", response_model=ForecastOut)
def forecasting(b=Depends(current), db=Depends(get_db)):
    return forecast(metrics(db, b.id)["daily"])


@app.post(P + "/analytics/import", response_model=ImportOut)
async def import_sales(
    file: UploadFile = File(...),
    mapping: str = Form("{}"),
    commit: bool = Form(False),
    b=Depends(current),
    db=Depends(get_db),
):
    content = await file.read(LIMIT + 1)
    try:
        columns = json.loads(mapping)
        if not isinstance(columns, dict) or any(
            not isinstance(k, str) or not isinstance(v, str) for k, v in columns.items()
        ):
            raise ValueError()
    except (ValueError, TypeError):
        raise HTTPException(422, detail="invalid_mapping")
    result = parse_file(content, file.filename or "", columns or None)
    digest = hashlib.sha256(
        content + json.dumps(columns, sort_keys=True).encode()
    ).hexdigest()
    if commit:
        if result["missing"] or result["errors"] or not result["valid_rows"]:
            raise HTTPException(
                422,
                detail={
                    "code": "import_has_errors",
                    "errors": result["errors"],
                    "missing": result["missing"],
                },
            )
        for previous in db.scalars(
            select(Record).where(Record.business_id == b.id, Record.kind == "import")
        ):
            if previous.data.get("digest") == digest:
                raise HTTPException(409, detail="already_imported")
        by_name = {
            p.name: p
            for p in db.scalars(select(Product).where(Product.business_id == b.id))
        }
        for row in result["valid_rows"]:
            p = by_name.get(row["product_name"])
            if not p:
                p = Product(
                    business_id=b.id,
                    sku="IMP-"
                    + hashlib.sha256(row["product_name"].encode()).hexdigest()[:12],
                    name=row["product_name"],
                    cost_price=Decimal(row["unit_cost"]),
                    selling_price=Decimal(row["unit_price"]),
                    stock_quantity=0,
                )
                db.add(p)
                db.flush()
                by_name[p.name] = p
            db.add(
                Sale(
                    business_id=b.id,
                    product_id=p.id,
                    quantity=row["quantity"],
                    unit_price=Decimal(row["unit_price"]),
                    unit_cost=Decimal(row["unit_cost"]),
                    sold_at=datetime.fromisoformat(row["date"]),
                )
            )
        db.add(
            Record(
                business_id=b.id,
                kind="import",
                data={
                    "digest": digest,
                    "filename": file.filename,
                    "imported_count": len(result["valid_rows"]),
                },
            )
        )
        db.commit()
    result.pop("valid_rows", None)
    return {**result, "committed": commit}


def save_sim(kind, x, result, b, db):
    db.add(
        Record(
            business_id=b.id,
            kind="simulation",
            data={
                "scenario": kind,
                "input": x.model_dump(mode="json"),
                "result": result,
            },
        )
    )
    db.commit()
    return result


@app.post(P + "/simulator/queue", response_model=QueueOut)
def queue(x: QueueInput, b=Depends(current), db=Depends(get_db)):
    return save_sim("queue", x, queue_simulation(x), b, db)


@app.post(P + "/simulator/pricing")
def price(x: PriceInput, b=Depends(current), db=Depends(get_db)):
    return save_sim("pricing", x, pricing(x), b, db)


@app.post(P + "/simulator/inventory")
def inventory_sim(x: StockInput, b=Depends(current), db=Depends(get_db)):
    return save_sim("inventory", x, stock(x), b, db)


def product_dict(p, demand=0):
    return {
        "id": p.id,
        "sku": p.sku,
        "name": p.name,
        "name_kk": p.name_kk,
        "category": p.category,
        "cost_price": money(p.cost_price),
        "selling_price": money(p.selling_price),
        "stock_quantity": p.stock_quantity,
        "reorder_point": p.reorder_point,
        "daily_demand": round(demand, 1),
        "low_stock": p.stock_quantity < p.reorder_point,
        "suggested_reorder": max(
            0, max(p.reorder_point, round(demand * 3)) - p.stock_quantity
        ),
    }


@app.get(P + "/inventory", response_model=list[ProductOut])
def inventory(b=Depends(current), db=Depends(get_db)):
    m = metrics(db, b.id)
    days = max(1, len(m["daily"]))
    demand = {p["id"]: p["quantity"] / days for p in m["products"]}
    return [
        product_dict(p, demand.get(p.id, 0))
        for p in db.scalars(
            select(Product).where(Product.business_id == b.id).order_by(Product.sku)
        )
    ]


@app.post(P + "/inventory", status_code=201, response_model=ProductOut)
def add_product(x: ProductInput, b=Depends(current), db=Depends(get_db)):
    if db.scalar(
        select(Product).where(Product.business_id == b.id, Product.sku == x.sku)
    ):
        raise HTTPException(409, detail="duplicate_sku")
    p = Product(business_id=b.id, **x.model_dump())
    db.add(p)
    db.commit()
    return product_dict(p)


@app.patch(P + "/inventory/{id}", response_model=ProductOut)
def edit_product(id: str, x: ProductInput, b=Depends(current), db=Depends(get_db)):
    p = db.get(Product, id)
    if not p or p.business_id != b.id:
        raise HTTPException(404, detail="not_found")
    other = db.scalar(
        select(Product).where(
            Product.business_id == b.id, Product.sku == x.sku, Product.id != id
        )
    )
    if other:
        raise HTTPException(409, detail="duplicate_sku")
    for k, v in x.model_dump().items():
        setattr(p, k, v)
    db.commit()
    return product_dict(p)


@app.delete(P + "/inventory/{id}")
def remove_product(id: str, b=Depends(current), db=Depends(get_db)):
    p = db.get(Product, id)
    if not p or p.business_id != b.id:
        raise HTTPException(404, detail="not_found")
    if db.scalar(select(Sale).where(Sale.product_id == id)):
        raise HTTPException(409, detail="product_has_sales")
    db.delete(p)
    db.commit()
    return {"ok": True}


def latest(db, bid, kind):
    return db.scalar(
        select(Record)
        .where(Record.business_id == bid, Record.kind == kind)
        .order_by(Record.created_at.desc())
    )


@app.get(P + "/twin/state", response_model=TwinOut)
def twin_state(b=Depends(current), db=Depends(get_db)):
    event = latest(db, b.id, "vision")
    if event:
        age = (
            datetime.utcnow() - event.created_at.replace(tzinfo=None)
        ).total_seconds()
        return {
            "occupancy": event.data["person_count"],
            "measurement": event.data["measurement"],
            "updated_at": event.created_at.isoformat(),
            "stale": age > 15,
            "coordinates_available": False,
        }
    return {
        "occupancy": 18 if b.is_demo else 0,
        "measurement": "demo" if b.is_demo else "unavailable",
        "coordinates_available": False,
        "stale": False,
    }


@app.get(P + "/twin/occupancy")
def occupancy(b=Depends(current), db=Depends(get_db)):
    return twin_state(b, db)


@app.get(P + "/twin/layout", response_model=LayoutOut)
def layout(b=Depends(current), db=Depends(get_db)):
    row = latest(db, b.id, "layout")
    return row.data if row else {"cashiers": 2, "shelves": 8, "version": 1}


@app.patch(P + "/twin/layout", response_model=LayoutOut)
def edit_layout(x: LayoutInput, b=Depends(current), db=Depends(get_db)):
    data = {**x.model_dump(), "version": layout(b, db)["version"] + 1}
    db.add(Record(business_id=b.id, kind="layout", data=data))
    db.commit()
    return data


@app.get(P + "/vision/cameras")
def cameras(b=Depends(current)):
    return [
        {
            "id": "browser",
            "name": "Browser camera",
            "status": "user_permission_required",
            "enabled": os.getenv("VISION_ENABLED", "false") == "true",
        }
    ]


@app.get(P + "/vision/stats")
def vision_stats(b=Depends(current), db=Depends(get_db)):
    return twin_state(b, db)


@app.get(P + "/vision/events")
def events(b=Depends(current), db=Depends(get_db)):
    return [
        {"id": r.id, "timestamp": r.created_at.isoformat(), **r.data}
        for r in db.scalars(
            select(Record)
            .where(Record.business_id == b.id, Record.kind == "vision")
            .order_by(Record.created_at.desc())
            .limit(60)
        )
    ]


@app.get(P + "/dashboard/visitors")
def visitors(b=Depends(current), db=Depends(get_db)):
    return {
        "measurement": "demo" if b.is_demo else "unavailable",
        "hourly": [
            {"hour": f"{h}:00", "visitors": v}
            for h, v in zip(
                range(8, 22), [12, 22, 39, 46, 68, 56, 42, 39, 58, 76, 92, 81, 48, 21]
            )
        ]
        if b.is_demo
        else [],
    }


@app.post(P + "/vision/analyze-frame")
async def frame(file: UploadFile = File(...), b=Depends(current), db=Depends(get_db)):
    from .vision import analyze_image

    if os.getenv("VISION_ENABLED", "false") != "true":
        raise HTTPException(503, detail="vision_not_configured")
    content = await file.read(LIMIT + 1)
    if len(content) > LIMIT:
        raise HTTPException(413, detail="file_too_large")
    from starlette.concurrency import run_in_threadpool

    result = await run_in_threadpool(analyze_image, content)
    db.add(Record(business_id=b.id, kind="vision", data=result))
    db.commit()
    return result


@app.post(P + "/vision/analyze-video")
async def video(file: UploadFile = File(...), b=Depends(current), db=Depends(get_db)):
    from .vision import analyze_video

    if os.getenv("VISION_ENABLED", "false") != "true":
        raise HTTPException(503, detail="vision_not_configured")
    content = await file.read(50 * 1024 * 1024 + 1)
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(413, detail="file_too_large")
    from starlette.concurrency import run_in_threadpool

    result = await run_in_threadpool(
        analyze_video, content, Path(file.filename or "").suffix.lower()
    )
    db.add(Record(business_id=b.id, kind="vision", data=result))
    db.commit()
    return result


def insights_data(b, db):
    m = metrics(db, b.id)
    sim = queue_simulation(QueueInput())
    top = m["products"][0] if m["products"] else None
    return {
        "mode": "deterministic",
        "metrics": {k: v for k, v in m.items() if k not in ("daily", "products")},
        "top_product": top,
        "queue": sim,
        "forecast": forecast(m["daily"]),
    }


@app.get(P + "/ai/insights")
@app.get(P + "/dashboard/insights")
def insights(b=Depends(current), db=Depends(get_db)):
    return insights_data(b, db)


@app.post(P + "/ai/chat", response_model=ChatOut)
async def chat(x: ChatInput, b=Depends(current), db=Depends(get_db)):
    d = insights_data(b, db)
    m = d["metrics"]
    q = x.question.lower()
    ru = x.locale == "ru"
    top = d["top_product"]
    f = d["forecast"]
    if any(k in q for k in ["касс", "кезек", "очеред"]):
        s = d["queue"]
        a = s["before"]
        z = s["after"]
        answer = (
            f"В сценарии 48 клиентов/час и 65 секунд обслуживания в течение 8 часов среднее ожидание: {a['average_wait_seconds']} с с одной кассой и {z['average_wait_seconds']} с с двумя. Дополнительные расходы: {money(Decimal(z['operational_cost']) - Decimal(a['operational_cost']))} ₸. Это симуляция (seed 42), а не измеренная очередь. Экономия выручки не оценена: данных об уходе клиентов нет."
            if ru
            else f"48 клиент/сағ және 65 секунд қызмет көрсету сценарийінде 8 сағаттағы орташа күту: бір кассада {a['average_wait_seconds']} с, екі кассада {z['average_wait_seconds']} с. Қосымша шығын: {money(Decimal(z['operational_cost']) - Decimal(a['operational_cost']))} ₸. Бұл симуляция (seed 42), нақты кезек емес. Клиенттердің кетуі туралы дерек жоқ, сондықтан түсім үнемі есептелмеді."
        )
    elif any(k in q for k in ["тауар", "товар", "прибыл", "пайда"]):
        answer = (
            (
                f"Наибольшая валовая прибыль у «{top['name']}»: {top['gross_profit']} ₸, продано {top['quantity']} единиц. Валовая прибыль = выручка − себестоимость. Операционные расходы не распределены по товарам."
                if ru
                else f"Ең жоғары жалпы пайда «{top['name_kk'] or top['name']}» тауарында: {top['gross_profit']} ₸, {top['quantity']} дана сатылды. Жалпы пайда = түсім − өзіндік құн. Операциялық шығындар тауарларға бөлінбеген."
            )
            if top
            else ("Нет данных о продажах." if ru else "Сатылым деректері жоқ.")
        )
    elif any(k in q for k in ["қор", "заказ", "тапсырыс", "остат"]):
        rows = inventory(b, db)
        low = [p for p in rows if p["low_stock"]]
        details = "; ".join(
            f"{p['name'] if ru else p['name_kk'] or p['name']}: +{p['suggested_reorder']}"
            for p in low[:5]
        )
        answer = (
            f"Низкий запас: {len(low)} товаров. Рекомендации на основе среднего спроса за доступную историю и условного срока поставки 3 дня: {details or 'нет'}. Подтвердите реальный срок поставки перед заказом."
            if ru
            else f"Қоры аз: {len(low)} тауар. Қолжетімді тарихтағы орташа сұраныс пен шартты 3 күндік жеткізу мерзімі бойынша: {details or 'жоқ'}. Тапсырыстан бұрын нақты жеткізу мерзімін тексеріңіз."
        )
    elif any(k in q for k in ["ертең", "завтра", "болжам", "прогноз"]):
        answer = (
            (
                f"Прогноз следующего дня: {f['days'][0]['revenue']} ₸. Метод: сезонный наивный (7 дней), историческая MAE: {f['backtest_mae']} ₸. Это оценка, не гарантия."
                if ru
                else f"Келесі күн болжамы: {f['days'][0]['revenue']} ₸. Әдіс: маусымдық наивті (7 күн), тарихи MAE: {f['backtest_mae']} ₸. Бұл кепілдік емес, бағалау."
            )
            if f["available"]
            else (
                "Для прогноза нужно минимум 14 дней истории."
                if ru
                else "Болжамға кемінде 14 күн тарих қажет."
            )
        )
    else:
        answer = (
            f"За доступный период выручка {m['revenue']} ₸, валовая прибыль {m['gross_profit']} ₸. Чистая прибыль: {m['net_profit'] or 'нет данных о расходах'}. Товаров с низким запасом: {m['low_stock']}. Причины изменения выручки нельзя установить по этим данным; это требует истории цен, акций и посещаемости."
            if ru
            else f"Қолжетімді кезең түсімі {m['revenue']} ₸, жалпы пайда {m['gross_profit']} ₸. Таза пайда: {m['net_profit'] or 'шығын деректері жоқ'}. Қоры аз тауарлар: {m['low_stock']}. Түсім өзгерісінің себебін бұл деректермен анықтау мүмкін емес; баға, акция және келушілер тарихы қажет."
        )
    from .ai import explain

    recent = db.scalars(
        select(Record)
        .where(Record.business_id == b.id, Record.kind == "conversation")
        .order_by(Record.created_at.desc())
        .limit(4)
    ).all()
    from .operations import actions

    explanation = await explain(
        x.question,
        x.locale,
        {
            "business": b.name,
            "calculated_answer": answer,
            "metrics": m,
            "stock_and_margin_actions": actions(b, db),
            "recent_conversation": [r.data for r in reversed(recent)],
        },
    )
    from .ai import provider_state

    db.add(
        Record(
            business_id=b.id,
            kind="conversation",
            data={
                "question": x.question,
                "answer": answer,
                "explanation": explanation,
                "locale": x.locale,
                "mode": "openai_explanation" if explanation else "deterministic",
            },
        )
    )
    db.commit()
    return {
        "answer": answer,
        "explanation": explanation,
        "mode": "openai_explanation" if explanation else "deterministic",
        "locale": x.locale,
        "evidence": m,
        "data_source": "demo" if b.is_demo else "imported",
        "provider_error": provider_state.get("error") if not explanation else None,
    }


@app.patch(P + "/settings/profile")
def profile(x: ProfileInput, b=Depends(current), db=Depends(get_db)):
    b.name = x.name
    b.city = x.city
    db.commit()
    return {"name": b.name, "city": b.city}


@app.get(P + "/reports")
def reports(b=Depends(current), db=Depends(get_db)):
    return [
        {"id": r.id, "created_at": r.created_at.isoformat(), "format": r.data["format"]}
        for r in db.scalars(
            select(Record)
            .where(Record.business_id == b.id, Record.kind == "report")
            .order_by(Record.created_at.desc())
        )
    ]


@app.post(P + "/reports/generate")
def generate(x: ReportInput, b=Depends(current), db=Depends(get_db)):
    m = metrics(db, b.id)
    r = Record(
        business_id=b.id,
        kind="report",
        data={
            "format": x.format,
            "locale": x.locale,
            "business": b.name,
            "demo": b.is_demo,
            "metrics": m,
            "forecast": forecast(m["daily"]),
        },
    )
    db.add(r)
    db.commit()
    return {"id": r.id, "download_url": f"{P}/reports/{r.id}/download"}


@app.get(P + "/reports/{id}/download")
def download(id: str, b=Depends(current), db=Depends(get_db)):
    r = db.get(Record, id)
    if not r or r.business_id != b.id or r.kind != "report":
        raise HTTPException(404, detail="not_found")
    d = r.data
    m = d["metrics"]
    fmt = d["format"]
    if fmt == "csv":
        out = io.StringIO()
        w = csv.writer(out)
        w.writerow(["date", "revenue_KZT", "gross_profit_KZT", "quantity"])
        for day in m["daily"]:
            w.writerow([day["date"], day["revenue"], day["profit"], day["quantity"]])
        content = out.getvalue().encode("utf-8-sig")
        media = "text/csv; charset=utf-8"
    else:
        from reportlab.pdfgen import canvas
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont

        font = "Helvetica"
        font_path = next(
            (
                p
                for p in [
                    os.getenv("REPORT_FONT", ""),
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                    "C:/Windows/Fonts/arial.ttf",
                ]
                if p and Path(p).exists()
            ),
            None,
        )
        if font_path:
            pdfmetrics.registerFont(TTFont("QalaFont", font_path))
            font = "QalaFont"
        out = io.BytesIO()
        c = canvas.Canvas(out)
        c.setTitle("QALA TWIN AI report")
        c.setFont(font, 20)
        c.drawString(40, 800, "QALA TWIN AI / " + d["business"][:40])
        c.setFont(font, 11)
        ru = d["locale"] == "ru"
        lines = [
            ("Демонстрационные данные" if ru else "Демонстрациялық деректер")
            if d["demo"]
            else ("Импортированные данные" if ru else "Импортталған деректер"),
            f"{m['daily'][0]['date'] if m['daily'] else '—'} / {m['daily'][-1]['date'] if m['daily'] else '—'}",
            ("Выручка" if ru else "Түсім") + ": " + m["revenue"] + " KZT",
            ("Валовая прибыль" if ru else "Жалпы пайда")
            + ": "
            + m["gross_profit"]
            + " KZT",
            ("Расходы" if ru else "Шығындар") + ": " + m["expenses"] + " KZT",
            ("Чистая прибыль" if ru else "Таза пайда")
            + ": "
            + (m["net_profit"] or "N/A")
            + " KZT",
            ("Низкий запас" if ru else "Қоры аз") + ": " + str(m["low_stock"]),
        ]
        for i, line in enumerate(lines):
            c.drawString(40, 760 - i * 25, line)
        if m["daily"]:
            maximum = max(float(v["revenue"]) for v in m["daily"]) or 1
            c.setStrokeColorRGB(0.33, 0.48, 1)
            c.setLineWidth(2)
            path = c.beginPath()
            for i, v in enumerate(m["daily"]):
                x = 40 + i * 500 / max(1, len(m["daily"]) - 1)
                y = 360 + float(v["revenue"]) / maximum * 170
                if i == 0:
                    path.moveTo(x, y)
                else:
                    path.lineTo(x, y)
            c.drawPath(path)
            c.setFont(font, 10)
            c.drawString(
                40, 330, "KZT / " + ("Дневная выручка" if ru else "Күнделікті түсім")
            )
        c.drawString(
            40,
            290,
            (
                "Проверьте товары с низким запасом."
                if ru
                else "Қоры аз тауарларды тексеріңіз."
            ),
        )
        c.save()
        content = out.getvalue()
        media = "application/pdf"
    return Response(
        content,
        media_type=media,
        headers={
            "Content-Disposition": f'attachment; filename="qala-report-{id[:8]}.{fmt}"'
        },
    )


from .operations import router as operations_router

app.include_router(operations_router)
