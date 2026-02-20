"use client";

import { useEffect, useState } from "react";
import type { Field, Flight, HealthMap } from "@/lib/types";

const classColors: Record<string, string> = {
  healthy: "text-[#22C55E]",
  moderate: "text-[#EAB308]",
  stressed: "text-[#EF4444]",
  critical: "text-[#EF4444]",
};

export default function ComparePage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [leftFieldId, setLeftFieldId] = useState("");
  const [rightFieldId, setRightFieldId] = useState("");
  const [leftFlights, setLeftFlights] = useState<Flight[]>([]);
  const [rightFlights, setRightFlights] = useState<Flight[]>([]);
  const [leftFlightId, setLeftFlightId] = useState("");
  const [rightFlightId, setRightFlightId] = useState("");
  const [leftMap, setLeftMap] = useState<HealthMap | null>(null);
  const [rightMap, setRightMap] = useState<HealthMap | null>(null);

  useEffect(() => {
    fetch("/api/fields")
      .then((r) => r.json())
      .then((data: Field[]) => {
        setFields(data);
        if (data.length >= 1) setLeftFieldId(data[0].id);
        if (data.length >= 2) setRightFieldId(data[1].id);
        else if (data.length >= 1) setRightFieldId(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!leftFieldId) return;
    fetch(`/api/fields/${leftFieldId}/flights`)
      .then((r) => r.json())
      .then((data: Flight[]) => {
        setLeftFlights(data);
        if (data.length > 0) setLeftFlightId(data[data.length - 1].id);
      });
  }, [leftFieldId]);

  useEffect(() => {
    if (!rightFieldId) return;
    fetch(`/api/fields/${rightFieldId}/flights`)
      .then((r) => r.json())
      .then((data: Flight[]) => {
        setRightFlights(data);
        if (data.length > 0) setRightFlightId(data[data.length - 1].id);
      });
  }, [rightFieldId]);

  useEffect(() => {
    if (!leftFieldId) return;
    fetch(`/api/fields/${leftFieldId}/healthmaps`)
      .then((r) => r.json())
      .then((maps: HealthMap[]) => {
        const match = maps.find((m) => m.flightId === leftFlightId);
        setLeftMap(match ?? maps[maps.length - 1] ?? null);
      });
  }, [leftFieldId, leftFlightId]);

  useEffect(() => {
    if (!rightFieldId) return;
    fetch(`/api/fields/${rightFieldId}/healthmaps`)
      .then((r) => r.json())
      .then((maps: HealthMap[]) => {
        const match = maps.find((m) => m.flightId === rightFlightId);
        setRightMap(match ?? maps[maps.length - 1] ?? null);
      });
  }, [rightFieldId, rightFlightId]);

  const renderPanel = (
    side: "left" | "right",
    fieldId: string,
    setFieldId: (id: string) => void,
    flightList: Flight[],
    flightId: string,
    setFlightId: (id: string) => void,
    healthMap: HealthMap | null
  ) => (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-[#111111] p-6">
      <div>
        <label className="mb-1 block text-xs text-zinc-400">Field</label>
        <select
          value={fieldId}
          onChange={(e) => setFieldId(e.target.value)}
          className="w-full rounded-lg border border-zinc-800 bg-[#0a0a0a] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#22C55E]"
        >
          {fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-zinc-400">Flight</label>
        <select
          value={flightId}
          onChange={(e) => setFlightId(e.target.value)}
          className="w-full rounded-lg border border-zinc-800 bg-[#0a0a0a] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#22C55E]"
        >
          {flightList.map((f) => (
            <option key={f.id} value={f.id}>
              {f.date} — {f.notes || f.droneModel}
            </option>
          ))}
        </select>
      </div>

      {healthMap ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-300">
              Overall Score
            </p>
            <p className="text-2xl font-bold text-zinc-100">
              {healthMap.overallScore}
            </p>
          </div>

          <div className="space-y-2">
            {healthMap.zones.map((zone) => (
              <div
                key={zone.id}
                className="rounded-lg border border-zinc-800 bg-[#0a0a0a] p-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium capitalize ${classColors[zone.classification] ?? "text-zinc-300"}`}
                  >
                    {zone.classification}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {zone.areaAcres} ac
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-zinc-400">
                  <span>VARI: {zone.avgValue.toFixed(2)}</span>
                  {zone.stressType && <span>{zone.stressType}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No health data available</p>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-zinc-800 bg-[#111111] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Temporal Analysis
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">
          Compare Flights
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Side-by-side comparison of health data between flights or fields.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {renderPanel(
          "left",
          leftFieldId,
          setLeftFieldId,
          leftFlights,
          leftFlightId,
          setLeftFlightId,
          leftMap
        )}
        {renderPanel(
          "right",
          rightFieldId,
          setRightFieldId,
          rightFlights,
          rightFlightId,
          setRightFlightId,
          rightMap
        )}
      </div>
    </div>
  );
}
