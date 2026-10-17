"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Save,
  Store,
  Languages,
  Sun,
  Database,
  ShieldCheck,
} from "lucide-react";
import { api, errorKey, type Business } from "@/lib/api";
import { Button } from "../ui/button";
import { Badge, Failure, Spinner } from "../ui/shared";
export default function SettingsPage({
  business,
  theme,
  changeTheme,
  changeLocale,
  onSave,
}: {
  business: Business;
  theme: string;
  changeTheme: () => void;
  changeLocale: () => void;
  onSave: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [ai, setAi] = useState<{
    configured: boolean;
    model: string | null;
    last_error: string | null;
  }>();
  useEffect(() => {
    api<{
      configured: boolean;
      model: string | null;
      last_error: string | null;
    }>("/ai/status")
      .then(setAi)
      .catch(() => {});
  }, []);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api("/settings/profile", {
        method: "PATCH",
        body: JSON.stringify(Object.fromEntries(f)),
      });
      setSaved(true);
      onSave();
    } catch (e) {
      setError(errorKey(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">QALA TWIN AI / {t("settings")}</div>
          <h1>{t("settings")}</h1>
          <p>{t("settingsSub")}</p>
        </div>
      </div>
      {error && <Failure code={error} />}
      <div className="settings-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>
              <Store size={18} />
              {t("businessProfile")}
            </h2>
          </div>
          <form onSubmit={save}>
            <label>
              {t("businessName")}
              <input
                name="name"
                defaultValue={business.name}
                required
                maxLength={120}
              />
            </label>
            <label>
              {t("city")}
              <input
                name="city"
                defaultValue={business.city}
                required
                maxLength={120}
              />
            </label>
            <label>
              {t("currency")}
              <input value="KZT · ₸" disabled readOnly />
            </label>
            <Button disabled={busy}>
              {busy ? <Spinner /> : <Save size={15} />}{" "}
              {t(saved ? "saved" : "save")}
            </Button>
          </form>
        </section>
        <div>
          <section className="panel">
            <div className="setting-row">
              <span className="icon-chip blue">
                <Languages size={18} />
              </span>
              <div>
                <h3>{t("language")}</h3>
                <p>{locale === "kk" ? "Қазақша" : "Русский"}</p>
              </div>
              <Button variant="outline" size="sm" onClick={changeLocale}>
                {locale === "kk" ? "Русский" : "Қазақша"}
              </Button>
            </div>
            <div className="setting-row">
              <span className="icon-chip purple">
                <Sun size={18} />
              </span>
              <div>
                <h3>{t("theme")}</h3>
                <p>{t(theme)}</p>
              </div>
              <Button variant="outline" size="sm" onClick={changeTheme}>
                {t(theme === "dark" ? "light" : "dark")}
              </Button>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>
                <Database size={17} />
                {t("dataSource")}
              </h2>
              <Badge>{t(business.is_demo ? "demo" : "imported")}</Badge>
            </div>
            <p className="panel-note">
              {business.is_demo ? t("sourceNote") : t("realSourceNote")}
            </p>
            <div className="setting-auth">
              <ShieldCheck size={18} />
              <p>
                {t(
                  business.auth_configured
                    ? "authConfigured"
                    : "localAuthActive",
                )}
              </p>
            </div>
            <div className="setting-ai">
              <h3>{t("aiSettings")}</h3>
              <Badge tone={ai?.configured ? "green" : "orange"}>
                {t(ai?.configured ? "aiConfigured" : "ai_not_configured")}
              </Badge>
              {ai?.model && <p className="mono">{ai.model}</p>}
              {ai?.last_error && <Failure code={ai.last_error} />}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
