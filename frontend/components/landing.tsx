"use client";
import Link from "next/link";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  ArrowUpRight,
  Play,
  Check,
  ShoppingBag,
  Package,
  FlaskConical,
  Sparkles,
  ChartNoAxesCombined,
  ScanLine,
  ChevronRight,
} from "lucide-react";
import { api, errorKey } from "@/lib/api";
import { Button } from "./ui/button";
import { Badge, Failure, Spinner } from "./ui/shared";
const TwinScene = dynamic(() => import("./twin-scene"), { ssr: false });
export default function Landing() {
  const t = useTranslations();
  const locale = useLocale();
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
  return (
    <main className="landing landing-new">
      <section className="new-hero">
        <div className="hero-editorial">
          <Badge tone="green">
            <span className="pulse-dot" />
            {t("heroEyebrow")}
          </Badge>
          <h1>{t("heroTitle")}</h1>
          <p>{t("heroRealSub")}</p>
          <div className="hero-actions">
            <Button asChild>
              <Link href={`/${locale}/register`}>
                {t("startMyBusiness")}
                <ArrowUpRight size={18} />
              </Link>
            </Button>
            <Button variant="outline" disabled={busy} onClick={demo}>
              {busy ? <Spinner /> : <Play size={16} />} {t("exploreDemo")}
            </Button>
          </div>
          {error && <Failure code={error} />}
          <div className="hero-proof">
            <span>
              <Check size={14} />
              {t("realBusiness")}
            </span>
            <span>
              <Check size={14} />
              {t("yourData")}
            </span>
            <span>
              <Check size={14} />
              KK / RU
            </span>
          </div>
        </div>
        <div className="hero-store-card">
          <div className="store-card-header">
            <span className="store-card-logo">Q</span>
            <div>
              <strong>QALA MART</strong>
              <small>{t("interactivePreview")}</small>
            </div>
            <Badge>{t("demo")}</Badge>
          </div>
          <div className="hero-store-scene">
            <TwinScene compact occupancy={18} />
          </div>
          <div className="store-signal">
            <span className="signal-icon">
              <ScanLine size={20} />
            </span>
            <div>
              <strong>{t("seeYourBusiness")}</strong>
              <small>{t("previewCaption")}</small>
            </div>
            <span className="signal-pulse" />
          </div>
          <div className="floating-decision">
            <span className="icon-chip green">
              <FlaskConical size={21} />
            </span>
            <div>
              <strong>{t("decideBeforeSpending")}</strong>
              <small>{t("simulatorValue")}</small>
            </div>
          </div>
        </div>
      </section>
      <section className="value-strip">
        <span>{t("builtForRealWork")}</span>
        <div>
          {["sales", "inventory", "simulation", "ai-assistant"].map((k) => (
            <span key={k}>
              {t(k)}
              <i />
            </span>
          ))}
        </div>
      </section>
      <section className="landing-section real-problems" id="how">
        <div className="section-intro">
          <div>
            <span className="eyebrow">01 / {t("practicalIntelligence")}</span>
            <h2>{t("realProblemsTitle")}</h2>
          </div>
          <p>{t("realProblemsSub")}</p>
        </div>
        <div className="problem-cards">
          {[
            {
              icon: Package,
              title: "preventStockout",
              body: "preventStockoutBody",
              tag: "stock",
            },
            {
              icon: ChartNoAxesCombined,
              title: "stopMarginLeak",
              body: "stopMarginLeakBody",
              tag: "margin",
            },
            {
              icon: FlaskConical,
              title: "decideBeforeSpending",
              body: "simulatorValue",
              tag: "simulation",
            },
          ].map((p, i) => (
            <article className="panel problem-card" key={p.title}>
              <div>
                <span className="icon-chip blue">
                  <p.icon size={24} />
                </span>
                <span className="problem-index">0{i + 1}</span>
              </div>
              <Badge tone={i === 0 ? "orange" : i === 1 ? "purple" : "green"}>
                {t(p.tag)}
              </Badge>
              <h3>{t(p.title)}</h3>
              <p>{t(p.body)}</p>
              <Link href={`/${locale}/register`}>
                {t("startMyBusiness")}
                <ArrowUpRight size={17} />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="landing-section working-flow" id="technology">
        <div className="section-intro">
          <div>
            <span className="eyebrow">02 / {t("dailyWorkspace")}</span>
            <h2>{t("fromDataToAction")}</h2>
          </div>
          <p>{t("fromDataToActionSub")}</p>
        </div>
        <div className="real-flow">
          {[
            { key: "connectWorkspace", icon: ShoppingBag },
            { key: "bringYourData", icon: ChartNoAxesCombined },
            { key: "testDecision", icon: FlaskConical },
            { key: "actWithAI", icon: Sparkles },
          ].map((p, i) => (
            <div key={p.key}>
              <span className="flow-number">0{i + 1}</span>
              <p.icon size={26} />
              <h3>{t(p.key)}</h3>
              <p>{t(p.key + "Body")}</p>
              {i < 3 && <ChevronRight className="flow-arrow" size={24} />}
            </div>
          ))}
        </div>
      </section>
      <section className="real-cta">
        <div>
          <span className="eyebrow">QALA TWIN AI</span>
          <h2>{t("ctaRealTitle")}</h2>
          <p>{t("ctaRealBody")}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/register`}>
            {t("startMyBusiness")}
            <ArrowUpRight size={20} />
          </Link>
        </Button>
      </section>
    </main>
  );
}
