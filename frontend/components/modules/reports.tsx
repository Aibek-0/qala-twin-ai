"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  FileText,
  Download,
  FileSpreadsheet,
  ArrowDownToLine,
} from "lucide-react";
import { api, errorKey } from "@/lib/api";
import { Button } from "../ui/button";
import { Badge, Failure, Spinner } from "../ui/shared";
type Report = { id: string; format: string; created_at: string };
export default function Reports() {
  const t = useTranslations();
  const locale = useLocale();
  const [reports, setReports] = useState<Report[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function load() {
    try {
      setReports(await api<Report[]>("/reports"));
    } catch (e) {
      setError(errorKey(e));
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function generate(format: string) {
    setBusy(format);
    setError("");
    try {
      const r = await api<{ download_url: string }>("/reports/generate", {
        method: "POST",
        body: JSON.stringify({ format, locale }),
      });
      const a = document.createElement("a");
      a.href = r.download_url;
      a.download = "qala-report." + format;
      a.click();
      await load();
    } catch (e) {
      setError(errorKey(e));
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">QALA TWIN AI / {t("reports")}</div>
          <h1>{t("reports")}</h1>
          <p>{t("reportsSub")}</p>
        </div>
      </div>
      {error && <Failure code={error} />}
      <div className="report-cards">
        {(["csv", "pdf"] as const).map((format) => (
          <section className="panel report-card" key={format}>
            <span
              className={"icon-chip " + (format === "pdf" ? "purple" : "green")}
            >
              {format === "pdf" ? (
                <FileText size={26} />
              ) : (
                <FileSpreadsheet size={26} />
              )}
            </span>
            <Badge>{format.toUpperCase()}</Badge>
            <h2>{t("reportTitle")}</h2>
            <p>{t("reportBody")}</p>
            <Button onClick={() => generate(format)} disabled={!!busy}>
              {busy === format ? <Spinner /> : <ArrowDownToLine size={17} />}{" "}
              {t(format === "csv" ? "generateCsv" : "generatePdf")}
            </Button>
          </section>
        ))}
      </div>
      <section className="panel">
        <div className="panel-head">
          <h2>{t("reportHistory")}</h2>
          <Badge>{reports.length}</Badge>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("date")}</th>
                <th>{t("reports")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>
                    {new Date(r.created_at + "Z").toLocaleString(locale, {
                      timeZone: "Asia/Qyzylorda",
                    })}
                  </td>
                  <td>
                    <Badge>{r.format.toUpperCase()}</Badge>
                  </td>
                  <td>
                    <Button asChild variant="ghost" size="sm">
                      <a href={`/api/v1/reports/${r.id}/download`} download>
                        <Download size={15} />
                        {t("download")}
                      </a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!reports.length && <div className="empty">{t("noData")}</div>}
        </div>
      </section>
    </>
  );
}
