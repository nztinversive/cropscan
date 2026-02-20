"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Alert, DashboardStats, Field } from "@/lib/types";

const numberFormatter = new Intl.NumberFormat("en-US");

const statusColors: Record<Field["healthStatus"], string> = {
  healthy: "border-[#22C55E] bg-[#22C55E]/10 text-[#22C55E]",
  watch: "border-[#EAB308] bg-[#EAB308]/10 text-[#EAB308]",
  critical: "border-[#EF4444] bg-[#EF4444]/10 text-[#EF4444]",
};

const severityColors: Record<Alert["severity"], string> = {
  watch: "border-[#EAB308] bg-[#EAB308]/10 text-[#EAB308]",
  critical: "border-[#EF4444] bg-[#EF4444]/10 text-[#EF4444]",
};

function formatStatus(status: Field["healthStatus"]): string {
  if (status === "healthy") return "Healthy";
  if (status === "watch") return "Watch";
  return "Critical";
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const [statsResponse, fieldsResponse] = await Promise.all([
          fetch("/api/dashboard", { signal: controller.signal }),
          fetch("/api/fields", { signal: controller.signal }),
        ]);

        if (!statsResponse.ok || !fieldsResponse.ok) {
          throw new Error("Unable to load dashboard data");
        }

        const [statsData, fieldsData] = await Promise.all([
          statsResponse.json() as Promise<DashboardStats>,
          fieldsResponse.json() as Promise<Field[]>,
        ]);

        if (controller.signal.aborted) {
          return;
        }

        setStats(statsData);
        setFields(fieldsData);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Failed to load dashboard";
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      controller.abort();
    };
  }, []);

  const fieldById = useMemo(() => {
    const map = new Map<string, Field>();
    for (const field of fields) {
      map.set(field.id, field);
    }
    return map;
  }, [fields]);

  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => a.name.localeCompare(b.name)),
    [fields],
  );

  const recentAlerts = useMemo(
    () => (stats ? [...stats.recentAlerts].reverse() : []),
    [stats],
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-[#111111] p-6 text-zinc-400">
        Loading dashboard...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-[#EF4444] bg-[#111111] p-6">
        <p className="text-sm text-[#EF4444]">
          {error ?? "Unable to load dashboard"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-zinc-800 bg-[#111111] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Crop Intelligence
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">
          Crop Health Dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Monitor field health, review recent flights, and prioritize alerts
          that need intervention.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-zinc-800 bg-[#111111] p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Total Fields
          </p>
          <p className="mt-2 text-3xl font-semibold text-zinc-100">
            {stats.totalFields}
          </p>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-[#111111] p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Total Flights
          </p>
          <p className="mt-2 text-3xl font-semibold text-zinc-100">
            {stats.totalFlights}
          </p>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-[#111111] p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Total Acres
          </p>
          <p className="mt-2 text-3xl font-semibold text-zinc-100">
            {numberFormatter.format(stats.totalAcres)}
          </p>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-[#111111] p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Active Alerts
          </p>
          <p className="mt-2 text-3xl font-semibold text-zinc-100">
            {stats.recentAlerts.length}
          </p>
        </article>
      </section>

      <section id="fields" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">Fields</h2>
          <p className="text-sm text-zinc-400">
            {sortedFields.length} monitored fields
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedFields.map((field) => (
            <Link
              key={field.id}
              href={`/field/${field.id}`}
              className="group rounded-xl border border-zinc-800 bg-[#111111] p-5 transition-colors hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-zinc-100 group-hover:text-[#22C55E]">
                  {field.name}
                </h3>
                <span
                  className={`rounded-full border px-2 py-1 text-xs font-medium ${statusColors[field.healthStatus]}`}
                >
                  {formatStatus(field.healthStatus)}
                </span>
              </div>

              <p className="mt-2 text-sm text-zinc-400">{field.cropType}</p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-zinc-800 bg-[#0a0a0a] p-3">
                  <p className="text-xs text-zinc-500">Health Score</p>
                  <p className="mt-1 font-semibold text-zinc-100">
                    {field.healthScore}/100
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-[#0a0a0a] p-3">
                  <p className="text-xs text-zinc-500">Acreage</p>
                  <p className="mt-1 font-semibold text-zinc-100">
                    {numberFormatter.format(field.acreage)} ac
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs text-zinc-500">
                Updated {formatDate(field.updatedAt)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-[#111111] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">Recent Alerts</h2>
          <p className="text-sm text-zinc-400">{recentAlerts.length} open</p>
        </div>

        {recentAlerts.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No active alerts.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {recentAlerts.map((alert) => {
              const field = fieldById.get(alert.fieldId);
              return (
                <li
                  key={alert.id}
                  className="rounded-lg border border-zinc-800 bg-[#0a0a0a] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-100">
                      {field?.name ?? "Unknown Field"}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-medium ${severityColors[alert.severity]}`}
                    >
                      {alert.severity === "critical" ? "Critical" : "Watch"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">{alert.message}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {alert.stressType} | {formatDate(alert.createdAt)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}