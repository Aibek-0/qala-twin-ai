# QALA TWIN AI: architecture and numerical methods

The MVP uses Next.js App Router, next-intl, Tailwind 4, a shadcn-style Radix Button, Framer Motion, Recharts and a lazy React Three Fiber canvas. A same-origin `/api/v1` rewrite forwards requests to FastAPI; API credentials never enter the browser bundle. SQLAlchemy uses PostgreSQL NUMERIC(16,2); SQLite is an explicit local development fallback. The initial schema is generated from the same models used at runtime. Users authenticate through Supabase; the application stores provider-verified identity and a tenant-scoped HttpOnly session, not passwords. Demo login clones the seed into a separate tenant.

## Financial calculations

All financial operations use Python Decimal. Monetary API values are strings with two decimal places. A sale's revenue is quantity × its historical unit price; cost is quantity × its historical unit cost. Gross profit = revenue − cost. Net profit = gross profit − recorded operating expenses, and is `null` when no expenses exist for the selected period. Updating a product never changes historical prices. Import appends historical sales; it does not infer stock movements or operating expenses. Files are atomic: any invalid row prevents the entire commit. Identical content and mapping cannot be reimported within a tenant. Limits: 5 MB, 10,000 rows, uncompressed XLSX contents 40 MB. Required columns may be mapped explicitly. CSV accepts UTF-8, comma, semicolon or tab delimiters. Prices require at most 2 decimal places; quantities are positive integers.

Dashboard period boundaries are inclusive calendar dates. Financial dates are business-local naive dates, not inferred device timestamps. Demo period is fixed at 2026-09-17 through 2026-10-16, with 48 products, 1,440 sale lines, and daily operating expenses of 38,500 KZT. Quantity, prices and costs determine every aggregate; no independent total is mocked.

## Forecast

At least 14 calendar days between first and last sale are required. Missing days in that range are treated as zero sales; this assumes a complete import. The seasonal naive baseline repeats the last seven days. Historical rolling backtest MAE = average absolute difference between day t and day t−7 for all eligible days. Display bounds are max(0, forecast−2×MAE) and forecast+2×MAE; they are descriptive error bands, **not calibrated confidence intervals**. Forecast dates follow the last imported sale, which may not be today. No causal explanation or guarantee is inferred from this baseline.

## Business health index

For periods with revenue:

`clamp(100 − 35×expenses/revenue − 30×low_stock_products/product_count − 0.5×max(0, −weekly_growth_percent) − 8, 0, 100)`

Weekly growth compares the last 7 days with the preceding 7. A zero prior period gives unavailable growth. The 8-point queue penalty is an explicit heuristic assumption until calibrated queue measurements exist. A missing sales history produces no score. This index is a transparent demo heuristic and is not a certified business assessment.

## Queue model

Discrete-event single FIFO queue with c servers. Interarrival times are exponential with mean 3600 / customers_per_hour seconds. Service times are exponential with the specified mean. Python Random(seed) generates one common set of arrivals and service draws, reused for c and c+1 servers. Horizon defaults to 8 hours. Mean wait includes every arrival before the horizon, even if service begins later. Served count includes only completions within the horizon. Mean queue length integrates the event-level queue over the horizon. Labor cost = cashiers × hours × hourly cost. No customer abandonment, capacity constraint, basket value, revenue uplift or profit saving is assumed. Repeatability is within the specified Python implementation/version. Scenario inputs and outputs are persisted.

Price scenario: new demand = round(base demand × (new price/current price)^elasticity). Revenue and gross profit are calculated with Decimal. Elasticity is user-supplied, not learned. Inventory reorder point = ceil(daily demand × lead time) + safety stock; order quantity = max(0, reorder point − stock). Risk means stock cannot cover the lead-time demand under the stated assumptions.

## Vision and twin

The browser requests webcam permission only after clicking Start. JPEG snapshots of width 640 are sent sequentially, with 750 ms between completed requests; no overlapping inference loop. Backend YOLO predicts class 0 (person), confidence ≥0.45, imgsz 640 under a process lock. Bounding boxes and counts are returned. Frames and videos are not stored. Video uploads accept up to 50 MB; at most 60 one-second samples are analyzed. Uploaded measurements are labeled separately from live measurements. No zone tracking or entry/exit counting is claimed. The latest successful count updates `/twin/state`; a webcam value older than 15 seconds is marked stale. 3D people positions are **schematic**, not reconstructed camera coordinates. Zones are conceptual overlays, not measured heatmaps. Layout versions are stored separately. The initial occupancy of 18 is clearly labeled demo data and is never described as live.

## Advisor

Intent-specific deterministic templates read tenant financial metrics, product ranking, stock and forecast. Queue questions use the explicitly described default simulated scenario. Missing causal data is stated. With no OpenAI key/model, this is visibly a deterministic advisor. If both are configured, an optional Responses API request produces a separate qualitative explanation; numeric output is rejected, and the calculated answer remains authoritative. Provider failures fall back without disrupting analytics. Secrets stay server-side. The optional hosted model path requires account credentials and is tested with mocks rather than paid calls.

## Scope and limits

Tables `businesses`, `products`, `sales`, `expenses`, and generic typed `records` implement the MVP. `records` persist layout versions, vision measurements, simulations, import jobs and report snapshots; this deliberately consolidates the separate event tables proposed in the specification. Supabase stores authentication users. Full multi-role tenancy, production distributed rate limits, calibrated zones, entry/exit tracking, POS/1C connectors and measured heatmaps are not implemented. Rate limiting is process-local. There is no retention scheduler for abandoned demo tenants; clean them before a long-running public deployment. Start with one backend worker for YOLO and ephemeral development session secrets; use a stable secret for deployed sessions.

## References used

- [Next.js App Router installation](https://nextjs.org/docs/app/getting-started/installation)
- [FastAPI security](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- [Ultralytics prediction](https://docs.ultralytics.com/modes/predict/)
- [OpenAI Responses migration](https://developers.openai.com/api/docs/guides/migrate-to-responses)
