"use client";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useLocale, useTranslations } from "next-intl";
import type { Day } from "@/lib/api";
export function RevenueChart({
  data,
  forecast = false,
}: {
  data: Day[];
  forecast?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const rows = data.map((d) => ({
    ...d,
    revenue: Number(d.revenue),
    profit: Number(d.profit || 0),
    label: new Date(d.date + "T12:00:00").toLocaleDateString(
      locale === "kk" ? "kk-KZ" : "ru-RU",
      { day: "numeric", month: "short" },
    ),
  }));
  return (
    <div
      className="chart"
      role="img"
      aria-label={t(forecast ? "forecastTitle" : "revenueDynamics")}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={rows}
          margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id={forecast ? "forecastGradient" : "revenueGradient"}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#547bff" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#547bff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <YAxis
            tickFormatter={(v) =>
              Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}k` : String(v)
            }
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={45}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--text)",
            }}
            formatter={(v, name) => [
              new Intl.NumberFormat(locale).format(Number(v)) + " ₸",
              name,
            ]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name={t(forecast ? "forecast" : "revenue")}
            stroke="#668aff"
            strokeWidth={2.5}
            fill={`url(#${forecast ? "forecastGradient" : "revenueGradient"})`}
            strokeDasharray={forecast ? "5 4" : undefined}
            animationDuration={800}
          />
          {!forecast && (
            <Area
              type="monotone"
              dataKey="profit"
              name={t("profit")}
              stroke="#2dd4a3"
              strokeWidth={2}
              fill="transparent"
              animationDuration={900}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function VisitorChart({
  data,
}: {
  data: { hour: string; visitors: number }[];
}) {
  const t = useTranslations();
  return (
    <div className="chart short" role="img" aria-label={t("visitorsFlow")}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={14}>
          <CartesianGrid
            stroke="var(--border)"
            vertical={false}
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="hour"
            tick={{ fill: "var(--muted)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={2}
          />
          <YAxis
            width={28}
            tick={{ fill: "var(--muted)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--text)",
            }}
          />
          <Bar
            dataKey="visitors"
            name={t("occupancy")}
            fill="#6b7ff2"
            radius={[4, 4, 0, 0]}
            animationDuration={700}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
