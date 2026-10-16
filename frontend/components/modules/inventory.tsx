"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
} from "lucide-react";
import { api, errorKey, fmt, type Product } from "@/lib/api";
import { Button } from "../ui/button";
import { Badge, Failure, Loading, Modal, Spinner } from "../ui/shared";
const initial = {
  sku: "",
  name: "",
  name_kk: "",
  category: "grocery",
  cost_price: "0",
  selling_price: "1",
  stock_quantity: 0,
  reorder_point: 20,
};
export default function Inventory() {
  const t = useTranslations();
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>();
  const [query, setQuery] = useState("");
  const [low, setLow] = useState(false);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [deleting, setDeleting] = useState<Product>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  async function load() {
    try {
      setProducts(await api<Product[]>("/inventory"));
    } catch (e) {
      setError(errorKey(e));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const body = {
      ...Object.fromEntries(form),
      stock_quantity: Number(form.get("stock_quantity")),
      reorder_point: Number(form.get("reorder_point")),
    };
    try {
      await api("/inventory" + (editing?.id ? "/" + editing.id : ""), {
        method: editing?.id ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      setEditing(null);
      setSuccess(true);
      await load();
    } catch (e) {
      setError(errorKey(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      await api("/inventory/" + deleting.id, { method: "DELETE" });
      setDeleting(undefined);
      await load();
    } catch (e) {
      setDeleting(undefined);
      setError(errorKey(e));
    } finally {
      setBusy(false);
    }
  }
  const rows = products?.filter(
    (p) =>
      (!low || p.low_stock) &&
      (p.name + " " + p.name_kk + " " + p.sku)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">QALA TWIN AI / {t("inventory")}</div>
          <h1>{t("inventory")}</h1>
          <p>{t("inventorySub")}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(initial);
            setError("");
          }}
        >
          <Plus size={17} />
          {t("add")}
        </Button>
      </div>
      {error && !editing && <Failure code={error} />}{" "}
      {success && <div className="notice success">{t("saved")}</div>}
      <div className="metric-strip">
        <div className="panel">
          <span>{t("product")}</span>
          <strong>
            {products?.length || 0} <small>SKU</small>
          </strong>
        </div>
        <div className="panel">
          <span>{t("lowStock")}</span>
          <strong className="warning-text">
            {products?.filter((p) => p.low_stock).length || 0}
          </strong>
        </div>
        <div className="panel">
          <span>{t("stock")}</span>
          <strong>
            {fmt(
              products?.reduce((s, p) => s + p.stock_quantity, 0) || 0,
              locale,
            )}
          </strong>
        </div>
      </div>
      <section className="panel">
        <div className="table-toolbar">
          <div className="input-icon">
            <Search size={17} />
            <input
              placeholder={t("search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            aria-label={t("filter")}
            value={String(low)}
            onChange={(e) => setLow(e.target.value === "true")}
          >
            <option value="false">{t("all")}</option>
            <option value="true">{t("onlyLow")}</option>
          </select>
        </div>
        {!products ? (
          <Loading />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("product")}</th>
                  <th>{t("sku")}</th>
                  <th>{t("stock")}</th>
                  <th>{t("unitCost")}</th>
                  <th>{t("price")}</th>
                  <th>{t("dailyDemand")}</th>
                  <th>{t("suggestedReorder")}</th>
                  <th>{t("status")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows?.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="product-cell">
                        <span
                          className={
                            "product-icon " + (p.low_stock ? "orange" : "blue")
                          }
                        >
                          <Package size={17} />
                        </span>
                        {locale === "kk" ? p.name_kk || p.name : p.name}
                      </div>
                    </td>
                    <td className="mono muted">{p.sku}</td>
                    <td>{p.stock_quantity}</td>
                    <td>{fmt(p.cost_price, locale, true)}</td>
                    <td>{fmt(p.selling_price, locale, true)}</td>
                    <td>{fmt(p.daily_demand || 0, locale)}</td>
                    <td>
                      {p.suggested_reorder ? `+${p.suggested_reorder}` : "—"}
                    </td>
                    <td>
                      <Badge tone={p.low_stock ? "orange" : "green"}>
                        {t(p.low_stock ? "lowStock" : "inStock")}
                      </Badge>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("edit")}
                          onClick={() => {
                            setEditing(p);
                            setError("");
                          }}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("delete")}
                          onClick={() => setDeleting(p)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows?.length && <div className="empty">{t("noResults")}</div>}
          </div>
        )}
      </section>
      {editing && (
        <Modal
          title={t(editing.id ? "edit" : "add")}
          onClose={() => setEditing(null)}
        >
          {error && <Failure code={error} />}
          <form className="product-form" onSubmit={save}>
            <div className="form-grid">
              {[
                { key: "name", label: "productName", type: "text" },
                { key: "name_kk", label: "productNameKk", type: "text" },
                { key: "sku", label: "sku", type: "text" },
                { key: "category", label: "category", type: "text" },
                { key: "cost_price", label: "unitCost", type: "number" },
                { key: "selling_price", label: "price", type: "number" },
                { key: "stock_quantity", label: "stock", type: "number" },
                { key: "reorder_point", label: "reorderPoint", type: "number" },
              ].map((f) => (
                <label key={f.key}>
                  {t(f.label)}
                  <input
                    name={f.key}
                    defaultValue={String(editing[f.key as keyof Product] ?? "")}
                    type={f.type}
                    required={f.key !== "name_kk"}
                    min={f.key === "selling_price" ? 0.01 : 0}
                    max={f.type === "number" ? 10000000 : undefined}
                    step={f.key.includes("price") ? ".01" : "1"}
                    maxLength={f.type === "text" ? 160 : undefined}
                  />
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
              >
                {t("cancel")}
              </Button>
              <Button disabled={busy}>
                {busy && <Spinner />}
                {t("save")}
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal
          title={t("deleteConfirm")}
          onClose={() => setDeleting(undefined)}
        >
          <p>
            {locale === "kk"
              ? deleting.name_kk || deleting.name
              : deleting.name}
          </p>
          <div className="modal-actions">
            <Button variant="outline" onClick={() => setDeleting(undefined)}>
              {t("cancel")}
            </Button>
            <Button variant="danger" onClick={remove} disabled={busy}>
              {busy && <Spinner />}
              {t("delete")}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
