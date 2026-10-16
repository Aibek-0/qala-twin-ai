"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Boxes, RotateCcw, Users, Layers, Save } from "lucide-react";
import { api, errorKey, type Layout, type TwinState } from "@/lib/api";
import { Button } from "../ui/button";
import { Badge, Failure, Spinner } from "../ui/shared";
const TwinScene = dynamic(() => import("../twin-scene"), {
  ssr: false,
  loading: () => <div className="skeleton scene-skeleton" />,
});
export default function DigitalTwin() {
  const t = useTranslations();
  const [state, setState] = useState<TwinState>();
  const [ready, setReady] = useState(false);
  const [layout, setLayout] = useState<Layout>({
    cashiers: 2,
    shelves: 8,
    version: 1,
  });
  const [heatmap, setHeatmap] = useState(false);
  const [reset, setReset] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let alive = true;
    api<Layout>("/twin/layout")
      .then((l) => {
        if (alive) {
          setLayout(l);
          setReady(true);
        }
      })
      .catch((e) => setError(errorKey(e)));
    async function tick() {
      try {
        const s = await api<TwinState>("/twin/state");
        if (alive) setState(s);
      } catch (e) {
        if (alive) setError(errorKey(e));
      }
    }
    void tick();
    const interval = setInterval(tick, 5000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);
  async function save() {
    setBusy(true);
    setError("");
    try {
      setLayout(
        await api<Layout>("/twin/layout", {
          method: "PATCH",
          body: JSON.stringify({
            cashiers: layout.cashiers,
            shelves: layout.shelves,
          }),
        }),
      );
      setSaved(true);
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
          <div className="eyebrow">QALA TWIN AI / {t("digital-twin")}</div>
          <h1>{t("digital-twin")}</h1>
          <p>{t("twinSub")}</p>
        </div>
        <Badge>{t(state?.measurement || "unavailable")}</Badge>
      </div>
      {error && <Failure code={error} />}
      <div className="twin-layout">
        <section className="panel twin-view">
          <div className="twin-view-bar">
            <span>
              <i /> QALA MART / 3D VIEW
            </span>
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHeatmap(!heatmap)}
                aria-pressed={heatmap}
              >
                <Layers size={15} />
                {t("heatmap")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setReset((v) => v + 1)}
                aria-label={t("resetView")}
              >
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>
          <div className="full-scene">
            <TwinScene
              occupancy={state?.occupancy || 0}
              cashiers={layout.cashiers}
              shelves={layout.shelves}
              heatmap={heatmap}
              reset={reset}
            />
          </div>
          <div className="twin-view-footer">
            <span>{t("orbitHint")}</span>
            <span className="mono">WEBGL / R3F</span>
          </div>
        </section>
        <aside className="twin-controls">
          <section className="panel">
            <div className="panel-head">
              <h2>{t("occupancy")}</h2>
              <Users size={18} className="accent" />
            </div>
            <div className="result-big">
              {state?.occupancy ?? "—"}
              <span>{t("people")}</span>
            </div>
            <Badge tone={state?.stale ? "orange" : "blue"}>
              {t(state?.stale ? "stale" : state?.measurement || "unavailable")}
            </Badge>
            <p className="panel-note">{t("schematic")}</p>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>{t("layout")}</h2>
              <Boxes size={18} />
            </div>
            <label>
              {t("cashiers")}
              <input
                type="number"
                disabled={!ready}
                min={1}
                max={8}
                value={layout.cashiers}
                onChange={(e) => {
                  setLayout({
                    ...layout,
                    cashiers: Math.max(1, Math.min(8, Number(e.target.value))),
                  });
                  setSaved(false);
                }}
              />
            </label>
            <label>
              {t("shelves")}
              <input
                type="range"
                disabled={!ready}
                min={2}
                max={16}
                value={layout.shelves}
                onChange={(e) => {
                  setLayout({ ...layout, shelves: Number(e.target.value) });
                  setSaved(false);
                }}
              />
              <span className="muted">{layout.shelves}</span>
            </label>
            <Button onClick={save} disabled={busy || !ready}>
              {busy ? <Spinner /> : <Save size={15} />}{" "}
              {t(saved ? "saved" : "save")}
            </Button>
          </section>
          {heatmap && <div className="notice">{t("heatmapHint")}</div>}
        </aside>
      </div>
      <p className="panel-note">{t("schematic")}</p>
    </>
  );
}
