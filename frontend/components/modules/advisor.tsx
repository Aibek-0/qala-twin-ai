"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Sparkles,
  Send,
  Package,
  Users,
  TrendingUp,
  ChartNoAxesCombined,
  ArrowUpRight,
  Database,
} from "lucide-react";
import { api, errorKey, fmt } from "@/lib/api";
import { Button } from "../ui/button";
import { Badge, Failure, Spinner } from "../ui/shared";
type Message = {
  role: "user" | "assistant";
  text: string;
  locale: string;
  explanation?: string;
  evidence?: Record<string, string | number | null>;
};
export default function Advisor() {
  const t = useTranslations();
  const locale = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState("deterministic");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);
  async function ask(text = question) {
    if (!text.trim() || busy) return;
    setQuestion("");
    setBusy(true);
    setError("");
    setMessages((m) => [...m, { role: "user", text, locale }]);
    try {
      const r = await api<{
        answer: string;
        explanation?: string;
        mode: string;
        evidence: Record<string, string | number | null>;
      }>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ question: text, locale }),
      });
      setMode(r.mode);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: r.answer,
          explanation: r.explanation,
          locale,
          evidence: r.evidence,
        },
      ]);
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
          <div className="eyebrow">QALA TWIN AI / {t("ai-assistant")}</div>
          <h1>{t("ai-assistant")}</h1>
          <p>{t("advisorSub")}</p>
        </div>
        <Badge tone="purple">
          <Sparkles size={13} />
          {t(mode === "deterministic" ? "fallback" : "openaiExplanation")}
        </Badge>
      </div>
      <section className="panel advisor-panel">
        <div className="advisor-scroll">
          {!messages.length ? (
            <div className="advisor-intro">
              <div className="advisor-mark">
                <Sparkles size={34} />
              </div>
              <h2>{t("advisorGreeting")}</h2>
              <p>{t("advisorGreetingBody")}</p>
              <div className="prompt-grid">
                {[
                  { key: "questionProfit", icon: ChartNoAxesCombined },
                  { key: "questionStock", icon: Package },
                  { key: "questionQueue", icon: Users },
                  { key: "questionForecast", icon: TrendingUp },
                ].map((q) => (
                  <button onClick={() => ask(t(q.key))} key={q.key}>
                    <q.icon size={18} />
                    <span>{t(q.key)}</span>
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div className={"chat-message " + m.role} key={i}>
                <span className="chat-avatar">
                  {m.role === "assistant" ? (
                    <Sparkles size={18} />
                  ) : (
                    <Users size={17} />
                  )}
                </span>
                <div>
                  <span className="chat-role">
                    {m.role === "assistant" ? "QALA ADVISOR" : "QALA MART"}
                  </span>
                  <p>{m.text}</p>
                  {m.explanation && (
                    <div className="ai-explanation">
                      <Badge tone="purple">{t("openaiExplanation")}</Badge>
                      <p>{m.explanation}</p>
                    </div>
                  )}
                  {m.evidence && (
                    <div className="chat-evidence">
                      <Database size={12} />
                      {t("evidence")} · {t("revenue")}:{" "}
                      {fmt(m.evidence.revenue, locale, true)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {busy && (
            <div className="chat-message assistant">
              <span className="chat-avatar">
                <Sparkles size={18} />
              </span>
              <div className="thinking">
                <i />
                <i />
                <i />
              </div>
            </div>
          )}
          {error && <Failure code={error} />}
          <div ref={bottom} />
        </div>
        <form
          className="advisor-compose"
          onSubmit={(e) => {
            e.preventDefault();
            void ask();
          }}
        >
          <textarea
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={2000}
            placeholder={t("askPlaceholder")}
            aria-label={t("askPlaceholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void ask();
              }
            }}
          />
          <Button
            size="icon"
            disabled={busy || !question.trim()}
            aria-label={t("send")}
          >
            {busy ? <Spinner /> : <Send size={18} />}
          </Button>
        </form>
        <p className="advisor-disclaimer">
          {t("fallback")} · {t("scenarioOnly")}
        </p>
      </section>
    </>
  );
}
