"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  FlaskConical,
  Play,
  ArrowRight,
  Users,
  TrendingUp,
  Package,
  ArrowDownRight,
} from "lucide-react";
import { api, errorKey, fmt } from "@/lib/api";
import { Button } from "../ui/button";
import { Badge, Failure, Spinner } from "../ui/shared";
type Result = {
  before?: Record<string, string | number>;
  after?: Record<string, string | number>;
  wait_reduction_percent?: number;
  reorder_quantity?: number;
  days_cover?: number;
  stockout_risk?: boolean;
};
const config = {
  queue: {
    customers_per_hour: 48,
    service_time: 65,
    cashiers: 1,
    labor_cost: 1500,
    hours: 8,
    seed: 42,
  },
  pricing: {
    current_price: 650,
    purchase_cost: 420,
    average_sales: 100,
    change_percent: 10,
    elasticity: -1.2,
  },
  inventory: {
    current_stock: 12,
    daily_demand: 18,
    lead_time: 3,
    safety_stock: 20,
  },
};
const labels: Record<string, string> = {
  customers_per_hour: "customersPerHour",
  service_time: "serviceTime",
  cashiers: "cashiers",
  labor_cost: "laborCost",
  hours: "hours",
  seed: "seed",
  current_price: "currentPrice",
  purchase_cost: "purchaseCost",
  average_sales: "averageSales",
  change_percent: "priceChange",
  elasticity: "elasticity",
  current_stock: "currentStock",
  daily_demand: "demand",
  lead_time: "leadTime",
  safety_stock: "safetyStock",
};
const limits: Record<string, [number, number, number]> = {
  customers_per_hour: [1, 600, 1],
  service_time: [5, 600, 1],
  cashiers: [1, 7, 1],
  labor_cost: [0, 100000, 1],
  hours: [1, 24, 1],
  seed: [0, 1000000, 1],
  current_price: [0.01, 10000000, 0.01],
  purchase_cost: [0, 10000000, 0.01],
  average_sales: [1, 1000000, 1],
  change_percent: [-80, 100, 1],
  elasticity: [-5, 0, 0.1],
  current_stock: [0, 1000000, 1],
  daily_demand: [0.1, 100000, 0.1],
  lead_time: [1, 365, 1],
  safety_stock: [0, 100000, 1],
};
export default function Simulator() {
  const t = useTranslations();
  const locale = useLocale();
  const [tab, setTab] = useState<keyof typeof config>("queue");
  const [values, setValues] = useState<Record<string, number>>({
    ...config.queue,
  });
  const [result, setResult] = useState<Result>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const scenario = new URLSearchParams(window.location.search).get(
      "scenario",
    );
    if (
      scenario === "queue" ||
      scenario === "pricing" ||
      scenario === "inventory"
    ) {
      setTab(scenario);
      setValues({ ...config[scenario] });
    }
  }, []);
  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setResult(
        await api<Result>("/simulator/" + tab, {
          method: "POST",
          body: JSON.stringify(values),
        }),
      );
    } catch (e) {
      setError(errorKey(e));
    } finally {
      setBusy(false);
    }
  }
  const rows =
    tab === "queue"
      ? [
          ["average_wait_seconds", "wait", false],
          ["average_queue", "queueLength", false],
          ["served_customers", "served", false],
          ["operational_cost", "operationalCost", true],
        ]
      : [
          ["revenue", "revenue", true],
          ["gross_profit", "grossProfit", true],
          ["demand", "demand", false],
        ];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">QALA TWIN AI / {t("simulator")}</div>
          <h1>{t("simulator")}</h1>
          <p>{t("simulatorSub")}</p>
        </div>
        <Badge tone="purple">
          <FlaskConical size={13} />
          {t("simulation")}
        </Badge>
      </div>
      <div className="tabs" role="tablist">
        {(
          [
            { key: "queue", label: "queueScenario", icon: Users },
            { key: "pricing", label: "pricingScenario", icon: TrendingUp },
            { key: "inventory", label: "stockScenario", icon: Package },
          ] as const
        ).map((item) => (
          <button
            role="tab"
            aria-selected={tab === item.key}
            className={tab === item.key ? "active" : ""}
            key={item.key}
            onClick={() => {
              setTab(item.key);
              setValues({ ...config[item.key] });
              setResult(undefined);
              setError("");
            }}
          >
            <item.icon size={17} />
            {t(item.label)}
          </button>
        ))}
      </div>
      {error && <Failure code={error} />}
      <div className="simulator-grid">
        <section className="panel simulator-input">
          <div className="panel-head">
            <h2>
              {t(
                tab === "queue"
                  ? "queueScenario"
                  : tab === "pricing"
                    ? "pricingScenario"
                    : "stockScenario",
              )}
            </h2>
            <span className="icon-chip blue">
              <FlaskConical size={18} />
            </span>
          </div>
          <form onSubmit={run}>
            {Object.entries(values).map(([key, value]) => (
              <label key={key}>
                {t(labels[key])}
                <div className="number-input">
                  <input
                    type="number"
                    required
                    min={limits[key][0]}
                    max={limits[key][1]}
                    step={limits[key][2]}
                    value={value}
                    onChange={(e) => {
                      setValues({ ...values, [key]: Number(e.target.value) });
                      setResult(undefined);
                    }}
                  />
                </div>
                {["customers_per_hour", "service_time"].includes(key) && (
                  <input
                    type="range"
                    aria-label={t(labels[key])}
                    min={limits[key][0]}
                    max={key === "customers_per_hour" ? 150 : 240}
                    value={value}
                    onChange={(e) => {
                      setValues({ ...values, [key]: Number(e.target.value) });
                      setResult(undefined);
                    }}
                  />
                )}
              </label>
            ))}
            <Button disabled={busy}>
              {busy ? <Spinner /> : <Play size={16} />} {t("runSimulation")}
            </Button>
          </form>
          <p className="panel-note">
            {t(tab === "queue" ? "simulationHint" : "scenarioOnly")}
          </p>
        </section>
        <div className="simulation-output">
          {!result ? (
            <section className="panel simulation-empty">
              <div className="simulation-orbit">
                <FlaskConical size={40} />
                <i />
                <i />
              </div>
              <h2>{t("runSimulation")}</h2>
              <p>{t("scenarioOnly")}</p>
              <div className="compare-preview">
                <span>{t("before")}</span>
                <ArrowRight size={20} />
                <span>{t("after")}</span>
              </div>
            </section>
          ) : tab === "inventory" ? (
            <section className="panel">
              <div className="panel-head">
                <h2>{t("recommendation")}</h2>
                <Badge tone="purple">{t("simulation")}</Badge>
              </div>
              <div className="result-big">
                {fmt(result.reorder_quantity || 0, locale)}
                <span>{t("reorderQuantity")}</span>
              </div>
              <div className="result-row">
                <span>{t("currentStock")}</span>
                <strong>{values.current_stock}</strong>
              </div>
              <div className="result-row">
                <span>{t("daysCover")}</span>
                <strong>{result.days_cover}</strong>
              </div>
              <div className="result-row">
                <span>{t("risk")}</span>
                <Badge tone={result.stockout_risk ? "orange" : "green"}>
                  {t(result.stockout_risk ? "yes" : "no")}
                </Badge>
              </div>
              <p className="panel-note">{t("scenarioOnly")}</p>
            </section>
          ) : (
            <>
              <div className="comparison-grid">
                {(["before", "after"] as const).map((side, i) => (
                  <section className={"panel comparison " + side} key={side}>
                    <div className="panel-head">
                      <div>
                        <span className="eyebrow">
                          0{i + 1} / {side.toUpperCase()}
                        </span>
                        <h2>{t(side)}</h2>
                      </div>
                      {tab === "queue" && (
                        <Badge tone={i ? "green" : "blue"}>
                          {t("cashierCount", {
                            count: Number(result[side]?.cashiers),
                          })}
                        </Badge>
                      )}
                    </div>
                    {rows.map(([key, label, currency]) => (
                      <div className="comparison-row" key={String(key)}>
                        <span>{t(String(label))}</span>
                        <strong>
                          {fmt(
                            result[side]?.[String(key)] || 0,
                            locale,
                            Boolean(currency),
                          )}
                          {key === "average_wait_seconds" && (
                            <small> {t("seconds")}</small>
                          )}
                        </strong>
                        {key === "average_wait_seconds" && (
                          <div className="comparison-bar">
                            <i
                              style={{
                                width: `${Math.min(100, (Number(result[side]?.[String(key)]) / Math.max(1, Number(result.before?.average_wait_seconds))) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </section>
                ))}
              </div>
              {tab === "queue" && (
                <section className="panel reduction-panel">
                  <span className="icon-chip green">
                    <ArrowDownRight size={28} />
                  </span>
                  <div>
                    <strong>
                      {fmt(result.wait_reduction_percent || 0, locale)}%
                    </strong>
                    <p>{t("reduction")}</p>
                  </div>
                  <Badge tone="green">{t("simulation")}</Badge>
                </section>
              )}
              <div className="notice">{t("scenarioOnly")}</div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
