import os, secrets, time
import hashlib, hmac
from datetime import datetime, timedelta, timezone
import httpx, jwt
from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from .db import Business, Product, Sale, Expense, Record, User, get_db, uid
from .seed import DEMO_ID

SECRET = os.getenv("SESSION_SECRET") or secrets.token_hex(32)
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")
COOKIE = "qala_session"


def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt), 600000
    ).hex()
    return f"pbkdf2_sha256$600000${salt}${digest}"


def verify_password(password, encoded):
    try:
        method, rounds, salt, digest = encoded.split("$")
        if method != "pbkdf2_sha256":
            return False
        actual = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt), int(rounds)
        ).hex()
        return hmac.compare_digest(actual, digest)
    except (ValueError, TypeError):
        return False


def local_auth(credentials, db, register=False):
    email = credentials.email.strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    if register:
        if user:
            raise HTTPException(409, detail="email_exists")
        user = User(email=email, password_hash=hash_password(credentials.password))
        db.add(user)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            raise HTTPException(409, detail="email_exists")
    elif not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(400, detail="invalid_credentials")
    return user.id


async def authenticate(credentials, db, register=False):
    if SUPABASE_URL and SUPABASE_KEY:
        return await supabase_auth(credentials, register)
    return local_auth(credentials, db, register)


def issue(response, business):
    token = jwt.encode(
        {
            "sub": business.owner_id,
            "bid": business.id,
            "demo": business.is_demo,
            "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        },
        SECRET,
        algorithm="HS256",
    )
    response.set_cookie(
        COOKIE,
        token,
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
        samesite="lax",
        max_age=43200,
        path="/",
    )
    return {
        "business_id": business.id,
        "name": business.name,
        "city": business.city,
        "is_demo": business.is_demo,
    }


def current(request: Request, db=Depends(get_db)):
    token = request.cookies.get(COOKIE)
    if not token:
        raise HTTPException(401, detail="unauthorized")
    try:
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        b = db.get(Business, payload["bid"])
        if not b or b.owner_id != payload["sub"]:
            raise ValueError()
        return b
    except (jwt.PyJWTError, ValueError, KeyError):
        raise HTTPException(401, detail="unauthorized")


def clone_demo(db):
    b = Business(owner_id="demo-" + uid(), name="QALA MART", city="Taraz", is_demo=True)
    db.add(b)
    db.flush()
    ids = {}
    for p in db.scalars(select(Product).where(Product.business_id == DEMO_ID)):
        new = Product(
            business_id=b.id,
            sku=p.sku,
            name=p.name,
            name_kk=p.name_kk,
            category=p.category,
            cost_price=p.cost_price,
            selling_price=p.selling_price,
            stock_quantity=p.stock_quantity,
            reorder_point=p.reorder_point,
        )
        db.add(new)
        db.flush()
        ids[p.id] = new.id
    for s in db.scalars(select(Sale).where(Sale.business_id == DEMO_ID)):
        db.add(
            Sale(
                business_id=b.id,
                product_id=ids[s.product_id],
                quantity=s.quantity,
                unit_price=s.unit_price,
                unit_cost=s.unit_cost,
                sold_at=s.sold_at,
            )
        )
    for e in db.scalars(select(Expense).where(Expense.business_id == DEMO_ID)):
        db.add(
            Expense(
                business_id=b.id,
                category=e.category,
                amount=e.amount,
                occurred_at=e.occurred_at,
            )
        )
    db.add(
        Record(
            business_id=b.id,
            kind="layout",
            data={"cashiers": 2, "shelves": 8, "version": 1},
        )
    )
    db.commit()
    return b


async def supabase_auth(credentials, register=False):
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(503, detail="auth_not_configured")
    endpoint = "/auth/v1/signup" if register else "/auth/v1/token?grant_type=password"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                SUPABASE_URL + endpoint,
                headers={"apikey": SUPABASE_KEY},
                json=credentials.model_dump(include={"email", "password"}),
            )
            if r.status_code >= 400:
                raise HTTPException(
                    400,
                    detail="invalid_credentials"
                    if not register
                    else "registration_failed",
                )
            data = r.json()
            if not data.get("access_token"):
                return None
            # Verify the returned session with the provider before accepting identity.
            me = await client.get(
                SUPABASE_URL + "/auth/v1/user",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": "Bearer " + data["access_token"],
                },
            )
            if me.status_code != 200:
                raise HTTPException(401, detail="unauthorized")
            return me.json()["id"]
    except httpx.RequestError:
        raise HTTPException(503, detail="auth_unavailable")
