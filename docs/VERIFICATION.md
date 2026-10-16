# Verification — 2026-10-16

Verified on Windows with Node.js 24, Python 3.11, Chromium (Playwright), and PostgreSQL 17 in Docker.

- `python -m pytest backend/tests -q`: **28 passed**. Covers Decimal calculations, reproducible queue results, invalid simulation input, forecast history, CSV/XLSX validation and atomic imports, duplicate import rejection, session authorization, tenant isolation, layout persistence, localized advisor, provider failure fallback, rejection of AI-invented numeric explanations, PDF/CSV reports and vision-to-twin state synchronization. Supabase and OpenAI integrations use mocks in these tests.
- `npm run build`: **passed**, Next.js 16.4.2 production output with TypeScript checks.
- `npm run test:e2e`: **5 passed** against the production Next.js server and a real FastAPI/PostgreSQL backend. Tests cover demo login, locale switch, queue comparison, advisor, CSV import, product creation/search, mobile width, saved layout, PDF download, and real YOLO video upload → twin count.
- Real YOLO11n reference-image inference: **4 people** detected. Generated two-second video fixture: **2 samples**, **4 people** each. `/twin/state` matched the resulting count and correctly identified live vs uploaded-video sources. The image came from Ultralytics' public bus example and is used only for local QA, not shipped as an application asset. Camera hardware permission and physical webcam capture require manual verification.
- Browser visual check: **no uncaught page errors**, **no horizontal page overflow at 390 px**. Desktop and mobile screenshots inspected. The Three.js store rendered correctly.
- PostgreSQL `/health`: **ok**, database dialect `postgresql`. Migration and demo seed executed successfully against PostgreSQL.
- Docker Compose: **built and started successfully** with a fresh PostgreSQL volume. Containerized frontend returned 200; demo loaded 48 products / 30 days; queue calculation and Kazakh PDF download succeeded. This container check uses `VISION_ENABLED=false`; real YOLO was verified with the local Python backend separately.

Not claimed: measured Lighthouse 85+, measured 30 FPS on the user's GPU, live Supabase email delivery, live paid OpenAI response, public cloud deployment, or a remote GitHub repository. Those require separate measurements or connected accounts. Production distributed rate limiting, role management and entry/exit tracking remain outside this MVP.

The optional real-vision Playwright test skips when YOLO is disabled or the local `.runtime/vision-test.mp4` fixture is absent; all other tests are self-contained after starting the application.
