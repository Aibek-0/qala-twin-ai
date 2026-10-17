"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  ArrowUpRight,
  Package,
  ShieldCheck,
  TrendingDown,
  Target,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { api, errorKey, fmt } from "@/lib/api";
import { Button } from "../ui/button";
import { Badge, Failure, Loading, Spinner } from "../ui/shared";
export type ActionData = {
  business_name: string;
  is_demo: boolean;
  low_stock: {
    id: string;
    name: string;
    name_kk: string;
    stock: number;
    quantity: number;
    order_cost: string;
    days_cover: number | null;
  }[];
  loss_products: {
    id: string;
    name: string;
    name_kk: string;
    price: string;
    cost: string;
    unit_margin: string;
  }[];
  order_budget: string;
  break_even_revenue: string | null;
  margin_percent: number;
  expense_total: string;
  history_days: number;
  has_sales: boolean;
  has_products: boolean;
};
export default function Actions() {
  const t = useTranslations();
  const locale = useLocale();
  const [data, setData] = useState<ActionData>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [done, setDone] = useState(false);
  async function load() {
    try {
      setData(await api<ActionData>("/business/actions"));
    } catch (e) {
      setError(errorKey(e));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function receive(id: string, quantity: number) {
    setBusy(id);
    setError("");
    try {
      await api("/inventory/" + id + "/receive", {
        method: "POST",
        body: JSON.stringify({ quantity }),
      });
      setDone(true);
      await load();
    } catch (e) {
      setError(errorKey(e));
    } finally {
      setBusy("");
    }
  }
  if (!data) return error ? <Failure code={error} retry={load} /> : <Loading />;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("decisionCenter")}</div>
          <h1>{t("actions")}</h1>
          <p>{t("actionsSub")}</p>
        </div>
        <Badge tone={data.is_demo ? "blue" : "green"}>
          {t(data.is_demo ? "demo" : "realBusiness")}
        </Badge>
      </div>
      {error && <Failure code={error} />}{" "}
      {done && (
        <div className="notice success">
          <CheckCircle2 size={18} />
          {t("stockReceived")}
        </div>
      )}
      <div className="action-hero panel">
        <div>
          <span className="eyebrow">{data.business_name}</span>
          <h2>
            {t(
              data.low_stock.length || data.loss_products.length
                ? "attentionNeeded"
                : "allUnderControl",
            )}
          </h2>
          <p>{t("actionEvidence")}</p>
        </div>
        <div className="attention-total">
          <strong>{data.low_stock.length + data.loss_products.length}</strong>
          <span>{t("openIssues")}</span>
        </div>
      </div>
      <div className="decision-grid">
        <section className="panel decision-card">
          <div className="panel-head">
            <span className="icon-chip orange">
              <Package size={22} />
            </span>
            <Badge tone="orange">
              {t("lowStock")} · {data.low_stock.length}
            </Badge>
          </div>
          <div className="decision-copy">
            <h2>{t("preventStockout")}</h2>
            <p>{t("preventStockoutBody")}</p>
            <div className="decision-number">
              {fmt(data.order_budget, locale, true)}
              <span>{t("orderBudget")}</span>
            </div>
          </div>
          {data.low_stock.length ? (
            <div className="decision-list">
              {data.low_stock.map((p) => (
                <div className="stock-action" key={p.id}>
                  <div>
                    <strong>
                      {locale === "kk" ? p.name_kk || p.name : p.name}
                    </strong>
                    <small>
                      {t("stock")}: {p.stock} · {t("suggestedReorder")}: +
                      {p.quantity}
                    </small>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!busy || p.quantity < 1}
                    onClick={() => receive(p.id, p.quantity)}
                  >
                    {busy === p.id ? <Spinner /> : <CheckCircle2 size={14} />}{" "}
                    {t("confirmReceipt")}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="decision-clear">
              <ShieldCheck size={22} />
              {t("stockHealthy")}
            </div>
          )}
          <p className="panel-note">{t("receiptWarning")}</p>
        </section>
        <section className="panel decision-card">
          <div className="panel-head">
            <span className="icon-chip purple">
              <TrendingDown size={22} />
            </span>
            <Badge tone="purple">{t("marginControl")}</Badge>
          </div>
          <div className="decision-copy">
            <h2>{t("stopMarginLeak")}</h2>
            <p>{t("stopMarginLeakBody")}</p>
            <div className="decision-number">
              {data.loss_products.length}
              <span>{t("lossProducts")}</span>
            </div>
          </div>
          {data.loss_products.length ? (
            <div className="decision-list">
              {data.loss_products.map((p) => (
                <div className="stock-action" key={p.id}>
                  <div>
                    <strong>
                      {locale === "kk" ? p.name_kk || p.name : p.name}
                    </strong>
                    <small>
                      {t("price")}: {fmt(p.price, locale, true)} ·{" "}
                      {t("unitCost")}: {fmt(p.cost, locale, true)}
                    </small>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/${locale}/inventory`}>
                      {t("editPrice")}
                      <ArrowUpRight size={14} />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="decision-clear">
              <ShieldCheck size={22} />
              {t("marginHealthy")}
            </div>
          )}
          <Link
            className="decision-link"
            href={`/${locale}/simulator?scenario=pricing`}
          >
            {t("testPriceScenario")}
            <ArrowRight size={16} />
          </Link>
        </section>
        <section className="panel decision-card">
          <div className="panel-head">
            <span className="icon-chip green">
              <Target size={22} />
            </span>
            <Badge tone="green">{t("breakEven")}</Badge>
          </div>
          <div className="decision-copy">
            <h2>{t("coverOperatingCosts")}</h2>
            <p>{t("coverOperatingCostsBody")}</p>
            <div className="decision-number">
              {fmt(data.break_even_revenue, locale, true)}
              <span>{t("requiredRevenue")}</span>
            </div>
            <div className="decision-facts">
              <span>
                {t("expenses")}
                <b>{fmt(data.expense_total, locale, true)}</b>
              </span>
              <span>
                {t("margin")}
                <b>{fmt(data.margin_percent, locale)}%</b>
              </span>
            </div>
          </div>
          <p className="panel-note">{t("breakEvenNote")}</p>
          <Link className="decision-link" href={`/${locale}/operations`}>
            {t("manageExpenses")}
            <ArrowRight size={16} />
          </Link>
        </section>
        <section className="panel decision-card advisor-decision">
          <div className="panel-head">
            <span className="icon-chip blue">
              <Lightbulb size={22} />
            </span>
            <Badge>AI</Badge>
          </div>
          <div className="decision-copy">
            <h2>{t("turnDataIntoPlan")}</h2>
            <p>{t("turnDataIntoPlanBody")}</p>
            <div className="decision-tags">
              <span>{t("stock")}</span>
              <span>{t("margin")}</span>
              <span>{t("expenses")}</span>
            </div>
          </div>
          <Button asChild>
            <Link href={`/${locale}/ai-assistant`}>
              {t("askAdvisor")}
              <ArrowUpRight size={17} />
            </Link>
          </Button>
        </section>
      </div>
      {!data.has_products && (
        <section className="panel onboarding-callout">
          <h2>{t("connectRealBusiness")}</h2>
          <p>{t("onboardingBody")}</p>
          <Button asChild>
            <Link href={`/${locale}/inventory`}>
              {t("addFirstProduct")}
              <ArrowRight size={16} />
            </Link>
          </Button>
        </section>
      )}
    </>
  );
}
