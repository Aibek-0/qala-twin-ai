"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  TrendingUp,
  ArrowUpRight,
  Wallet,
  Users,
  Sparkles,
  Package,
  ScanLine,
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { api, errorKey, fmt, type Overview } from "@/lib/api";
import { RevenueChart, VisitorChart } from "./charts";
import { Badge, Loading, Failure, Empty } from "./ui/shared";
import { Button } from "./ui/button";
import AnimatedNumber from "./ui/animated-number";
const TwinScene = dynamic(() => import("./twin-scene"), {
  ssr: false,
  loading: () => <div className="skeleton scene-skeleton" />,
});
export default function Dashboard() {
  const t = useTranslations();
  const locale = useLocale();
  const reduced = useReducedMotion();
  const [data, setData] = useState<Overview>();
  const [visitors, setVisitors] = useState<
    { hour: string; visitors: number }[]
  >([]);
  const [error, setError] = useState("");
  const [range, setRange] = useState({ start: "", end: "" });
  const [showRange, setShowRange] = useState(false);
  async function load() {
    setError("");
    try {
      const [d, v] = await Promise.all([
        api<Overview>(
          "/dashboard/overview" +
            (range.start || range.end ? "?" + new URLSearchParams(range) : ""),
        ),
        api<{ hourly: { hour: string; visitors: number }[] }>(
          "/dashboard/visitors",
        ),
      ]);
      setData(d);
      setVisitors(v.hourly);
    } catch (e) {
      setError(errorKey(e));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  if (error) return <Failure code={error} retry={load} />;
  if (!data) return <Loading />;
  if (!data.daily.length) return <Empty />;
  const kpis = [
    {
      key: "revenue",
      value: fmt(data.revenue, locale, true),
      icon: Wallet,
      color: "blue",
      sub:
        data.growth !== null
          ? `${data.growth >= 0 ? "+" : ""}${fmt(data.growth, locale)}%`
          : null,
    },
    {
      key: data.net_profit === null ? "grossProfit" : "netProfit",
      value: fmt(data.net_profit ?? data.gross_profit, locale, true),
      icon: TrendingUp,
      color: "green",
      sub: `${fmt(data.margin, locale)}% ${t("margin")}`,
    },
    {
      key: "occupancy",
      value: fmt(data.occupancy, locale),
      icon: Users,
      color: "purple",
      sub: t(data.occupancy_source),
    },
    {
      key: "forecastTotal",
      value: data.forecast.available
        ? fmt(
            data.forecast.days.reduce((sum, d) => sum + Number(d.revenue), 0),
            locale,
            true,
          )
        : "—",
      icon: ChartNoAxesCombined,
      color: "orange",
      sub: t("forecast"),
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">QALA MART / {t("overview")}</div>
          <h1>{t("welcome")}</h1>
          <p>{t("dashboardSub")}</p>
        </div>
        <div className="heading-actions">
          <div className="range-wrap">
            <Button variant="outline" onClick={() => setShowRange(!showRange)}>
              <CalendarDays size={16} />
              {data.period.start &&
                new Date(data.period.start + "T12:00:00").toLocaleDateString(
                  locale,
                  { day: "numeric", month: "short" },
                )}{" "}
              —{" "}
              {data.period.end &&
                new Date(data.period.end + "T12:00:00").toLocaleDateString(
                  locale,
                  { day: "numeric", month: "short" },
                )}
            </Button>
            {showRange && (
              <form
                className="range-popover panel"
                onSubmit={(e) => {
                  e.preventDefault();
                  void load();
                  setShowRange(false);
                }}
              >
                <label>
                  {t("start")}
                  <input
                    type="date"
                    required
                    value={range.start}
                    onChange={(e) =>
                      setRange({ ...range, start: e.target.value })
                    }
                  />
                </label>
                <label>
                  {t("end")}
                  <input
                    type="date"
                    required
                    value={range.end}
                    onChange={(e) =>
                      setRange({ ...range, end: e.target.value })
                    }
                  />
                </label>
                <Button>{t("apply")}</Button>
              </form>
            )}
          </div>
          <Button asChild>
            <Link href={`/${locale}/analytics`}>
              <span>+</span>
              {t("import")}
            </Link>
          </Button>
        </div>
      </div>
      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <motion.div
            className="kpi panel"
            key={k.key}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="kpi-top">
              <span>{t(k.key)}</span>
              <span className={"icon-chip " + k.color}>
                <k.icon size={17} />
              </span>
            </div>
            <div className="kpi-value">
              <AnimatedNumber
                value={
                  i === 0
                    ? data.revenue
                    : i === 1
                      ? (data.net_profit ?? data.gross_profit)
                      : i === 2
                        ? data.occupancy
                        : data.forecast.available
                          ? data.forecast.days.reduce(
                              (sum, d) => sum + Number(d.revenue),
                              0,
                            )
                          : null
                }
                locale={locale}
                currency={i !== 2}
              />
            </div>
            <div className="kpi-foot">
              {i === 0 ? (
                <>
                  <span className="positive">
                    <ArrowUpRight size={13} />
                    {k.sub}
                  </span>
                  <span>{t("fromPrevious")}</span>
                </>
              ) : (
                <span className={i === 1 ? "positive" : ""}>{k.sub}</span>
              )}
              {i !== 2 && (
                <svg
                  className={"sparkline " + k.color}
                  viewBox="0 0 80 24"
                  aria-hidden="true"
                >
                  <path
                    d={sparkPath(
                      (i === 1
                        ? data.daily.map((d) => Number(d.profit || 0))
                        : i === 3
                          ? data.forecast.days.map((d) => Number(d.revenue))
                          : data.daily.map((d) => Number(d.revenue))
                      ).slice(-10),
                    )}
                  />
                </svg>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="dashboard-main">
        <section className="panel revenue-panel">
          <div className="panel-head">
            <div>
              <h2>{t("revenueDynamics")}</h2>
              <p>{t("revenueSub")}</p>
            </div>
            <div className="chart-legend">
              <span>
                <i />
                {t("revenue")}
              </span>
              <span>
                <i className="green-dot" />
                {t("profit")}
              </span>
            </div>
          </div>
          <RevenueChart data={data.daily} />
          <div className="chart-bottom">
            <span>
              {t("grossProfit")}{" "}
              <strong>{fmt(data.gross_profit, locale, true)}</strong>
            </span>
            <span>
              {t("expenses")}{" "}
              <strong>{fmt(data.expenses, locale, true)}</strong>
            </span>
            <Badge tone="green">{t(data.is_demo ? "demo" : "actual")}</Badge>
          </div>
        </section>
        <section className="panel health-panel">
          <div className="panel-head">
            <h2>{t("health")}</h2>
            <span className="muted">↗</span>
          </div>
          <div
            className="health-ring"
            style={
              { "--score": `${data.health_score || 0}%` } as React.CSSProperties
            }
          >
            <div>
              <strong>{data.health_score ?? "—"}</strong>
              <span>/ 100</span>
            </div>
          </div>
          <Badge tone="green">{t("healthGood")}</Badge>
          <p className="health-note">{t("healthHint")}</p>
          <div className="health-row">
            <span>{t("margin")}</span>
            <strong>{data.margin}%</strong>
          </div>
          <div className="health-row">
            <span>{t("lowStock")}</span>
            <strong className="warning-text">{data.low_stock}</strong>
          </div>
        </section>
      </div>
      <div className="dashboard-secondary">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>{t("visitorsFlow")}</h2>
              <p>{t("visitorsSub")}</p>
            </div>
            <Badge>{t(data.is_demo ? "demo" : "unavailable")}</Badge>
          </div>
          {visitors.length ? <VisitorChart data={visitors} /> : <Empty />}
          <div className="peak-note">
            <span className="icon-chip purple">
              <Users size={16} />
            </span>
            <div>
              <span>{t("peak")}</span>
              <strong>{t("peakHours")}</strong>
            </div>
            <span className="peak-bars">▂▃▅▇▅▃</span>
          </div>
        </section>
        <section className="panel twin-preview">
          <div className="panel-head">
            <div>
              <h2>{t("twinPreview")}</h2>
              <p>{t("twinPreviewSub")}</p>
            </div>
            <ScanLine size={18} className="accent" />
          </div>
          <div className="mini-scene">
            <TwinScene occupancy={data.occupancy} compact />
          </div>
          <div className="scene-caption">
            <Badge>{t(data.occupancy_source)}</Badge>
            <Link href={`/${locale}/digital-twin`}>
              {t("openTwin")}
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
        <section className="panel insights-panel">
          <div className="panel-head">
            <h2>
              <Sparkles size={17} />
              {t("aiInsights")}
            </h2>
            <Badge tone="purple">AI</Badge>
          </div>
          {[
            { key: "Stock", icon: Package, color: "orange", link: "inventory" },
            { key: "Queue", icon: Users, color: "blue", link: "simulator" },
            {
              key: "Forecast",
              icon: TrendingUp,
              color: "purple",
              link: "analytics",
            },
          ].map((item) => (
            <Link
              className="insight"
              key={item.key}
              href={`/${locale}/${item.link}`}
            >
              <span className={"icon-chip " + item.color}>
                <item.icon size={16} />
              </span>
              <div>
                <h3>{t("insight" + item.key)}</h3>
                <p>
                  {t("insight" + item.key + "Body", { count: data.low_stock })}
                </p>
              </div>
              <ArrowUpRight size={14} />
            </Link>
          ))}
          <Link className="text-link" href={`/${locale}/ai-assistant`}>
            {t("allInsights")}
            <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      <section className="panel">
        <div className="panel-head">
          <h2>{t("topProducts")}</h2>
          <Link className="text-link" href={`/${locale}/analytics`}>
            {t("showAll")}
            <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("product")}</th>
                <th>{t("quantity")}</th>
                <th>{t("revenue")}</th>
                <th>{t("grossProfit")}</th>
              </tr>
            </thead>
            <tbody>
              {data.products.slice(0, 4).map((p, i) => (
                <tr key={p.id}>
                  <td>
                    <span className="rank-number">0{i + 1}</span>
                    {locale === "kk" ? p.name_kk || p.name : p.name}
                  </td>
                  <td>{fmt(p.quantity, locale)}</td>
                  <td>{fmt(p.revenue, locale, true)}</td>
                  <td className="positive">
                    {fmt(p.gross_profit, locale, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function sparkPath(values: number[]) {
  if (!values.length) return "";
  const min = Math.min(...values),
    max = Math.max(...values);
  return values
    .map(
      (v, i) =>
        `${i ? "L" : "M"}${1 + (i * 78) / Math.max(1, values.length - 1)} ${23 - ((v - min) / Math.max(1, max - min)) * 22}`,
    )
    .join(" ");
}
