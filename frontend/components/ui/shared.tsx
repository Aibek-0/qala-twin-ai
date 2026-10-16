"use client";
import { useTranslations } from "next-intl";
import { AlertTriangle, LoaderCircle, Inbox, X } from "lucide-react";
import { Button } from "./button";
import { useEffect, useRef } from "react";
export function Spinner() {
  return <LoaderCircle className="spin" size={16} />;
}
export function Loading() {
  const t = useTranslations();
  return (
    <div className="skeleton-grid" role="status" aria-label={t("loading")}>
      {Array.from({ length: 6 }, (_, i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
export function Failure({
  code = "error",
  retry,
}: {
  code?: string;
  retry?: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="notice danger" role="alert">
      <AlertTriangle size={18} />
      <span>{t.has(code) ? t(code) : t("error")}</span>
      {retry && (
        <Button variant="outline" size="sm" onClick={retry}>
          {t("retry")}
        </Button>
      )}
    </div>
  );
}
export function Empty() {
  const t = useTranslations();
  return (
    <div className="empty">
      <Inbox size={32} />
      <h3>{t("noData")}</h3>
      <p>{t("noDataBody")}</p>
    </div>
  );
}
export function Badge({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={"badge " + tone}>{children}</span>;
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
      className="modal"
    >
      <div className="panel-head">
        <h2>{title}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close / Жабу / Закрыть"
        >
          <X size={18} />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
