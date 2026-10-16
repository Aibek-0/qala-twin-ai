# QALA TWIN AI — FULL MVP TECHNICAL SPECIFICATION
## Premium Bilingual AI Business Digital Twin Platform

**Нұсқа:** 1.0 — Hackathon MVP  
**Мақсатты нарық:** Қазақстан, Тараз және Жамбыл облысы  
**Тілдер:** Қазақша (kk-KZ), Русский (ru-RU)  
**Жоба форматы:** Толық жұмыс істейтін responsive SaaS веб-платформа  
**Негізгі мақсат:** TREK AI Hackathon үшін көрсетуге дайын өнім әзірлеу.

---

# 1. ЖОБАНЫҢ КОНЦЕПЦИЯСЫ

QALA TWIN AI — шағын және орта бизнеске арналған жасанды интеллект платформасы. Ол дүкеннің немесе басқа кәсіпорынның цифрлық егізін құрады, камерадан клиент ағынын анықтайды, сатылымды талдайды және операциялық шешімдердің нәтижесін модельдейді.

Платформаның негізгі құндылығы:

**SEE → ANALYZE → PREDICT → SIMULATE → OPTIMIZE**

1. SEE — камера арқылы адамдарды бақылау.
2. ANALYZE — сатылым мен операциялық деректерді талдау.
3. PREDICT — болашақтағы сұранысты болжау.
4. SIMULATE — шешімдердің ықтимал нәтижесін модельдеу.
5. OPTIMIZE — шығынды азайтатын және тиімділікті арттыратын әрекеттер ұсыну.

MVP-де бір азық-түлік дүкенінің толық жұмыс сценарийі жүзеге асырылады.

# 2. ДИЗАЙН ЖӘНЕ UX/UI

## 2.1. Жалпы дизайн бағыты

Интерфейс заманауи premium enterprise SaaS стилінде болуы қажет.

Шабыт көздері:
- Apple — минимализм және анимация сапасы.
- Linear — кәсіби dark интерфейс.
- Vercel — типография мен компоненттер.
- Stripe — деректерді визуализациялау.
- Жоғары технологиялық Digital Twin жүйелері — 3D көрініс.

Дизайн жай admin template сияқты көрінбеуі тиіс.

## 2.2. Түс палитрасы

Негізгі қараңғы тема:

| Элемент | HEX |
|---|---|
| Primary background | #070B14 |
| Secondary background | #0D1423 |
| Cards | #111B2D |
| Primary accent | #547BFF |
| Secondary accent | #8B5CF6 |
| Success | #2DD4A3 |
| Warning | #F5B942 |
| Danger | #FF647C |
| Main text | #F5F7FF |
| Muted text | #94A3B8 |
| Borders | #243047 |

Қосымша Light Mode әзірлеу, бірақ негізгі демонстрация Dark Mode-та жүргізіледі.

Түстер WCAG AA мәтін контраст талаптарына барынша сәйкес келуі тиіс.

## 2.3. Типография

- Inter — латын және кирилл мәтіндері.
- Manrope — тақырыптар мен ірі KPI көрсеткіштері.
- JetBrains Mono — техникалық ақпарат.

Негізгі өлшемдер:

- Hero: 56–72px.
- Page titles: 28–36px.
- Section titles: 20–24px.
- Body: 14–16px.
- Caption: 12–13px.

Қазақ тіліндегі мәтін ұзындығына байланысты батырмалар мен карточкалар бұзылмауы қажет.

## 2.4. UI компоненттері

Міндетті компоненттер:

- Premium Sidebar.
- Top Navigation.
- Language Switcher.
- Theme Switcher.
- KPI Cards.
- Glassmorphism panels.
- Interactive Charts.
- Animated Buttons.
- Search Dialog.
- Notifications.
- Modal Windows.
- Toast Messages.
- Skeleton Loaders.
- Empty States.
- Error States.
- Tooltips.
- Progress Indicators.
- AI Assistant Panel.
- Date Range Picker.
- File Upload Dropzone.
- Data Tables.

Барлық компоненттер біртұтас дизайн жүйесін пайдалануы тиіс.

## 2.5. Анимация жүйесі

**Анимация — жобаның маңызды бөлігі, бірақ сайттың жылдамдығы мен қолдануға ыңғайлылығына кедергі келтірмеуі керек.**

Міндетті анимациялар:

**Page Transition**
- Беттер арасында fade + slide.
- Ұзақтығы 200–350 ms.
- Ескі және жаңа контенттің секіріп кетпеуі.

**Dashboard**
- KPI сандарының count-up анимациясы.
- Карточкалардың staggered appearance.
- Графиктердің біртіндеп пайда болуы.
- Деректер өзгергенде smooth transition.

**Sidebar**
- Collapse / Expand.
- Active navigation indicator.
- Hover қозғалысы.

**Buttons**
- Subtle scale.
- Hover illumination.
- Loading spinner.
- Success confirmation.

**3D Digital Twin**
- Камераның smooth orbit қозғалысы.
- Клиент объектілерінің қозғалысы.
- Касса статусының анимациясы.
- Heatmap transition.
- Scenario comparison animation.

**AI Assistant**
- Streaming text.
- Thinking indicator.
- Жауап карточкаларының біртіндеп шығуы.

**Landing Page**
- Hero reveal animation.
- Interactive 3D немесе WebGL иллюстрациясы.
- Parallax элементтері (жеңіл деңгейде).
- Scroll reveal.
- Animated gradient background.

Анимация қозғалысы `prefers-reduced-motion` арқылы өшірілуі тиіс.

Үлкен blur, particle және WebGL эффектілерін шамадан тыс қолдануға болмайды.

# 3. ҚАЗАҚША ЖӘНЕ ОРЫСША ЛОКАЛИЗАЦИЯ

Платформа екі тілде толық жұмыс істеуі тиіс.

## 3.1. i18n архитектурасы

Технология: **next-intl**.

URL құрылымы:

- `/kk/dashboard`
- `/ru/dashboard`
- `/kk/digital-twin`
- `/ru/digital-twin`

Default locale: `kk`.

Тіл ауыстырылған кезде:
- Ағымдағы бет сақталады.
- Интерфейс мәтіндері өзгереді.
- Қате хабарламалары аударылады.
- Форма validation хабарламалары өзгереді.
- Графиктердің атаулары өзгереді.
- Күн, сан және валюта форматтары locale бойынша бейімделеді.
- AI Assistant таңдалған тілде жауап береді.

Таңдалған тіл пайдаланушы профилінде немесе браузердегі cookie ішінде сақталады.

## 3.2. Аударма сөздіктері

Файлдар:

`messages/kk.json`

`messages/ru.json`

Мысал:

```json
{
  "dashboard": {
    "title": "Басқару панелі",
    "revenue": "Жалпы түсім",
    "profit": "Таза пайда",
    "visitors": "Келушілер саны",
    "forecast": "Сатылым болжамы"
  }
}
```

Орысша:

```json
{
  "dashboard": {
    "title": "Панель управления",
    "revenue": "Общая выручка",
    "profit": "Чистая прибыль",
    "visitors": "Количество посетителей",
    "forecast": "Прогноз продаж"
  }
}
```

Барлық UI мәтіндері translation key арқылы беріледі. JSX ішінде аударылмаған қазақша немесе орысша мәтінді hardcode жасауға болмайды.

Өнімнің атауы QALA TWIN AI ретінде қалады.

# 4. ПЛАТФОРМАНЫҢ БЕТТЕРІ

## 4.1. Landing Page

Route: `/kk` немесе `/ru`

Жоба туралы кәсіби landing page.

Блоктар:

1. Premium animated hero.
2. Digital Twin 3D preview.
3. Жүйенің негізгі мүмкіндіктері.
4. How It Works.
5. Business Impact.
6. AI Technology.
7. Interactive Dashboard Preview.
8. Call To Action.
9. Footer.

Hero:

**QALA TWIN AI**

Қазақша:

"Бизнесіңіздің цифрлық егізі. Ақылды шешімдер. Нақты нәтижелер."

Орысша:

"Цифровой двойник вашего бизнеса. Умные решения. Измеримые результаты."

Батырмалар:

- Платформаны ашу / Открыть платформу.
- Демоны көру / Смотреть демо.

Hero фонында оптимизацияланған 3D дүкен моделі болуы керек.

## 4.2. Authentication

Routes:
- `/[locale]/login`
- `/[locale]/register`

Функциялар:
- Email және password.
- Login.
- Registration.
- Logout.
- Demo Login.
- Form validation.
- Loading / error states.

Технология: Supabase Auth.

MVP demo режимінде алдын ала жасалған аккаунт қолданылуы тиіс.

Құпиясөз клиент кодында сақталмайды.

## 4.3. Dashboard

Route: `/[locale]/dashboard`

Негізгі блоктар:

- Total Revenue.
- Net Profit.
- Current Occupancy.
- Average Queue Time.
- Forecast Revenue.
- Potential Savings.
- Revenue Chart.
- Visitor Flow Chart.
- Peak Hours.
- AI Insights.
- Business Health Score.

Business Health Score есептеу үшін шығын, сатылым динамикасы, қор тапшылығы және кезек ұзақтығы сияқты нақты анықталған көрсеткіштер қолданылады.

Есептеу формуласы жүйеде құжатталуы тиіс.

Dashboard деректері API-дан алынады.

## 4.4. Live AI Vision

Route: `/[locale]/vision`

Функциялар:

- Ноутбук камерасын қосу.
- Video upload.
- Person Detection.
- Person Tracking.
- Entry/Exit counting.
- Queue Zone.
- Current Occupancy.
- AI Analytics.

Интерфейс:

Сол жақта камера.

Оң жақта:
- Detection statistics.
- Camera status.
- Visitor history.
- Queue status.
- Current FPS.

Төменгі бөлікте:
- Timeline.
- Detection events.
- Zone configuration.

Камераны қосу үшін пайдаланушының рұқсаты қажет.

Браузер камерасы HTTPS немесе localhost ортасында жұмыс істеуі тиіс.

Backend-та өңдеу үшін кадрларды шектеулі жиілікпен жіберуге немесе локалды Python vision worker қолдануға болады.

Бір кадрдан адам санын анықтау — негізгі функция. Entry/Exit tracking үшін видео ағыны мен tracking state қажет.

## 4.5. Digital Twin 3D

Route: `/[locale]/digital-twin`

Full-screen interactive 3D interface.

Элементтер:
- 3D Store.
- Cash Desk.
- Product Shelves.
- Entrance / Exit.
- Customer Avatars.
- Zone Indicators.
- Heatmap Layer.
- Control Panel.
- Live Statistics.

3D функциялар:
- Orbit Controls.
- Zoom.
- Pan.
- Reset Camera.
- Top View.
- Isometric View.
- Show/Hide Heatmap.
- Show/Hide Labels.
- Pause Simulation.

Камерадан келген occupancy мәні Digital Twin күйімен синхрондалады.

Нақты орналасу координаттары алынбаған жағдайда модель адамдарды шартты түрде орналастырады.

**Нақты клиент қозғалысы мен симуляция қозғалысы интерфейсте міндетті түрде ажыратылсын.**

## 4.6. AI Business Simulator

Route: `/[locale]/simulator`

Интерактивті бизнес модельдеу интерфейсі.

Үш негізгі сценарий:

**A. Cashier Optimization**

Input:
- Customers per hour.
- Service time.
- Number of cashiers.
- Labor cost.

Output:
- Average waiting time.
- Queue length.
- Served customers.
- Operational cost.

Механизм: дискретті оқиғалық симуляция.

**B. Price Optimization**

Input:
- Current price.
- Purchase cost.
- Average sales.
- Price change percentage.
- Assumed elasticity.

Output:
- New revenue.
- New gross profit.
- Demand scenario.
- Comparison chart.

**C. Inventory Optimization**

Input:
- Current stock.
- Daily demand.
- Lead time.
- Safety stock.

Output:
- Forecast demand.
- Reorder quantity.
- Stockout risk.
- Suggested action.

Барлық сценарийде Before / After салыстыру болуы қажет.

Симуляция нәтижелері шынайы болжам немесе кепілдендірілген қаржылық нәтиже ретінде көрсетілмейді.

## 4.7. Sales Analytics

Route: `/[locale]/analytics`

Функциялар:

- Excel/CSV импорттау.
- Сатылым тарихы.
- Revenue Analytics.
- Cost Analytics.
- Profit Analysis.
- Product Ranking.
- Forecasting.
- Filtering.
- Export.

Импорттау форматтары:

CSV, XLSX.

Міндетті бағандар:

- date
- product_name
- quantity
- unit_price
- unit_cost

Жүктеу барысында:
- Бағандарды сәйкестендіру.
- Форматты тексеру.
- Қате жолдарды көрсету.
- Импорт нәтижесін алдын ала қарау.

Таза пайда есептеу үшін операциялық шығындар енгізілмесе, тек gross profit көрсетіледі.

Болжам жасау:
- Кемінде 14 күндік дерек болса baseline forecast.
- Тарих жеткіліксіз болса forecast unavailable.
- 7 күндік болжам.
- Нақты және болжам мәндерін бөлек көрсету.
- Болжам сапасын тарихи деректермен тексеру.

## 4.8. AI Business Advisor

Route: `/[locale]/ai-assistant`

Пайдаланушы өз бизнесі туралы сұрақ қоя алады.

Мысалдар:

"Қай тауар көп пайда әкеледі?"

"Ертең қанша өнімге тапсырыс беру қажет?"

"Кассаның кезегін қалай азайтамын?"

"Соңғы аптада табыс неге төмендеді?"

AI жауап бергенде API арқылы алынған бизнес көрсеткіштеріне сүйенуі тиіс.

Архитектура:

1. User question.
2. Intent parsing.
3. Required business data retrieval.
4. Deterministic calculations.
5. AI explanation generation.
6. Localized response.

OpenAI API тек түсіндіру, қорытындылау және ұсыныстар дайындау үшін қолданылады.

Қаржылық есептер backend-та орындалады.

AI жоқ деректерді ойдан шығармауы керек.

Деректер жетіспесе, оны нақты айтуы тиіс.

## 4.9. Inventory Management

Route: `/[locale]/inventory`

Тауарлар кестесі:

- Product Name.
- SKU.
- Category.
- Current Stock.
- Unit Cost.
- Selling Price.
- Average Daily Sales.
- Reorder Point.
- Stock Status.

Функциялар:
- Add Product.
- Edit Product.
- Delete Product.
- Stock Adjustment.
- Search.
- Filter.
- Low Stock Alerts.
- Suggested Reorder.

## 4.10. Reports

Route: `/[locale]/reports`

Есеп түрлері:
- Sales Summary.
- Business Performance.
- Visitor Statistics.
- Inventory Risk.
- Simulation Results.

Экспорт:
- PDF.
- CSV.

PDF есебінде ұйым атауы, есеп кезеңі, негізгі көрсеткіштер, графиктер және ұсыныстар болады.

## 4.11. Settings

Route: `/[locale]/settings`

- Business Profile.
- Language.
- Theme.
- Currency — KZT.
- Camera Configuration.
- AI Settings.
- Account Settings.
- Demo Mode.
- Data Management.

---

# 5. BACKEND API

API prefix: `/api/v1`

## Authentication
- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`

Supabase Auth қолданылған жағдайда token validation серверде жасалуы тиіс.

## Dashboard
- `GET /dashboard/overview`
- `GET /dashboard/revenue`
- `GET /dashboard/visitors`
- `GET /dashboard/insights`

## Vision
- `GET /vision/cameras`
- `POST /vision/analyze-frame`
- `POST /vision/analyze-video`
- `GET /vision/stats`
- `GET /vision/events`

## Digital Twin
- `GET /twin/state`
- `GET /twin/layout`
- `PATCH /twin/layout`
- `GET /twin/occupancy`

## Simulator
- `POST /simulator/queue`
- `POST /simulator/pricing`
- `POST /simulator/inventory`

## Analytics
- `POST /analytics/import`
- `GET /analytics/sales`
- `GET /analytics/products`
- `GET /analytics/forecast`

## AI
- `POST /ai/chat`
- `GET /ai/insights`

## Inventory
- `GET /inventory`
- `POST /inventory`
- `PATCH /inventory/{id}`
- `DELETE /inventory/{id}`

## Reports
- `GET /reports`
- `POST /reports/generate`
- `GET /reports/{id}/download`

Әр endpoint үшін request/response Pydantic schemas, validation, authentication және error responses құрастырылуы тиіс.

---

# 6. DATABASE STRUCTURE

PostgreSQL кестелері:

### users
- id UUID PK
- email
- full_name
- role
- preferred_locale
- created_at

### businesses
- id UUID PK
- owner_id FK
- name
- business_type
- city
- created_at

### products
- id UUID PK
- business_id FK
- sku
- name
- category
- cost_price
- selling_price
- stock_quantity
- created_at

### sales
- id UUID PK
- business_id FK
- product_id FK
- quantity
- unit_price
- unit_cost
- sold_at

### expenses
- id UUID PK
- business_id FK
- category
- amount
- occurred_at

### cameras
- id UUID PK
- business_id FK
- name
- location
- status
- created_at

### vision_events
- id UUID PK
- camera_id FK
- event_type
- person_count
- queue_count
- timestamp

### twin_layouts
- id UUID PK
- business_id FK
- layout_json
- version
- updated_at

### simulation_runs
- id UUID PK
- business_id FK
- scenario_type
- input_json
- result_json
- created_at

### ai_insights
- id UUID PK
- business_id FK
- type
- severity
- title
- description
- evidence_json
- created_at

### import_jobs
- id UUID PK
- business_id FK
- filename
- status
- imported_count
- rejected_count
- created_at

Барлық деректер business_id арқылы тиісті ұйымға байланыстырылуы қажет.

Ақшалай деректерге PostgreSQL NUMERIC типі пайдаланылады, float қолданылмайды.

Индекстер business_id және уақыт бойынша жиі сұралатын өрістерге қойылады.

---

# 7. FRONTEND АРХИТЕКТУРАСЫ

Ұсынылатын құрылым:

```text
qala-twin-ai/
├── frontend/
│   ├── app/
│   │   └── [locale]/
│   │       ├── page.tsx
│   │       ├── login/
│   │       ├── register/
│   │       └── (platform)/
│   │           ├── dashboard/
│   │           ├── vision/
│   │           ├── digital-twin/
│   │           ├── simulator/
│   │           ├── analytics/
│   │           ├── inventory/
│   │           ├── ai-assistant/
│   │           ├── reports/
│   │           └── settings/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── vision/
│   │   ├── twin/
│   │   ├── simulator/
│   │   ├── charts/
│   │   └── animations/
│   ├── lib/
│   ├── hooks/
│   ├── stores/
│   ├── types/
│   ├── messages/
│   │   ├── kk.json
│   │   └── ru.json
│   └── public/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── vision/
│   │   ├── forecasting/
│   │   ├── simulation/
│   │   └── ai/
│   ├── tests/
│   └── requirements.txt
├── database/
│   ├── migrations/
│   └── seed/
├── docker-compose.yml
├── .env.example
└── README.md
```

Әр модуль бөлек ұйымдастырылуы керек.

Frontend пен backend арасында типтелген API контракт қолданылсын.

---

# 8. MVP DEMO MODE

Бұл — хакатон үшін міндетті функция.

Demo Mode іске қосылғанда алдын ала дайындалған виртуалды бизнес ашылуы тиіс.

**Demo Business:** QALA MART  
**Location:** Taraz, Kazakhstan  
**Business Type:** Retail Grocery Store

Демо деректер:
- 30 күндік сатылым.
- 40–60 тауар.
- Тауарлардың сатып алу және сату бағасы.
- Қор мөлшері.
- Операциялық шығындар.
- Камера статистикасының үлгісі.
- Тауар тапшылығы сценарийлері.

Демо режиміндегі барлық көрсеткіштер бір-бірімен математикалық сәйкес болуы тиіс.

Мысалы, сатылымдардың жиынтығы Dashboard-тағы total revenue-ға тең болсын.

**Demo Flow:**

1. Open Landing Page.
2. Click Explore Demo.
3. Open Dashboard.
4. Show Real-Time Vision.
5. Open Digital Twin.
6. Run Queue Simulation.
7. Compare One vs Two Cashiers.
8. Open AI Advisor.
9. Show Potential Savings.
10. Export Business Report.

MVP-де қазыларға бүкіл сценарийді 3–5 минутта көрсету мүмкіндігі болуы керек.

---

# 9. PERFORMANCE, SECURITY & RELIABILITY

## Performance
- Lighthouse Performance target: 85+.
- Responsive layout.
- Lazy loading for 3D.
- Code splitting.
- Optimized assets.
- 3D модель үшін desktop-та 30 FPS немесе одан жоғары мақсат.
- Slow network кезінде skeleton loader.

## Security
- Secure Authentication.
- Password hashing via auth provider.
- Environment variables.
- OpenAI API key тек backend-та.
- File validation.
- Upload size limits.
- Rate limiting.
- Business-level authorization.
- CORS allowlist.
- SQL injection protection.
- Input validation.

## Reliability
- Error boundaries.
- API timeout handling.
- Retry where appropriate.
- Empty states.
- Offline/error notifications.
- Camera unavailable fallback.
- AI API unavailable fallback.

AI API жұмыс істемесе, қаржылық аналитика мен симулятор жұмысын жалғастыруы тиіс.

---

# 10. MVP ACCEPTANCE CRITERIA

Платформа келесі шарттар орындалғанда дайын болып саналады.

### Localization
- Қазақша және орысша барлық беттерде жұмыс істейді.
- Тіл ауыстырғанда ағымдағы бет сақталады.
- Қазақша мәтін интерфейсті бұзбайды.

### Design
- Біртұтас премиум интерфейс.
- Барлық негізгі экрандар responsive.
- Анимациялар жұмыс істейді.
- Loading, empty және error states бар.

### Business Data
- Excel/CSV жүктеледі.
- Сатылым есептеледі.
- Тауарлар көрсетіледі.
- Қате формат дұрыс өңделеді.

### AI
- AI Assistant нақты бизнес деректерін пайдаланады.
- Жауап тілі дұрыс.
- Жоқ деректер ойдан шығарылмайды.

### Vision
- Ноутбук камерасынан адамдар анықталады.
- Адам саны көрсетіледі.
- Камера жоқ жағдайда қате хабарламасы шығады.
- Бейнені талдау функциясы жұмыс істейді.

### Digital Twin
- 3D дүкен жүктеледі.
- Камераны айналдыруға болады.
- 3D модель occupancy мәнімен байланысады.
- Касса параметрлерін өзгертуге болады.

### Simulator
- Бір және екі кассаның сценарийлері есептеледі.
- Нәтижелер салыстырылады.
- Қайталанатын бастапқы параметрлер бірдей нәтижеге немесе тұрақты статистикалық бағалауға әкеледі.
- Есептеу әдісі құжатталған.

### Demo
- Demo Login жұмыс істейді.
- Демо деректер дайын.
- Ешбір негізгі бет бос немесе істемейтін күйде қалмайды.
- Demo Mode нақты деректерден ажыратылады.

---

# 11. ӘЗІРЛЕУ БАСЫМДЫҒЫ

## P0 — Хакатон MVP үшін міндетті

1. Bilingual Landing Page.
2. Demo Login.
3. Dashboard.
4. CSV/Excel Import.
5. Sales Analytics.
6. AI Business Advisor.
7. Cashier Simulation.
8. Interactive 3D Digital Twin.
9. Basic Camera Person Detection.
10. Demo Data.
11. Responsive Premium UI.
12. Негізгі модульдерге API және database integration.

## P1 — Уақыт болса қосылады

1. Multi-camera support.
2. Advanced tracking.
3. Automated inventory forecast.
4. Advanced heatmap.
5. PDF reports.
6. Full multi-tenant roles.
7. Advanced price optimization.
8. Detailed AI alerts.

## P2 — Хакатоннан кейін

1. POS integration.
2. 1C integration.
3. WhatsApp notifications.
4. Multi-branch management.
5. Production-grade video streaming.
6. Real customer flow analytics across zones.
7. Advanced demand forecasting models.

P1 және P2 элементтері дайын болмаса, оларды жұмыс істейді деп көрсетпеу керек.

---

# 12. TESTING

Міндетті тесттер:

**Backend**
- Revenue calculation tests.
- Gross profit calculation tests.
- Queue simulation tests.
- Forecast input validation tests.
- API authorization tests.
- Import validation tests.

**Frontend**
- Locale switching.
- Login.
- Navigation.
- Dashboard loading.
- CSV upload.
- Simulator inputs.
- Responsive layouts.

**End-to-End**
- Demo Login → Dashboard.
- Import → Analytics.
- Vision → Twin State.
- Simulator → Results.
- AI Question → Localized Answer.

Playwright және pytest қолдану ұсынылады.

---

# 13. DEPLOYMENT

Frontend — Vercel.

Backend — Python қолдайтын hosting.

Database — Supabase PostgreSQL.

Vision worker — ноутбукта немесе GPU қолдайтын серверде.

Deployment талаптары:
- `.env.example` болуы.
- API keys репозиторийге кірмеуі.
- Backend health-check endpoint болуы.
- Demo database seed script болуы.
- Migration скрипттері болуы.
- README ішінде іске қосу нұсқаулығы болуы.

Локалды іске қосу:

```bash
docker compose up -d
```

Frontend және backend бөлек іске қосу командалары README-де көрсетілуі тиіс.

Камерамен жұмыс істеу тәсілі браузер/сервер архитектурасына сай құжатталуы қажет.

---

# 14. AI CODING AGENT ҮШІН НЕГІЗГІ НҰСҚАУЛЫҚ

You are a senior full-stack engineer, AI engineer, 3D visualization engineer, UI/UX designer, and software architect.

Build QALA TWIN AI as a complete, runnable, premium-quality bilingual hackathon MVP.

The application must be functional, not a static dashboard or UI-only prototype.

Prioritize clean architecture, excellent design, beautiful motion, meaningful data visualizations, real backend integrations, and a working demonstration of AI-powered business optimization.

Mandatory requirements:

1. Support Kazakh and Russian across the entire application.
2. Implement premium responsive UI using Next.js, Tailwind CSS and shadcn/ui.
3. Implement polished micro-interactions with Framer Motion.
4. Implement an interactive 3D store digital twin using React Three Fiber.
5. Build a working FastAPI backend.
6. Use PostgreSQL for persistence.
7. Implement Excel/CSV import and real financial calculations.
8. Implement queue simulation with reproducible results.
9. Implement YOLO person detection from webcam or uploaded video.
10. Implement an AI business assistant grounded in business metrics.
11. Include a complete realistic demo dataset.
12. Provide working API routes, models, validation and error handling.
13. Add loading states, empty states and error states.
14. Implement dark mode as the primary theme.
15. Optimize performance and accessibility.
16. Add automated tests for critical calculations and workflows.
17. Create setup instructions and environment configuration.
18. Ensure the demo works without paid AI access by providing clearly labeled deterministic fallback insights.

Do not generate placeholder buttons or fake functionality.

If a feature cannot be completed, remove it from the core demo navigation or explicitly label it as experimental.

All mathematical calculations must be performed by deterministic code rather than invented by the language model.

Simulated, forecast, and live measurements must always be distinguishable.

Implement the project in vertical slices: first establish the runnable architecture, then complete the core financial analytics, simulator, 3D visualization and AI vision modules.

The final result must be deployable and presentable to hackathon judges.

**Final target: A premium enterprise-quality AI business platform MVP with a compelling, functional, three-to-five-minute demonstration.**

---

# 15. ҚОРЫТЫНДЫ НӘТИЖЕ

Әзірлеу нәтижесінде:

- Толық веб-платформа.
- Қазақша және орысша интерфейс.
- Премиум дизайн жүйесі.
- Жұмсақ және сапалы анимациялар.
- Нақты бизнес аналитика.
- AI Business Advisor.
- Жұмыс істейтін камера модулі.
- Интерактивті 3D дүкен.
- AI Simulator.
- Деректер базасы.
- Demo Mode.
- GitHub репозиторийі.
- Deployment.
- Техникалық құжаттама.
- Хакатондағы қорғанысқа дайын көрсету сценарийі болуы тиіс.

**QALA TWIN AI — From Business Data to Intelligent Decisions.**
