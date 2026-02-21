"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import type { AnalysisResult } from "@/lib/types";

// Color mapping for the 8 YOLO classes
const classColors: Record<string, string> = {
  cloud_shadow: "#64748b",
  double_plant: "#eab308", 
  planter_skip: "#f97316",
  standing_water: "#0ea5e9",
  waterway: "#06b6d4",
  weed_cluster: "#22c55e",
  nutrient_deficiency: "#dc2626",
  storm_damage: "#7c2d12"
};

const healthScoreColor = (score: number): string => {
  if (score >= 80) return "text-[#22c55e]";
  if (score >= 60) return "text-[#eab308]";
  return "text-[#ef4444]";
};

export default function ResultsPage() {
  const params = useParams();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/results/${params.id}`);
        if (!response.ok) {
          throw new Error('Result not found');
        }
        const data = await response.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load result');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchResult();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--cs-background)] text-[var(--cs-text)] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--cs-surface)] rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-64 bg-[var(--cs-surface)] rounded"></div>
              <div className="h-64 bg-[var(--cs-surface)] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[var(--cs-background)] text-[var(--cs-text)] p-6">
        <div className="max-w-6xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Analysis Result Not Found</h1>
          <p className="text-[var(--cs-muted)] mb-6">{error || 'The requested analysis result could not be found.'}</p>
          <Link href="/upload" className="bg-[var(--cs-green)] text-black px-6 py-2 rounded font-medium hover:opacity-90">
            Back to Upload
          </Link>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = Object.entries(
    result.detections.reduce((acc, detection) => {
      acc[detection.class] = (acc[detection.class] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([className, count]) => ({
    name: className.replace('_', ' ').toUpperCase(),
    value: count,
    color: classColors[className] || "#94a3b8"
  }));

  return (
    <div className="min-h-screen bg-[var(--cs-background)] text-[var(--cs-text)] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analysis Results</h1>
            <p className="text-[var(--cs-muted)]">
              Analyzed on {new Date(result.timestamp).toLocaleDateString()} at{" "}
              {new Date(result.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <Link 
            href="/upload" 
            className="bg-[var(--cs-surface)] text-[var(--cs-text)] px-4 py-2 rounded border border-[var(--cs-border)] hover:bg-[var(--cs-border)]"
          >
            ← Back to Upload
          </Link>
        </div>

        {/* Health Score Card */}
        <div className="bg-[var(--cs-surface)] border border-[var(--cs-border)] rounded-lg p-6 mb-8">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Field Health Score</h2>
            <div className={`text-6xl font-bold ${healthScoreColor(result.healthScore)} mb-2`}>
              {result.healthScore}
            </div>
            <p className="text-[var(--cs-muted)]">
              {result.healthScore >= 80 ? 'Healthy' : 
               result.healthScore >= 60 ? 'Needs Attention' : 'Critical Issues'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image with Overlays */}
          <div className="bg-[var(--cs-surface)] border border-[var(--cs-border)] rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Detection Overlay</h3>
            <div className="relative inline-block">
              <div 
                className="w-full max-w-md rounded border border-[var(--cs-border)] bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center"
                style={{ width: '512px', height: '512px' }}
              >
                <div className="text-center text-green-100 opacity-50">
                  <div className="text-sm font-medium">Crop Field Analysis</div>
                  <div className="text-xs mt-1">Image: {result.imageUrl}</div>
                </div>
              </div>
              <svg 
                className="absolute top-0 left-0" 
                width="512" 
                height="512"
                style={{ pointerEvents: 'none' }}
              >
                {result.detections.map((detection, index) => {
                  const [x1, y1, x2, y2] = detection.bbox;
                  const width = x2 - x1;
                  const height = y2 - y1;
                  const color = classColors[detection.class] || "#94a3b8";
                  
                  return (
                    <g key={index}>
                      <rect
                        x={x1}
                        y={y1}
                        width={width}
                        height={height}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        opacity="0.8"
                      />
                      <rect
                        x={x1}
                        y={y1 - 20}
                        width={Math.max(width, 80)}
                        height="20"
                        fill={color}
                        opacity="0.8"
                      />
                      <text
                        x={x1 + 4}
                        y={y1 - 6}
                        fontSize="12"
                        fill="white"
                        fontWeight="bold"
                      >
                        {detection.class.replace('_', ' ')} {Math.round(detection.confidence * 100)}%
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Charts and Detection List */}
          <div className="space-y-6">
            {/* Pie Chart */}
            <div className="bg-[var(--cs-surface)] border border-[var(--cs-border)] rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Detection Breakdown</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-[var(--cs-muted)] text-center py-8">No detections found</p>
              )}
            </div>

            {/* Detection List */}
            <div className="bg-[var(--cs-surface)] border border-[var(--cs-border)] rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Detections ({result.detections.length})</h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {result.detections.map((detection, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[var(--cs-background)] rounded border border-[var(--cs-border)]">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: classColors[detection.class] || "#94a3b8" }}
                      ></div>
                      <span className="font-medium">{detection.class.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{Math.round(detection.confidence * 100)}%</div>
                      <div className="text-sm text-[var(--cs-muted)]">
                        [{detection.bbox[0].toFixed(0)}, {detection.bbox[1].toFixed(0)}, {detection.bbox[2].toFixed(0)}, {detection.bbox[3].toFixed(0)}]
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}