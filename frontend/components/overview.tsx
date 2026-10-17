"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowUpRight,
  ArrowRight,
  Wallet,
  TrendingUp,
  Users,
  ChartNoAxesCombined,
  Plus,
  Package,
  Target,
  CheckCircle2,
  Activity,
  ShoppingBag,
} from "lucide-react";
import { api, errorKey, fmt, type Overview } from "@/lib/api";
import { Button } from "./ui/button";
import { Badge, Failure, Loading } from "./ui/shared";
import AnimatedNumber from "./ui/animated-number";
import { RevenueChart, VisitorChart } from "./charts";
import type { ActionData } from "./modules/actions";
const TwinScene = dynamic(() => import("./twin-scene"), { ssr: false });
export default function OverviewPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [data, setData] = useState<Overview>();
  const [actions, setActions] = useState<ActionData>();
  const [visitors, setVisitors] = useState<
    { hour: string; visitors: number }[]
  >([]);
  const [error, setError] = useState("");
  async function load() {
    try {
      const [o, a, v] = await Promise.all([
        api<Overview>("/dashboard/overview"),
        api<ActionData>("/business/actions"),
        api<{ hourly: typeof visitors }>("/dashboard/visitors"),
      ]);
      setData(o);
      setActions(a);
      setVisitors(v.hourly);
    } catch (e) {
      setError(errorKey(e));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  if (error) return <Failure code={error} retry={load} />;
  if (!data || !actions) return <Loading />;
  const cards = [
    {
      key: "revenue",
      value: data.revenue,
      icon: Wallet,
      color: "blue",
      hint:
        data.growth === null
          ? t("overPeriod")
          : `${data.growth >= 0 ? "+" : ""}${fmt(data.growth, locale)}% · ${t("fromPrevious")}`,
      money: true,
    },
    {
      key: data.net_profit === null ? "grossProfit" : "netProfit",
      value: data.net_profit ?? data.gross_profit,
      icon: TrendingUp,
      color: "green",
      hint: `${fmt(data.margin, locale)}% · ${t("margin")}`,
      money: true,
    },
    {
      key: "occupancy",
      value: data.occupancy_source === "unavailable" ? null : data.occupancy,
      icon: Users,
      color: "purple",
      hint: t(data.occupancy_source),
      money: false,
    },
    {
      key: "forecastTotal",
      value: data.forecast.available
        ? data.forecast.days.reduce((s, d) => s + Number(d.revenue), 0)
        : null,
      icon: ChartNoAxesCombined,
      color: "orange",
      hint: t(data.forecast.available ? "forecast" : "forecastUnavailable"),
      money: true,
    },
  ];
  const issueCount = actions.low_stock.length + actions.loss_products.length;
  return (
    <>
      <div className="page-heading overview-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            {actions.business_name} / {t("overview")}
          </div>
          <h1>{t("welcome")}</h1>
          <p>{t("newDashboardSub")}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/operations`}>
            <Plus size={17} />
            {t("recordSale")}
          </Link>
        </Button>
      </div>
      {!data.sale_count && (
        <section className="panel welcome-workspace">
          <div className="welcome-workspace-copy">
            <Badge tone="green">{t("realBusiness")}</Badge>
            <h2>{t("connectRealBusiness")}</h2>
            <p>{t("onboardingBody")}</p>
          </div>
          <div className="setup-steps">
            {[
              {
                key: "addFirstProduct",
                path: "inventory",
                icon: Package,
                done: data.product_count > 0,
              },
              {
                key: "firstSale",
                path: "operations",
                icon: ShoppingBag,
                done: false,
              },
              {
                key: "importHistory",
                path: "analytics",
                icon: ChartNoAxesCombined,
                done: false,
              },
            ].map((s, i) => (
              <Link href={`/${locale}/${s.path}`} key={s.key}>
                <span className="step-index">
                  {s.done ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <div>
                  <strong>{t(s.key)}</strong>
                  <small>{t(s.key + "Hint")}</small>
                </div>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        </section>
      )}
      <div className="kpi-grid">
        {cards.map((k) => (
          <section className="panel kpi" key={k.key}>
            <div className="kpi-top">
              <span>{t(k.key)}</span>
              <span className={"icon-chip " + k.color}>
                <k.icon size={19} />
              </span>
            </div>
            <div className="kpi-value">
              <AnimatedNumber
                value={k.value}
                locale={locale}
                currency={k.money}
              />
            </div>
            <div className="kpi-foot">
              <span>{k.hint}</span>
            </div>
          </section>
        ))}
      </div>
      <div className="overview-workbench">
        <section className="panel performance-panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">{t("moneyInMotion")}</div>
              <h2>{t("revenueDynamics")}</h2>
              <p>
                {data.period.start
                  ? `${data.period.start} — ${data.period.end}`
                  : t("awaitingData")}
              </p>
            </div>
            <Badge tone={data.is_demo ? "blue" : "green"}>
              {t(data.is_demo ? "demo" : "realRecords")}
            </Badge>
          </div>
          {data.daily.length ? (
            <RevenueChart data={data.daily} />
          ) : (
            <div className="chart-empty">
              <ChartNoAxesCombined size={34} />
              <p>{t("chartEmpty")}</p>
              <Link className="text-link" href={`/${locale}/operations`}>
                {t("firstSale")}
                <ArrowRight size={15} />
              </Link>
            </div>
          )}
          <div className="performance-footer">
            <div>
              <span>{t("grossProfit")}</span>
              <strong>{fmt(data.gross_profit, locale, true)}</strong>
            </div>
            <div>
              <span>{t("expenses")}</span>
              <strong>{fmt(data.expenses, locale, true)}</strong>
            </div>
            <div>
              <span>{t("margin")}</span>
              <strong className="positive">{fmt(data.margin, locale)}%</strong>
            </div>
          </div>
        </section>
        <section className="panel daily-focus">
          <div className="panel-head">
            <span className="icon-chip orange">
              <Target size={22} />
            </span>
            <Badge tone={issueCount ? "orange" : "green"}>
              {issueCount} · {t("openIssues")}
            </Badge>
          </div>
          <div className="daily-focus-copy">
            <span className="eyebrow">{t("todayFocus")}</span>
            <h2>{t(issueCount ? "attentionNeeded" : "allUnderControl")}</h2>
            <p>{t(issueCount ? "focusIssuesBody" : "focusHealthyBody")}</p>
          </div>
          <div className="focus-row">
            <span>{t("lowStock")}</span>
            <strong>{actions.low_stock.length}</strong>
          </div>
          <div className="focus-row">
            <span>{t("lossProducts")}</span>
            <strong>{actions.loss_products.length}</strong>
          </div>
          <div className="focus-row">
            <span>{t("orderBudget")}</span>
            <strong>{fmt(actions.order_budget, locale, true)}</strong>
          </div>
          <Button asChild>
            <Link href={`/${locale}/actions`}>
              {t("openActionCenter")}
              <ArrowUpRight size={16} />
            </Link>
          </Button>
        </section>
      </div>
      <div className="workspace-shortcuts">
        {[
          {
            key: "recordSale",
            body: "shortcutSale",
            path: "operations",
            icon: ShoppingBag,
          },
          {
            key: "testDecision",
            body: "shortcutSimulator",
            path: "simulator",
            icon: Activity,
          },
          {
            key: "askAdvisor",
            body: "shortcutAdvisor",
            path: "ai-assistant",
            icon: Target,
          },
        ].map((s) => (
          <Link
            className="panel shortcut-card"
            href={`/${locale}/${s.path}`}
            key={s.key}
          >
            <span className="icon-chip blue">
              <s.icon size={22} />
            </span>
            <div>
              <h3>{t(s.key)}</h3>
              <p>{t(s.body)}</p>
            </div>
            <ArrowUpRight size={18} />
          </Link>
        ))}
      </div>
      <div className="two-cols overview-lower">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>{t("topProducts")}</h2>
              <p>{t("rankEvidence")}</p>
            </div>
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
                  <th>{t("grossProfit")}</th>
                </tr>
              </thead>
              <tbody>
                {data.products
                  .filter((p) => p.quantity > 0)
                  .slice(0, 5)
                  .map((p, i) => (
                    <tr key={p.id}>
                      <td>
                        <span className="rank-number">0{i + 1}</span>
                        {locale === "kk" ? p.name_kk || p.name : p.name}
                      </td>
                      <td>{fmt(p.quantity, locale)}</td>
                      <td className="positive">
                        {fmt(p.gross_profit, locale, true)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!data.sale_count && <p className="empty">{t("awaitingData")}</p>}
          </div>
        </section>
        <section className="panel twin-preview">
          <div className="panel-head">
            <div>
              <h2>{t("digital-twin")}</h2>
              <p>
                {actions.business_name} · {t("schematicShort")}
              </p>
            </div>
            <Badge>{t(data.occupancy_source)}</Badge>
          </div>
          <div className="mini-scene">
            <TwinScene
              occupancy={
                data.occupancy_source === "unavailable" ? 0 : data.occupancy
              }
              compact
            />
          </div>
          <div className="scene-caption">
            <span className="muted">{t("orbitHint")}</span>
            <Link href={`/${locale}/digital-twin`}>
              {t("openTwin")}
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
      </div>
      {visitors.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h2>{t("visitorsFlow")}</h2>
            <Badge>{t("demo")}</Badge>
          </div>
          <VisitorChart data={visitors} />
        </section>
      )}
    </>
  );
}
