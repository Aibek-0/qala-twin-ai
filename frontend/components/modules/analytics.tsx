"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  UploadCloud,
  FileSpreadsheet,
  ArrowUpRight,
  Download,
  CheckCircle2,
} from "lucide-react";
import { api, fmt, errorKey, type Overview } from "@/lib/api";
import { RevenueChart } from "../charts";
import { Button } from "../ui/button";
import { Badge, Failure, Loading, Empty, Spinner } from "../ui/shared";
type ImportResult = {
  headers: string[];
  missing: string[];
  valid_count: number;
  rejected_count: number;
  preview: {
    date: string;
    product_name: string;
    quantity: number;
    unit_price: string;
    unit_cost: string;
  }[];
  errors: { row: number; code: string }[];
  committed: boolean;
};
const columns = ["date", "product_name", "quantity", "unit_price", "unit_cost"];
export default function Analytics() {
  const t = useTranslations();
  const locale = useLocale();
  const [data, setData] = useState<Overview>();
  const [file, setFile] = useState<File>();
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ImportResult>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const [sales, setSales] = useState<
    {
      id: string;
      date: string;
      product_name: string;
      quantity: number;
      unit_price: string;
      unit_cost: string;
    }[]
  >([]);
  const fileInput = useRef<HTMLInputElement>(null);
  async function load() {
    try {
      const [d, s] = await Promise.all([
        api<Overview>("/dashboard/overview"),
        api<typeof sales>("/analytics/sales"),
      ]);
      setData(d);
      setSales(s);
    } catch (e) {
      setError(errorKey(e));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function inspect(selected: File, commit = false, map = mapping) {
    setBusy(true);
    setError("");
    if (!commit) setResult(undefined);
    try {
      if (selected.size > 5 * 1024 * 1024) throw new Error("file_too_large");
      const form = new FormData();
      form.set("file", selected);
      form.set("mapping", JSON.stringify(map));
      form.set("commit", String(commit));
      const r = await api<ImportResult>("/analytics/import", {
        method: "POST",
        body: form,
      });
      setResult(r);
      if (!Object.keys(map).length)
        setMapping(
          Object.fromEntries(
            columns.map((k) => [k, r.headers.includes(k) ? k : ""]),
          ),
        );
      if (commit) await load();
    } catch (e) {
      setError(
        e instanceof Error && e.message === "file_too_large"
          ? "file_too_large"
          : errorKey(e),
      );
    } finally {
      setBusy(false);
    }
  }
  function selected(f?: File) {
    if (!f) return;
    setFile(f);
    setMapping({});
    void inspect(f, false, {});
  }
  function template() {
    downloadText(
      "date,product_name,quantity,unit_price,unit_cost\n2026-10-16,Test product,12,650.00,420.00\n",
      "qala-sales-template.csv",
    );
  }
  function exportSales() {
    downloadText(
      "date,product_name,quantity,unit_price,unit_cost\n" +
        sales
          .map((s) =>
            [
              s.date,
              '"' + s.product_name.replaceAll('"', '""') + '"',
              s.quantity,
              s.unit_price,
              s.unit_cost,
            ].join(","),
          )
          .join("\n"),
      "qala-sales.csv",
    );
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">QALA TWIN AI / {t("analytics")}</div>
          <h1>{t("analytics")}</h1>
          <p>{t("analyticsSub")}</p>
        </div>
        <Button
          variant="outline"
          onClick={exportSales}
          disabled={!sales.length}
        >
          <Download size={16} />
          {t("exportSales")}
        </Button>
      </div>
      {error && <Failure code={error} />}
      <section className="panel import-panel">
        <div className="panel-head">
          <div>
            <h2>{t("uploadTitle")}</h2>
            <p>{t("uploadHint")}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={template}>
            <Download size={15} />
            {t("template")}
          </Button>
        </div>
        <div
          className={"dropzone " + (drag ? "drag" : "")}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            selected(e.dataTransfer.files[0]);
          }}
        >
          <span className="upload-icon">
            <UploadCloud size={26} />
          </span>
          <div>
            <strong>{file?.name || t("uploadSub")}</strong>
            <small>{t("uploadHint")}</small>
          </div>
          <Button
            variant="outline"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
          >
            {busy ? <Spinner /> : <FileSpreadsheet size={16} />}{" "}
            {t("chooseFile")}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,.xlsx"
            hidden
            onChange={(e) => selected(e.target.files?.[0])}
          />
        </div>
        {result && (
          <div className="import-preview">
            <h3>{t("columns")}</h3>
            <div className="mapping-grid">
              {columns.map((k) => (
                <label key={k}>
                  {k}
                  <select
                    value={mapping[k] || ""}
                    onChange={(e) =>
                      setMapping({ ...mapping, [k]: e.target.value })
                    }
                  >
                    <option value="">—</option>
                    {result.headers.map((h) => (
                      <option key={h}>{h}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="import-actions">
              <Button
                variant="outline"
                disabled={busy || !file}
                onClick={() => file && inspect(file)}
              >
                {t("validate")}
              </Button>
              <span className="positive">
                {t("validRows")}: {result.valid_count || 0}
              </span>
              <span className="warning-text">
                {t("rejectedRows")}: {result.rejected_count || 0}
              </span>
            </div>
            {result.missing.length > 0 && (
              <p className="warning-text">
                {t("missingColumns")}: {result.missing.join(", ")}
              </p>
            )}
            {result.errors.length > 0 && (
              <div className="notice danger">
                {result.errors.slice(0, 8).map((e) => (
                  <p key={e.row}>
                    {t("row")} {e.row}: {t(e.code)}
                  </p>
                ))}
              </div>
            )}
            {result.preview.length > 0 && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((r, i) => (
                      <tr key={i}>
                        <td>{r.date.slice(0, 10)}</td>
                        <td>{r.product_name}</td>
                        <td>{r.quantity}</td>
                        <td>{r.unit_price}</td>
                        <td>{r.unit_cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {result.committed ? (
              <div className="notice success">
                <CheckCircle2 size={18} />
                {t("importSuccess")}
              </div>
            ) : (
              <Button
                disabled={
                  busy ||
                  !result.valid_count ||
                  !!result.errors.length ||
                  !!result.missing.length
                }
                onClick={() => file && inspect(file, true)}
              >
                {busy ? <Spinner /> : <UploadCloud size={16} />} {t("commit")} (
                {result.valid_count || 0})
              </Button>
            )}
          </div>
        )}
      </section>
      {!data ? (
        <Loading />
      ) : !data.daily.length ? (
        <Empty />
      ) : (
        <>
          <div className="metric-strip">
            {[
              { key: "revenue", value: data.revenue },
              { key: "cost", value: data.cost },
              { key: "grossProfit", value: data.gross_profit },
              { key: "netProfit", value: data.net_profit },
            ].map((m) => (
              <div className="panel" key={m.key}>
                <span>{t(m.key)}</span>
                <strong>{fmt(m.value, locale, true)}</strong>
              </div>
            ))}
          </div>
          <div className="two-cols">
            <section className="panel">
              <div className="panel-head">
                <h2>{t("revenueDynamics")}</h2>
                <Badge>{t(data.is_demo ? "demo" : "actual")}</Badge>
              </div>
              <RevenueChart data={data.daily} />
            </section>
            <section className="panel">
              <div className="panel-head">
                <h2>{t("forecastTitle")}</h2>
                <Badge tone="purple">{t("forecast")}</Badge>
              </div>
              {data.forecast.available ? (
                <>
                  <RevenueChart data={data.forecast.days} forecast />
                  <p className="panel-note">
                    {t("backtest")}:{" "}
                    {fmt(data.forecast.backtest_mae || 0, locale, true)} ·{" "}
                    {t("forecastHint")}
                  </p>
                </>
              ) : (
                <p className="empty">{t("forecastUnavailable")}</p>
              )}
            </section>
          </div>
          <section className="panel">
            <div className="panel-head">
              <h2>{t("topProducts")}</h2>
              <span className="muted">{data.product_count} SKU</span>
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
                  {data.products.slice(0, 10).map((p) => (
                    <tr key={p.id}>
                      <td>{locale === "kk" ? p.name_kk || p.name : p.name}</td>
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
          <section className="panel">
            <div className="panel-head">
              <h2>{t("salesHistory")}</h2>
              <Badge>{sales.length}</Badge>
            </div>
            <div className="table-wrap scroll-table">
              <table>
                <thead>
                  <tr>
                    <th>{t("date")}</th>
                    <th>{t("product")}</th>
                    <th>{t("quantity")}</th>
                    <th>{t("price")}</th>
                    <th>{t("unitCost")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 100).map((s) => (
                    <tr key={s.id}>
                      <td>{s.date.slice(0, 10)}</td>
                      <td>{s.product_name}</td>
                      <td>{s.quantity}</td>
                      <td>{fmt(s.unit_price, locale, true)}</td>
                      <td>{fmt(s.unit_cost, locale, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
function downloadText(text: string, name: string) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
