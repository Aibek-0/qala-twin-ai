"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  ShoppingBag,
  Receipt,
  ArrowDownToLine,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { api, errorKey, fmt, type Product, type Overview } from "@/lib/api";
import { Button } from "../ui/button";
import { Badge, Failure, Spinner, Loading } from "../ui/shared";
type Expense = { id: string; category: string; amount: string; date: string };
export default function Operations() {
  const t = useTranslations();
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [overview, setOverview] = useState<Overview>();
  const [kind, setKind] = useState("sale");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function load() {
    try {
      const [p, e, o] = await Promise.all([
        api<Product[]>("/inventory"),
        api<Expense[]>("/operations/expenses"),
        api<Overview>("/dashboard/overview"),
      ]);
      setProducts(p);
      setExpenses(e);
      setOverview(o);
      if (!product && p.length) {
        setProduct(p[0].id);
        setPrice(p[0].selling_price);
      }
    } catch (e) {
      setError(errorKey(e));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    const f = new FormData(e.currentTarget);
    try {
      if (kind === "sale")
        await api("/operations/sales", {
          method: "POST",
          body: JSON.stringify({
            product_id: product,
            quantity,
            unit_price: price,
          }),
        });
      else if (kind === "receive")
        await api("/inventory/" + product + "/receive", {
          method: "POST",
          body: JSON.stringify({ quantity }),
        });
      else
        await api("/operations/expenses", {
          method: "POST",
          body: JSON.stringify({
            category: f.get("category"),
            amount: f.get("amount"),
            date: f.get("date"),
          }),
        });
      setSuccess(
        kind === "sale"
          ? "saleRecorded"
          : kind === "receive"
            ? "stockReceived"
            : "expenseRecorded",
      );
      await load();
    } catch (e) {
      setError(errorKey(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    setError("");
    try {
      await api("/operations/expenses/" + id, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(errorKey(e));
    } finally {
      setBusy(false);
    }
  }
  const selected = products.find((p) => p.id === product);
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Qyzylorda",
  }).format(new Date());
  if(!overview) return error?<Failure code={error} retry={load}/>:<Loading/>;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("dailyWorkspace")}</div>
          <h1>{t("operations")}</h1>
          <p>{t("operationsSub")}</p>
        </div>
        <Badge tone="green">{t("realRecords")}</Badge>
      </div>
      <div className="metric-strip">
        {[
          { key: "revenue", value: overview?.revenue },
          { key: "grossProfit", value: overview?.gross_profit },
          { key: "expenses", value: overview?.expenses },
          { key: "netProfit", value: overview?.net_profit },
        ].map((k) => (
          <div className="panel" key={k.key}>
            <span>{t(k.key)}</span>
            <strong>{fmt(k.value ?? null, locale, true)}</strong>
          </div>
        ))}
      </div>
      <div className="operations-grid">
        <section className="panel entry-panel">
          <div className="panel-head">
            <div>
              <h2>{t("newOperation")}</h2>
              <p>{t("operationHint")}</p>
            </div>
            <span className="icon-chip green">
              <Plus size={22} />
            </span>
          </div>
          <div className="operation-tabs">
            {[
              { key: "sale", label: "recordSale", icon: ShoppingBag },
              { key: "receive", label: "receiveStock", icon: ArrowDownToLine },
              { key: "expense", label: "recordExpense", icon: Receipt },
            ].map((item) => (
              <button
                key={item.key}
                className={kind === item.key ? "active" : ""}
                onClick={() => {
                  setKind(item.key);
                  setSuccess("");
                  setError("");
                }}
              >
                <item.icon size={19} />
                {t(item.label)}
              </button>
            ))}
          </div>
          <form key={kind} onSubmit={submit}>
            {error && <Failure code={error} />}{" "}
            {success && (
              <div className="notice success" role="status">
                <CheckCircle2 size={18} />
                {t(success)}
              </div>
            )}
            {kind !== "expense" ? (
              <>
                {products.length ? (
                  <>
                    <label>
                      {t("product")}
                      <select
                        required
                        value={product}
                        onChange={(e) => {
                          setProduct(e.target.value);
                          setPrice(
                            products.find((p) => p.id === e.target.value)
                              ?.selling_price || "",
                          );
                        }}
                      >
                        {products.map((p) => (
                          <option value={p.id} key={p.id}>
                            {locale === "kk" ? p.name_kk || p.name : p.name} ·{" "}
                            {p.stock_quantity}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="form-grid">
                      <label>
                        {t("quantity")}
                        <input
                          type="number"
                          min={1}
                          max={
                            kind === "sale"
                              ? selected?.stock_quantity || 1
                              : 1000000
                          }
                          required
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                        />
                      </label>
                      {kind === "sale" && (
                        <label>
                          {t("price")}
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            required
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                          />
                        </label>
                      )}
                    </div>
                    <div className="operation-summary">
                      <span>
                        {t(kind === "sale" ? "saleTotal" : "stockAfter")}
                      </span>
                      <strong>
                        {kind === "sale"
                          ? fmt(Number(price) * quantity, locale, true)
                          : fmt(
                              (selected?.stock_quantity || 0) + quantity,
                              locale,
                            )}
                      </strong>
                      <small>
                        {t(
                          kind === "sale" ? "stockAutoDecrease" : "receiptNote",
                        )}
                      </small>
                    </div>
                  </>
                ) : (
                  <div className="empty">
                    <ShoppingBag size={32} />
                    <h3>{t("addFirstProduct")}</h3>
                    <Button asChild>
                      <Link href={`/${locale}/inventory`}>
                        {t("add")}
                        <ArrowUpRight size={16} />
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <label>
                  {t("expenseCategory")}
                  <input
                    name="category"
                    required
                    maxLength={60}
                    placeholder={t("expenseExample")}
                  />
                </label>
                <div className="form-grid">
                  <label>
                    {t("amount")}
                    <input
                      name="amount"
                      type="number"
                      min="0.01"
                      max="100000000"
                      step="0.01"
                      required
                    />
                  </label>
                  <label>
                    {t("date")}
                    <input
                      name="date"
                      type="date"
                      defaultValue={today}
                      required
                    />
                  </label>
                </div>
                <p className="form-help">{t("expenseNote")}</p>
              </>
            )}
            <Button disabled={busy || (kind !== "expense" && !products.length)}>
              {busy ? <Spinner /> : <CheckCircle2 size={17} />}{" "}
              {t("saveOperation")}
            </Button>
          </form>
        </section>
        <div>
          <section className="panel operation-guide">
            <span className="eyebrow">{t("workflowTitle")}</span>
            <h2>{t("workflowHeading")}</h2>
            <p>{t("workflowBody")}</p>
            {["workflowSale", "workflowReceive", "workflowExpense"].map(
              (key, i) => (
                <div className="workflow-step" key={key}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <p>{t(key)}</p>
                </div>
              ),
            )}
            <Link className="text-link" href={`/${locale}/analytics`}>
              {t("importHistory")}
              <ArrowUpRight size={16} />
            </Link>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>{t("recentExpenses")}</h2>
              <Badge>{expenses.length}</Badge>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("date")}</th>
                    <th>{t("expenseCategory")}</th>
                    <th>{t("amount")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td>{e.date}</td>
                      <td>{e.category}</td>
                      <td>{fmt(e.amount, locale, true)}</td>
                      <td>
                        <Button
                          disabled={busy}
                          variant="ghost"
                          size="icon"
                          aria-label={t("delete")}
                          onClick={() => remove(e.id)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!expenses.length && <p className="empty">{t("noExpenses")}</p>}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
