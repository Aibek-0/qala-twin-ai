# QALA TWIN AI

Билингвальная платформа цифрового двойника бизнеса для TREK AI Hackathon. Next.js + FastAPI + PostgreSQL, интерактивный 3D-магазин, импорт CSV/XLSX, финансовая аналитика, воспроизводимая симуляция и YOLO person detection. Работает без платного AI.

## Быстрый запуск: Docker

Требуются Docker Desktop с Linux engine и Docker Compose.

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

Открыть **http://localhost:3000/kk** и нажать «Демоны зерттеу». PostgreSQL хранится в volume `qala_data`. Backend не публикует порт наружу; браузер обращается к нему через Next.js. Первый запуск создаёт схему и реалистичные данные QALA MART. Для обычного повторного запуска достаточно `docker compose up -d`.

Для YOLO установите в `.env` `VISION_ENABLED=true` и выполните `docker compose up -d --build`. Это добавит PyTorch/Ultralytics в образ; первая загрузка весов требует интернета. Системы без камеры могут использовать загрузку MP4/WEBM/MOV. Веса скачиваются при первом анализе; для предварительной загрузки:

```powershell
docker compose exec backend python -c "from backend.app.vision import detector; detector()"
```

## Локальная разработка без Docker

Нужны Node.js 22+ и Python 3.11. Для проверки без PostgreSQL по умолчанию используется **SQLite**; это явный режим разработки. Для PostgreSQL задайте `DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE` в `.env`.

Терминал 1, из корня проекта:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --env-file .env
```

Терминал 2:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Открыть **http://127.0.0.1:3000/kk**. Swagger: **http://127.0.0.1:8000/docs**. Health: **http://127.0.0.1:8000/health**. На Linux используйте `python3 -m venv .venv`, `.venv/bin/python` и `npm` вместо Windows-команд.

YOLO локально:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend/requirements-vision.txt
# Установить VISION_ENABLED=true в .env и перезапустить backend.
```

`scripts/start-local.ps1` автоматизирует локальный запуск в фоновых процессах; `-Vision` включает установку vision. Логи и PID хранятся в `.runtime/`. Скрипт не меняет политику выполнения PowerShell. При запрещённых скриптах используйте команды двух терминалов выше. Backend читает `.env` через uvicorn; frontend при необходимости использует `frontend/.env.local` с `API_INTERNAL_URL`.

## Возможности

- Казахский и русский, URL `/kk/*` и `/ru/*`; переключение сохраняет раздел. Даты, числа и тенге форматируются по locale. Локальные variable fonts включают кириллицу.
- Тёмная и светлая темы, адаптивное меню, поиск разделов `Ctrl+K`, анимация с учётом reduced motion.
- Изолированное демо: 48 товаров, 30 дней, 1440 строк продаж, операционные расходы. Dashboard загружается из API.
- CSV/XLSX: сопоставление столбцов, предпросмотр, ошибки по строкам, атомарный импорт, защита от повторного файла, экспорт продаж.
- Decimal-расчёты, историческая себестоимость, `net_profit=null` при отсутствии расходов, сезонный baseline-прогноз с MAE.
- Три симулятора: дискретная очередь, эластичность цены, планирование запасов. Сценарии сохраняются в базе.
- React Three Fiber: вращение, масштаб, кассы, стеллажи, условные посетители, сохранение layout. Измеренная occupancy обновляет count, но не координаты.
- YOLO: webcam snapshots, bounding boxes, video sampling, история измерений. Кадры не сохраняются.
- CRUD товаров, корректировка остатка, поиск, дефицит, рекомендуемые заказы.
- Детерминированный советник с доказательствами и необязательным OpenAI-пояснением. Без ключей ничего не блокируется.
- CSV/PDF-отчёты со снимком данных на момент генерации, кириллицей, графиком и периодом.

## Внешние сервисы

**Supabase Auth:** заполните `SUPABASE_URL` и `SUPABASE_ANON_KEY` на backend. Email/password отправляются только провайдеру, возвращённая identity дополнительно проверяется через `/auth/v1/user`. При подтверждении email регистрация показывает соответствующее сообщение. Без Supabase кнопки входа возвращают понятную ошибку, демо доступно. Настоящие новые аккаунты начинают с пустой базы продаж.

**OpenAI:** необязательные `OPENAI_API_KEY` и `OPENAI_MODEL` (модель, доступная вашему проекту). Сервис объясняет готовые показатели через Responses API с `store:false`; арифметика остаётся в Python. При недоступности используется помеченный deterministic fallback. Ключи не должны попадать в frontend или Git.

**Сессии:** задайте стабильный случайный `SESSION_SECRET` длиной от 32 символов в размещённом приложении. Без него секрет временный и сессии завершаются при перезапуске. `COOKIE_SECURE=true` для HTTPS; `CORS_ORIGINS` должен содержать точный origin сайта. В локальном HTTP используйте false.

## Проверки

```powershell
.\.venv\Scripts\python.exe -m pytest backend/tests -q
cd frontend
npm.cmd run typecheck
npm.cmd run build
npx.cmd playwright install chromium
# API и frontend должны быть запущены на 8000 / 3000:
npm.cmd run test:e2e
```

Backend-тесты проверяют арифметику, очередь, прогноз, импорт, авторизацию, изоляцию организаций, локализованные ответы и отчёты. Playwright проверяет demo login, переключение языка, импорт, симуляцию, советника, CRUD, сохранение layout, PDF и мобильную ширину. Аппаратную камеру нужно проверить вручную.

Начальная миграция: `python -m scripts.migrate`. Seed: `python -m scripts.seed`. SQL-схема для PostgreSQL — `database/migrations/001_initial.sql`. Повторные изменения схемы требуют новой миграции, `create_all` не обновляет существующие столбцы.

## Размещение

Готовы Dockerfiles и Compose. Для Vercel задайте корень `frontend` и **build-time** `API_INTERNAL_URL=https://YOUR-PYTHON-BACKEND`; backend разместите на Python/container hosting с PostgreSQL/Supabase DB. На backend добавьте origin Vercel в `CORS_ORIGINS`, стабильный session secret и secure cookies. Backend `/health` проверяет подключение к базе. Production backend может стартовать командой `uvicorn backend.app.main:app --host 0.0.0.0 --port 8000`.

Публичное размещение и удалённый GitHub-репозиторий требуют подключённого аккаунта/хостинга; локальная сборка сама их не создаёт. Sites Worker hosting не исполняет Python/PyTorch, поэтому не является заменой указанной в ТЗ серверной архитектуры. Перед публичным запуском добавьте распределённый rate limiting, политику очистки демо-данных и продумайте нагрузку YOLO.

## Документация

- [Архитектура, формулы и ограничения](docs/ARCHITECTURE.md)
- [Сценарий демонстрации на 3–5 минут](docs/DEMO.md)
- [Результаты проверки и её ограничения](docs/VERIFICATION.md)
- [OpenAPI-контракт](docs/openapi.json)
- [Исходное техническое задание](docs/SPECIFICATION.md)

Мультикамерность, трекинг входов/выходов, измеренная тепловая карта, POS/1C-интеграции и расширенные роли не реализованы и не выдаются за доступные возможности. Полная проверка внешнего Supabase/OpenAI требует настоящих ключей.
