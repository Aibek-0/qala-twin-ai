"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion, MotionConfig } from "framer-motion";
import {
  LayoutDashboard,
  ScanLine,
  Boxes,
  FlaskConical,
  ChartNoAxesCombined,
  Package,
  Sparkles,
  FileText,
  Settings,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  ArrowUpRight,
  PanelLeftClose,
  Menu,
  LogOut,
  X,
  Command,
  ArrowRight,
  Store,
  ArrowLeft,
  Check,
} from "lucide-react";
import dynamic from "next/dynamic";
import { api, errorKey, type Business } from "@/lib/api";
import { Button } from "./ui/button";
import { Badge, Failure, Loading, Modal, Spinner } from "./ui/shared";
const Dashboard = dynamic(() => import("./dashboard"), {
  loading: () => <Loading />,
});
const Analytics = dynamic(() => import("./modules/analytics"), {
  loading: () => <Loading />,
});
const Simulator = dynamic(() => import("./modules/simulator"), {
  loading: () => <Loading />,
});
const Inventory = dynamic(() => import("./modules/inventory"), {
  loading: () => <Loading />,
});
const Advisor = dynamic(() => import("./modules/advisor"), {
  loading: () => <Loading />,
});
const DigitalTwin = dynamic(() => import("./modules/digital-twin"), {
  loading: () => <Loading />,
});
const Vision = dynamic(() => import("./modules/vision"), {
  loading: () => <Loading />,
});
const Reports = dynamic(() => import("./modules/reports"), {
  loading: () => <Loading />,
});
const SettingsPage = dynamic(() => import("./modules/settings"), {
  loading: () => <Loading />,
});
const TwinScene = dynamic(() => import("./twin-scene"), {
  ssr: false,
  loading: () => <div className="skeleton scene-skeleton" />,
});
const navigation = [
  { key: "dashboard", icon: LayoutDashboard },
  { key: "digital-twin", icon: Boxes },
  { key: "vision", icon: ScanLine },
  { key: "simulator", icon: FlaskConical },
  { key: "analytics", icon: ChartNoAxesCombined },
  { key: "inventory", icon: Package },
  { key: "ai-assistant", icon: Sparkles },
  { key: "reports", icon: FileText },
];
function Brand() {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <Boxes size={25} />
      </span>
      <span>
        QALA
        <span className="brand-small">
          TWIN AI
          <span className="brand-dot" />
        </span>
      </span>
    </span>
  );
}
export default function App({ page }: { page: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const [business, setBusiness] = useState<Business>();
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [notification, setNotification] = useState(false);
  const [online, setOnline] = useState(true);
  const publicPage = ["landing", "login", "register"].includes(page);
  useEffect(() => {
    document.documentElement.lang = locale;
    const saved = localStorage.getItem("qala_theme") || "dark";
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
    function key(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearch((v) => !v);
      }
    }
    function connected() {
      setOnline(navigator.onLine);
    }
    window.addEventListener("keydown", key);
    window.addEventListener("online", connected);
    window.addEventListener("offline", connected);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("online", connected);
      window.removeEventListener("offline", connected);
    };
  }, [locale]);
  async function load() {
    setError("");
    try {
      setBusiness(await api<Business>("/auth/me"));
    } catch (e) {
      setError(errorKey(e));
      if (errorKey(e) === "unauthorized")
        window.location.replace(`/${locale}/login`);
    }
  }
  useEffect(() => {
    if (!publicPage) void load();
  }, [publicPage]);
  function changeTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("qala_theme", next);
    document.documentElement.dataset.theme = next;
  }
  function changeLocale() {
    const next = locale === "kk" ? "ru" : "kk";
    document.cookie = `qala_locale=${next};path=/;max-age=31536000;samesite=lax`;
    window.location.assign(`/${next}${page === "landing" ? "" : "/" + page}`);
  }
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
      window.location.assign(`/${locale}`);
    } catch (e) {
      setError(errorKey(e));
    }
  }
  const commonControls = (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={changeLocale}
        aria-label={t("language")}
      >
        {locale === "kk" ? "ҚАЗ" : "РУС"}
        <ChevronDown size={12} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={changeTheme}
        aria-label={t("theme")}
      >
        {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      </Button>
    </>
  );
  return (
    <MotionConfig reducedMotion="user">
      {publicPage ? (
        <div className="public-site">
          <header className="public-header">
            <Link href={`/${locale}`}>
              <Brand />
            </Link>
            <nav>
              <Link href={`/${locale}#how`}>{t("howItWorks")}</Link>
              <Link href={`/${locale}#technology`}>{t("technology")}</Link>
            </nav>
            <div className="header-controls">
              {commonControls}
              <Button variant="outline" asChild>
                <Link href={`/${locale}/login`}>
                  {t("login")}
                  <ArrowUpRight size={15} />
                </Link>
              </Button>
            </div>
          </header>
          {page === "landing" ? (
            <Landing />
          ) : (
            <Auth register={page === "register"} />
          )}
          <footer>
            <Brand />
            <span>{t("footer")}</span>
            <span>© 2026 QALA TWIN AI</span>
          </footer>
        </div>
      ) : (
        <div
          className={
            "app-shell " +
            (collapsed ? "collapsed " : "") +
            (mobile ? "mobile-open" : "")
          }
        >
          {mobile && (
            <button
              className="sidebar-overlay"
              onClick={() => setMobile(false)}
              aria-label={t("close")}
            />
          )}
          <aside className="sidebar">
            <Link className="sidebar-brand" href={`/${locale}`}>
              <Brand />
            </Link>
            <div className="business-switch">
              <span className="store-icon">
                <Store size={19} />
              </span>
              <div>
                <strong>{business?.name || "QALA MART"}</strong>
                <small>{business?.city || "Taraz"} · KZ</small>
              </div>
              <ChevronDown size={14} />
            </div>
            <span className="nav-label">{t("workspace")}</span>
            <nav>
              {navigation.map((n, i) => (
                <div key={n.key}>
                  {i === 4 && (
                    <span className="nav-label section-label">
                      {t("intelligence")}
                    </span>
                  )}
                  <Link
                    className={"nav-link " + (page === n.key ? "active" : "")}
                    href={`/${locale}/${n.key}`}
                    onClick={() => setMobile(false)}
                    title={t(n.key)}
                  >
                    <n.icon size={19} />
                    <span>{t(n.key)}</span>
                    {n.key === "ai-assistant" && (
                      <span className="nav-ai">AI</span>
                    )}
                    {page === n.key && <span className="nav-active-dot" />}
                  </Link>
                </div>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="demo-card">
                <span className="demo-orb">
                  <Sparkles size={19} />
                </span>
                <strong>{t(business?.is_demo ? "demo" : "business")}</strong>
                <p>{business?.is_demo ? "QALA MART · 48 SKU" : "KZT"}</p>
                <Link href={`/${locale}/reports`}>
                  {t("reports")}
                  <ArrowUpRight size={14} />
                </Link>
              </div>
              <Link
                className={"nav-link " + (page === "settings" ? "active" : "")}
                href={`/${locale}/settings`}
              >
                <Settings size={18} />
                <span>{t("settings")}</span>
              </Link>
              <button
                className="nav-link"
                onClick={() => setCollapsed(!collapsed)}
                title={t("collapse")}
              >
                <PanelLeftClose size={18} />
                <span>{t("collapse")}</span>
              </button>
              <div className="user-profile">
                <span className="avatar">QM</span>
                <div>
                  <strong>{business?.name || "QALA MART"}</strong>
                  <small>{t(business?.is_demo ? "demo" : "business")}</small>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  aria-label={t("logout")}
                >
                  <LogOut size={16} />
                </Button>
              </div>
            </div>
          </aside>
          <div className="main-shell">
            <header className="topbar">
              <div className="breadcrumb">
                <Button
                  className="mobile-menu"
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobile(true)}
                  aria-label={t("menu")}
                >
                  <Menu size={20} />
                </Button>
                <span>{t("business")}</span>
                <span className="breadcrumb-slash">/</span>
                <strong>{t(page)}</strong>
              </div>
              <button
                className="search-trigger"
                onClick={() => setSearch(true)}
              >
                <Search size={15} />
                <span>{t("search")}</span>
                <kbd>
                  <Command size={11} /> K
                </kbd>
              </button>
              <div className="header-controls">
                <span
                  className={"connection " + (!online ? "disconnected" : "")}
                >
                  <i />
                  {t(online ? "online" : "offline")}
                </span>
                {commonControls}
                <div className="notification-wrap">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setNotification(!notification)}
                    aria-label={t("notifications")}
                  >
                    <Bell size={18} />
                  </Button>
                  {notification && (
                    <div className="notification-popover panel">
                      <h3>{t("notifications")}</h3>
                      <p>{t("notificationsEmpty")}</p>
                    </div>
                  )}
                </div>
                <span className="avatar small">QM</span>
              </div>
            </header>
            <main className="content">
              <div className="source-bar">
                <span>
                  <i />
                  {t(business?.is_demo ? "demoNote" : "imported")}
                </span>
                <span className="source-brand">
                  SEE <b>→</b> ANALYZE <b>→</b> PREDICT <b>→</b> SIMULATE{" "}
                  <b>→</b> OPTIMIZE
                </span>
              </div>
              {error ? (
                <Failure code={error} retry={load} />
              ) : !business ? (
                <Loading />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {page === "dashboard" ? (
                    <Dashboard />
                  ) : page === "analytics" ? (
                    <Analytics />
                  ) : page === "simulator" ? (
                    <Simulator />
                  ) : page === "inventory" ? (
                    <Inventory />
                  ) : page === "ai-assistant" ? (
                    <Advisor />
                  ) : page === "digital-twin" ? (
                    <DigitalTwin />
                  ) : page === "vision" ? (
                    <Vision />
                  ) : page === "reports" ? (
                    <Reports />
                  ) : (
                    <SettingsPage
                      business={business}
                      theme={theme}
                      changeTheme={changeTheme}
                      changeLocale={changeLocale}
                      onSave={load}
                    />
                  )}
                </motion.div>
              )}
              <div className="workspace-footer">
                <span>QALA TWIN AI</span>
                <span>{t("footer")}</span>
              </div>
            </main>
          </div>
          {search && (
            <Modal title={t("searchPages")} onClose={() => setSearch(false)}>
              <input
                autoFocus
                placeholder={t("search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="search-results">
                {navigation
                  .filter((n) =>
                    t(n.key).toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((n) => (
                    <Link
                      key={n.key}
                      href={`/${locale}/${n.key}`}
                      onClick={() => setSearch(false)}
                    >
                      <n.icon size={19} />
                      {t(n.key)}
                      <ArrowRight size={15} />
                    </Link>
                  ))}
              </div>
            </Modal>
          )}
        </div>
      )}
    </MotionConfig>
  );
}
function Auth({ register }: { register: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  async function demo() {
    setBusy("demo");
    setError("");
    try {
      await api("/auth/demo", { method: "POST" });
      window.location.assign(`/${locale}/dashboard`);
    } catch (e) {
      setError(errorKey(e));
      setBusy("");
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy("auth");
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const r = await api<{ confirmation_required?: boolean }>(
        register ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: f.get("email"),
            password: f.get("password"),
          }),
        },
      );
      if (r.confirmation_required) {
        setConfirm(true);
        setBusy("");
      } else window.location.assign(`/${locale}/dashboard`);
    } catch (e) {
      setError(errorKey(e));
      setBusy("");
    }
  }
  return (
    <main className="auth-main">
      <div className="auth-visual">
        <span className="eyebrow">QALA TWIN AI</span>
        <h1>{t("heroTitle")}</h1>
        <div className="auth-scene">
          <TwinScene compact />
        </div>
        <p>{t("heroSub")}</p>
      </div>
      <section className="auth-form panel">
        <span className="icon-chip blue">
          <Boxes size={25} />
        </span>
        <h1>{t(register ? "createAccount" : "authTitle")}</h1>
        <p>{t("authSub")}</p>
        {error && <Failure code={error} />}
        <form onSubmit={submit}>
          <label>
            {t("email")}
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.kz"
              maxLength={254}
            />
          </label>
          <label>
            {t("password")}
            <input
              name="password"
              type="password"
              required
              autoComplete={register ? "new-password" : "current-password"}
              minLength={8}
              maxLength={128}
              placeholder="••••••••"
            />
          </label>
          <Button disabled={!!busy}>
            {busy === "auth" ? <Spinner /> : null}
            {t(register ? "register" : "login")}
            <ArrowRight size={16} />
          </Button>
        </form>
        {confirm && (
          <div className="notice">
            <Check size={18} />
            {t("confirmEmail")}
          </div>
        )}
        <div className="auth-divider">
          <span>QALA MART</span>
        </div>
        <Button variant="outline" disabled={!!busy} onClick={demo}>
          {busy === "demo" ? <Spinner /> : <Sparkles size={17} />}{" "}
          {t("exploreDemo")}
        </Button>
        <small>{t("authHint")}</small>
        <p className="auth-link">
          {t(register ? "haveAccount" : "noAccount")}{" "}
          <Link href={`/${locale}/${register ? "login" : "register"}`}>
            {t(register ? "login" : "register")}
          </Link>
        </p>
      </section>
    </main>
  );
}
function Landing() {
  const t = useTranslations();
  const locale = useLocale();
  const reduced = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function demo() {
    setBusy(true);
    try {
      await api("/auth/demo", { method: "POST" });
      window.location.assign(`/${locale}/dashboard`);
    } catch (e) {
      setError(errorKey(e));
      setBusy(false);
    }
  }
  const steps = [
    { key: "see", icon: ScanLine },
    { key: "analyze", icon: ChartNoAxesCombined },
    { key: "predict", icon: Sparkles },
    { key: "simulate", icon: FlaskConical },
    { key: "optimize", icon: TrendingIcon },
  ];
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-grid" />
        <motion.div
          className="hero-copy"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge>
            <span className="pulse-dot" />
            {t("heroEyebrow")}
          </Badge>
          <h1>{t("heroTitle")}</h1>
          <p>{t("heroSub")}</p>
          <div className="hero-actions">
            <Button onClick={demo} disabled={busy}>
              {busy ? <Spinner /> : <Sparkles size={17} />} {t("exploreDemo")}
              <ArrowRight size={17} />
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/login`}>
                {t("openPlatform")}
                <ArrowUpRight size={16} />
              </Link>
            </Button>
          </div>
          {error && <Failure code={error} />}
          <span className="hero-footnote">
            <i />
            {t("heroFootnote")}
          </span>
        </motion.div>
        <motion.div
          className="hero-model"
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="model-topline">
            <span>
              <i /> QALA MART / DIGITAL TWIN
            </span>
            <Badge>{t("demo")}</Badge>
          </div>
          <TwinScene compact />
          <div className="model-stats">
            <div>
              <small>{t("occupancy")}</small>
              <strong>
                18 <span>{t("people")}</span>
              </strong>
            </div>
            <div>
              <small>{t("product")}</small>
              <strong>
                48 <span>SKU</span>
              </strong>
            </div>
            <div>
              <small>{t("source")}</small>
              <strong className="positive">{t("demo")}</strong>
            </div>
          </div>
        </motion.div>
      </section>
      <div className="technology-strip">
        <span>SEE</span>
        <i>→</i>
        <span>ANALYZE</span>
        <i>→</i>
        <span>PREDICT</span>
        <i>→</i>
        <span>SIMULATE</span>
        <i>→</i>
        <span>OPTIMIZE</span>
      </div>
      <section className="landing-section" id="how">
        <span className="eyebrow">01 / QALA INTELLIGENCE</span>
        <h2>{t("howItWorks")}</h2>
        <p>{t("howSub")}</p>
        <div className="steps-grid">
          {steps.map((s, i) => (
            <motion.article
              className="panel"
              key={s.key}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <div>
                <span className="icon-chip blue">
                  <s.icon size={20} />
                </span>
                <span className="step-number">0{i + 1}</span>
              </div>
              <h3>{t(s.key)}</h3>
              <p>{t(s.key + "Body")}</p>
            </motion.article>
          ))}
        </div>
      </section>
      <section className="landing-section impact">
        <div>
          <span className="eyebrow">02 / BUSINESS IMPACT</span>
          <h2>{t("impactTitle")}</h2>
          <p>{t("impactSub")}</p>
          <Button variant="outline" onClick={demo} disabled={busy}>
            {t("exploreDemo")}
            <ArrowRight size={16} />
          </Button>
        </div>
        <div className="impact-metrics">
          {["impact1", "impact2", "impact3"].map((k, i) => (
            <div className="panel" key={k}>
              <strong>
                {[48, 30, 3][i]}
                <span>+</span>
              </strong>
              <p>{t(k)}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="landing-section tech-section" id="technology">
        <Sparkles size={30} />
        <h2>{t("technology")}</h2>
        <p>{t("technologySub")}</p>
        <div className="tech-pills">
          {["Next.js", "FastAPI", "YOLO", "PostgreSQL", "Three.js"].map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </section>
      <section className="cta panel">
        <span className="eyebrow">QALA TWIN AI</span>
        <h2>{t("ctaTitle")}</h2>
        <p>{t("ctaSub")}</p>
        <Button onClick={demo} disabled={busy}>
          {busy ? <Spinner /> : <Sparkles size={17} />} {t("exploreDemo")}
          <ArrowRight size={17} />
        </Button>
      </section>
    </main>
  );
}
function TrendingIcon({ size = 20 }: { size?: number }) {
  return <ChartNoAxesCombined size={size} />;
}
