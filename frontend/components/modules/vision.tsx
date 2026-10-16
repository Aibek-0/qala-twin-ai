"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Video,
  VideoOff,
  Upload,
  ScanLine,
  Users,
  Clock,
  Activity,
} from "lucide-react";
import { api, errorKey, type TwinState } from "@/lib/api";
import { Button } from "../ui/button";
import { Badge, Failure, Spinner } from "../ui/shared";
type Detection = {
  person_count: number;
  inference_ms?: number;
  measurement: string;
  boxes?: { box: number[]; confidence: number }[];
  samples?: { second: number; person_count: number }[];
};
type Event = {
  id: string;
  timestamp: string;
  person_count: number;
  measurement: string;
};
export default function Vision() {
  const t = useTranslations();
  const locale = useLocale();
  const video = useRef<HTMLVideoElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const upload = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);
  const [enabled, setEnabled] = useState<boolean>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Detection>();
  const [events, setEvents] = useState<Event[]>([]);
  function stop() {
    generation.current++;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (video.current) video.current.srcObject = null;
    setActive(false);
    const c = overlay.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  }
  useEffect(() => {
    api<{ enabled: boolean }[]>("/vision/cameras")
      .then((r) => setEnabled(r[0]?.enabled))
      .catch((e) => setError(errorKey(e)));
    api<Event[]>("/vision/events")
      .then(setEvents)
      .catch(() => {});
    return () => {
      generation.current++;
      stream.current?.getTracks().forEach((track) => track.stop());
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  async function detect(epoch: number) {
    if (epoch !== generation.current || !stream.current || !video.current)
      return;
    const v = video.current;
    if (v.readyState < 2) {
      timer.current = setTimeout(() => detect(epoch), 500);
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = Math.round((640 * v.videoHeight) / v.videoWidth);
    canvas.getContext("2d")?.drawImage(v, 0, 0, canvas.width, canvas.height);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.8),
      );
      if (!blob) throw new Error();
      const form = new FormData();
      form.set("file", blob, "frame.jpg");
      const r = await api<Detection>("/vision/analyze-frame", {
        method: "POST",
        body: form,
      });
      if (epoch !== generation.current) return;
      setResult(r);
      setEvents((old) =>
        [
          {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            person_count: r.person_count,
            measurement: r.measurement,
          },
          ...old,
        ].slice(0, 60),
      );
      const c = overlay.current;
      if (c) {
        c.width = canvas.width;
        c.height = canvas.height;
        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, c.width, c.height);
          ctx.strokeStyle = "#2dd4a3";
          ctx.lineWidth = 2;
          ctx.font = "14px sans-serif";
          ctx.fillStyle = "#2dd4a3";
          r.boxes?.forEach((b) => {
            const [x, y, x2, y2] = b.box;
            ctx.strokeRect(
              x * c.width,
              y * c.height,
              (x2 - x) * c.width,
              (y2 - y) * c.height,
            );
            ctx.fillText(
              `${Math.round(b.confidence * 100)}%`,
              x * c.width,
              y * c.height - 5,
            );
          });
        }
      }
      timer.current = setTimeout(() => detect(epoch), 750);
    } catch (e) {
      if (epoch === generation.current) {
        setError(errorKey(e));
        stop();
      }
    }
  }
  async function start() {
    const epoch = ++generation.current;
    setError("");
    setBusy(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error("cameraDenied");
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      if (epoch !== generation.current) {
        cameraStream.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = cameraStream;
      if (video.current) {
        video.current.srcObject = stream.current;
        await video.current.play();
      }
      setActive(true);
      void detect(epoch);
    } catch (e) {
      stop();
      setError("cameraDenied");
    } finally {
      setBusy(false);
    }
  }
  async function analyze(file?: File) {
    if (!file) return;
    stop();
    setBusy(true);
    setError("");
    try {
      if (file.size > 50 * 1024 * 1024) {
        setError("file_too_large");
        return;
      }
      const f = new FormData();
      f.set("file", file);
      const r = await api<Detection>("/vision/analyze-video", {
        method: "POST",
        body: f,
      });
      setResult(r);
      setEvents(await api<Event[]>("/vision/events"));
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
          <div className="eyebrow">COMPUTER VISION / YOLO</div>
          <h1>{t("vision")}</h1>
          <p>{t("visionSub")}</p>
        </div>
        <Badge tone={active ? "green" : "blue"}>
          {t(active ? "live" : "unavailable")}
        </Badge>
      </div>
      {error && <Failure code={error} />}{" "}
      {enabled === false && (
        <div className="notice">{t("visionUnavailable")}</div>
      )}
      <div className="vision-layout">
        <section className="panel camera-panel">
          <div className="panel-head">
            <h2>
              <Video size={18} />
              {t("vision")}
            </h2>
            <span className="mono muted">CAM 01 / BROWSER</span>
          </div>
          <div className={"camera-view " + (active ? "active" : "")}>
            <video ref={video} playsInline muted />
            <canvas ref={overlay} />
            {!active && (
              <div className="camera-empty">
                <ScanLine size={48} />
                <h3>{busy ? t("analyzing") : t("cameraIdle")}</h3>
                <p>{t("cameraHint")}</p>
              </div>
            )}
            {active && (
              <span className="camera-live">
                <i /> {t("live")} / YOLO
              </span>
            )}
          </div>
          <div className="camera-actions">
            <Button
              onClick={active ? stop : start}
              disabled={busy || enabled !== true}
            >
              {busy ? (
                <Spinner />
              ) : active ? (
                <VideoOff size={17} />
              ) : (
                <Video size={17} />
              )}{" "}
              {t(active ? "stopCamera" : "startCamera")}
            </Button>
            <Button
              variant="outline"
              onClick={() => upload.current?.click()}
              disabled={busy || active || enabled !== true}
            >
              <Upload size={16} />
              {t("uploadVideo")}
            </Button>
            <input
              type="file"
              hidden
              accept=".mp4,.webm,.mov"
              ref={upload}
              onChange={(e) => analyze(e.target.files?.[0])}
            />
          </div>
          <p className="panel-note">{t("videoHint")}</p>
        </section>
        <aside className="vision-stats">
          <section className="panel">
            <div className="panel-head">
              <h2>{t("detections")}</h2>
              <Users size={19} className="accent" />
            </div>
            <div className="result-big">
              {result?.person_count ?? "—"}
              <span>{t("people")}</span>
            </div>
            <Badge>{t(result?.measurement || "unavailable")}</Badge>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>{t("inference")}</h2>
              <Activity size={18} />
            </div>
            <div className="result-big">
              {result?.inference_ms ?? "—"}
              <span>ms</span>
            </div>
          </section>
          <div className="notice">{t("trackingNote")}</div>
        </aside>
      </div>
      {result?.samples && (
        <section className="panel">
          <div className="panel-head">
            <h2>{t("uploadVideo")}</h2>
            <Badge>{t("uploaded_video")}</Badge>
          </div>
          <div className="video-timeline">
            {result.samples.map((s) => (
              <div key={s.second}>
                <span
                  style={{ height: Math.max(4, s.person_count * 12) }}
                  title={`${s.second}s: ${s.person_count}`}
                />
                <small>{s.second}s</small>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="panel">
        <div className="panel-head">
          <h2>
            <Clock size={17} />
            {t("events")}
          </h2>
          <Badge>{events.length}</Badge>
        </div>
        <div className="table-wrap scroll-table">
          <table>
            <thead>
              <tr>
                <th>{t("date")}</th>
                <th>{t("detections")}</th>
                <th>{t("source")}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>
                    {new Date(
                      e.timestamp.endsWith("Z")
                        ? e.timestamp
                        : e.timestamp + "Z",
                    ).toLocaleString(locale, { timeZone: "Asia/Qyzylorda" })}
                  </td>
                  <td>{e.person_count}</td>
                  <td>
                    <Badge>{t(e.measurement)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!events.length && <div className="empty">{t("noData")}</div>}
        </div>
      </section>
    </>
  );
}
