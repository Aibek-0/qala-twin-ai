from datetime import datetime, timedelta
from decimal import Decimal
import random
from sqlalchemy import select
from .db import Business, Product, Sale, Expense, Record

DEMO_ID = "00000000-0000-0000-0000-000000000001"
NAMES = [
    ("Молоко 3,2%", "Сүт 3,2%", "dairy", 520, 390),
    ("Кефир 1 л", "Айран 1 л", "dairy", 480, 340),
    ("Сметана 200 г", "Қаймақ 200 г", "dairy", 650, 440),
    ("Творог 200 г", "Сүзбе 200 г", "dairy", 780, 530),
    ("Хлеб пшеничный", "Бидай наны", "bakery", 220, 130),
    ("Батон", "Батон", "bakery", 280, 165),
    ("Лаваш", "Лаваш", "bakery", 350, 210),
    ("Круассан", "Круассан", "bakery", 450, 260),
    ("Яблоки 1 кг", "Алма 1 кг", "produce", 650, 420),
    ("Бананы 1 кг", "Банан 1 кг", "produce", 990, 710),
    ("Помидоры 1 кг", "Қызанақ 1 кг", "produce", 850, 580),
    ("Огурцы 1 кг", "Қияр 1 кг", "produce", 700, 460),
    ("Картофель 1 кг", "Картоп 1 кг", "produce", 250, 160),
    ("Морковь 1 кг", "Сәбіз 1 кг", "produce", 280, 175),
    ("Лук 1 кг", "Пияз 1 кг", "produce", 220, 130),
    ("Апельсины 1 кг", "Апельсин 1 кг", "produce", 1100, 780),
    ("Рис 1 кг", "Күріш 1 кг", "grocery", 650, 450),
    ("Гречка 1 кг", "Қарақұмық 1 кг", "grocery", 580, 390),
    ("Макароны 400 г", "Макарон 400 г", "grocery", 420, 270),
    ("Мука 2 кг", "Ұн 2 кг", "grocery", 820, 590),
    ("Сахар 1 кг", "Қант 1 кг", "grocery", 480, 350),
    ("Соль 1 кг", "Тұз 1 кг", "grocery", 150, 85),
    ("Масло 1 л", "Май 1 л", "grocery", 850, 640),
    ("Чай 100 г", "Шай 100 г", "grocery", 980, 690),
    ("Кофе 100 г", "Кофе 100 г", "grocery", 1850, 1300),
    ("Вода 1,5 л", "Су 1,5 л", "drinks", 250, 140),
    ("Сок 1 л", "Шырын 1 л", "drinks", 690, 450),
    ("Лимонад 1 л", "Лимонад 1 л", "drinks", 450, 280),
    ("Куриное филе 1 кг", "Тауық еті 1 кг", "meat", 2300, 1700),
    ("Говядина 1 кг", "Сиыр еті 1 кг", "meat", 3900, 3000),
    ("Яйца 10 шт", "Жұмыртқа 10 дана", "dairy", 650, 480),
    ("Сыр 200 г", "Ірімшік 200 г", "dairy", 1200, 820),
    ("Шоколад 100 г", "Шоколад 100 г", "grocery", 650, 410),
    ("Печенье 300 г", "Печенье 300 г", "bakery", 550, 340),
    ("Йогурт 150 г", "Йогурт 150 г", "dairy", 320, 200),
    ("Масло сливочное", "Сары май", "dairy", 980, 700),
    ("Капуста 1 кг", "Қырыққабат 1 кг", "produce", 250, 150),
    ("Мандарины 1 кг", "Мандарин 1 кг", "produce", 1200, 850),
    ("Фасоль 400 г", "Үрмебұршақ 400 г", "grocery", 580, 390),
    ("Горошек 400 г", "Бұршақ 400 г", "grocery", 520, 340),
    ("Томатная паста", "Томат пастасы", "grocery", 450, 280),
    ("Мёд 500 г", "Бал 500 г", "grocery", 2200, 1500),
    ("Овсянка 500 г", "Сұлы 500 г", "grocery", 420, 270),
    ("Сухофрукты 200 г", "Кепкен жеміс 200 г", "grocery", 890, 590),
    ("Орехи 200 г", "Жаңғақ 200 г", "grocery", 1400, 980),
    ("Сливки 200 мл", "Кілегей 200 мл", "dairy", 620, 410),
    ("Кумыс 1 л", "Қымыз 1 л", "dairy", 1200, 850),
    ("Шубат 1 л", "Шұбат 1 л", "dairy", 1300, 900),
]


def seed_demo(db):
    if db.get(Business, DEMO_ID):
        return
    rng = random.Random(2026)
    db.add(
        Business(
            id=DEMO_ID, owner_id="demo", name="QALA MART", city="Taraz", is_demo=True
        )
    )
    products = []
    for i, (ru, kk, category, price, cost) in enumerate(NAMES):
        p = Product(
            business_id=DEMO_ID,
            sku=f"QM-{i + 1:04}",
            name=ru,
            name_kk=kk,
            category=category,
            cost_price=Decimal(cost),
            selling_price=Decimal(price),
            stock_quantity=rng.randint(3, 12)
            if i in (0, 4, 16, 30)
            else rng.randint(45, 190),
            reorder_point=25,
        )
        db.add(p)
        products.append(p)
    db.flush()
    start = datetime(2026, 9, 17)
    for d in range(30):
        day = start + timedelta(days=d)
        for i, p in enumerate(products):
            q = max(
                1,
                round(
                    (12 if i < 8 else 5)
                    * (1.2 if day.weekday() > 4 else 1)
                    * (1 + d * 0.007)
                    * rng.uniform(0.6, 1.4)
                ),
            )
            db.add(
                Sale(
                    business_id=DEMO_ID,
                    product_id=p.id,
                    quantity=q,
                    unit_price=p.selling_price,
                    unit_cost=p.cost_price,
                    sold_at=day + timedelta(hours=9 + i % 12),
                )
            )
        db.add(
            Expense(
                business_id=DEMO_ID,
                category="operations",
                amount=Decimal("38500"),
                occurred_at=day,
            )
        )
    db.add(
        Record(
            business_id=DEMO_ID,
            kind="layout",
            data={"cashiers": 2, "shelves": 8, "version": 1},
        )
    )
    db.commit()
