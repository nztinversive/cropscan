"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Field, Flight, HealthMap } from "@/lib/types";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import mapboxgl from "mapbox-gl";

const zoneColors: Record<string, string> = {
  healthy: "#22C55E",
  moderate: "#EAB308",
  stressed: "#F97316",
  critical: "#EF4444",
};

const zoneFill: Record<string, string> = {
  healthy: "rgba(34,197,94,0.25)",
  moderate: "rgba(234,179,8,0.25)",
  stressed: "rgba(249,115,22,0.25)",
  critical: "rgba(239,68,68,0.25)",
};

export default function FieldDetailPage() {
  const { id } = useParams<{ id: string }>();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [field, setField] = useState<Field | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [healthMaps, setHealthMaps] = useState<HealthMap[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/fields/${id}`).then((r) => r.json()),
      fetch(`/api/fields/${id}/flights`).then((r) => r.json()),
      fetch(`/api/fields/${id}/healthmaps`).then((r) => r.json()),
    ]).then(([fieldData, flightData, hmData]) => {
      setField(fieldData);
      setFlights(flightData);
      setHealthMaps(hmData);
      if (flightData.length > 0)
        setSelectedFlight(flightData[flightData.length - 1].id);
      setLoading(false);
    });
  }, [id]);

  // Initialize map
  useEffect(() => {
    if (!field || !mapContainer.current || mapRef.current) return;

    (mapboxgl as typeof mapboxgl).accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    const bounds = field.boundaries;
    const centerLat = bounds.reduce((s, p) => s + p.lat, 0) / bounds.length;
    const centerLng = bounds.reduce((s, p) => s + p.lng, 0) / bounds.length;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [centerLng, centerLat],
      zoom: 14,
    });

    map.on("load", () => {
      // Field boundary
      const coords = [...bounds.map((p) => [p.lng, p.lat]), [bounds[0].lng, bounds[0].lat]];
      map.addSource("field-boundary", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [coords] },
        },
      });
      map.addLayer({
        id: "field-outline",
        type: "line",
        source: "field-boundary",
        paint: { "line-color": "#22C55E", "line-width": 3 },
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [field]);

  // Update health zones on map when flight changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedFlight) return;

    const hm = healthMaps.find((h) => h.flightId === selectedFlight);
    if (!hm) return;

    const addZones = () => {
      // Remove old zones
      hm.zones.forEach((_, i) => {
        if (map.getLayer(`zone-fill-${i}`)) map.removeLayer(`zone-fill-${i}`);
        if (map.getLayer(`zone-line-${i}`)) map.removeLayer(`zone-line-${i}`);
        if (map.getSource(`zone-${i}`)) map.removeSource(`zone-${i}`);
      });

      hm.zones.forEach((zone, i) => {
        const coords = [
          ...zone.polygon.map((p) => [p.lng, p.lat]),
          [zone.polygon[0].lng, zone.polygon[0].lat],
        ];
        map.addSource(`zone-${i}`, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "Polygon", coordinates: [coords] },
          },
        });
        map.addLayer({
          id: `zone-fill-${i}`,
          type: "fill",
          source: `zone-${i}`,
          paint: { "fill-color": zoneFill[zone.classification] ?? zoneFill.moderate },
        });
        map.addLayer({
          id: `zone-line-${i}`,
          type: "line",
          source: `zone-${i}`,
          paint: {
            "line-color": zoneColors[zone.classification] ?? zoneColors.moderate,
            "line-width": 2,
          },
        });
      });
    };

    if (map.isStyleLoaded()) {
      addZones();
    } else {
      map.on("load", addZones);
    }
  }, [selectedFlight, healthMaps]);

  if (loading || !field) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-[#111111] p-6 text-zinc-400">
        Loading field...
      </div>
    );
  }

  const currentHm = healthMaps.find((h) => h.flightId === selectedFlight);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border border-zinc-800 bg-[#111111] p-6">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← Back to Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">
          {field.name}
        </h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-400">
          <span>{field.cropType}</span>
          <span>{field.acreage} acres</span>
          <span>Health: {field.healthScore}/100</span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2">
          <div
            ref={mapContainer}
            className="h-[500px] rounded-xl border border-zinc-800"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Flight selector */}
          <div className="rounded-xl border border-zinc-800 bg-[#111111] p-4">
            <h3 className="mb-3 text-sm font-medium text-zinc-300">Flights</h3>
            <div className="space-y-2">
              {flights.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFlight(f.id)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                    selectedFlight === f.id
                      ? "border-[#22C55E] bg-[#22C55E]/10 text-[#22C55E]"
                      : "border-zinc-800 bg-[#0a0a0a] text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  <p className="font-medium">{f.date}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {f.droneModel} · {f.imageCount} images
                  </p>
                  {f.notes && (
                    <p className="mt-1 text-xs text-zinc-500">{f.notes}</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Health zones */}
          {currentHm && (
            <div className="rounded-xl border border-zinc-800 bg-[#111111] p-4">
              <h3 className="mb-3 text-sm font-medium text-zinc-300">
                Health Zones
              </h3>
              <div className="space-y-2">
                {currentHm.zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="rounded-lg border border-zinc-800 bg-[#0a0a0a] p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            zoneColors[zone.classification] ?? "#888",
                        }}
                      />
                      <span className="text-sm font-medium capitalize text-zinc-200">
                        {zone.classification}
                      </span>
                      <span className="ml-auto text-xs text-zinc-500">
                        {zone.areaAcres} ac
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">
                      VARI: {zone.avgValue.toFixed(2)}
                      {zone.stressType && ` · ${zone.stressType}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
