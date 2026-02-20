"use client";

import { useCallback, useEffect, useState } from "react";
import type { Field } from "@/lib/types";

export default function UploadPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState("");
  const [droneModel, setDroneModel] = useState("DJI Mavic 3 Multispectral");
  const [altitude, setAltitude] = useState("120");
  const [notes, setNotes] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    fetch("/api/fields")
      .then((r) => r.json())
      .then((data) => {
        setFields(data);
        if (data.length > 0) setSelectedField(data[0].id);
      });
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-zinc-800 bg-[#111111] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Flight Upload
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">
          Upload Drone Imagery
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Drop aerial photos to generate vegetation index maps and health
          analysis.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Drop Zone */}
        <section
          className={`flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
            dragOver
              ? "border-[#22C55E] bg-[#22C55E]/5"
              : "border-zinc-700 bg-[#111111] hover:border-zinc-600"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFileSelect}
          />
          <svg className="mb-4 h-12 w-12 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm font-medium text-zinc-300">
            Drop drone images here
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            JPEG, TIFF, GeoTIFF — RGB or multispectral
          </p>
          {files.length > 0 && (
            <div className="mt-4 rounded-lg border border-zinc-800 bg-[#0a0a0a] px-4 py-2">
              <p className="text-sm text-[#22C55E]">
                {files.length} image{files.length !== 1 ? "s" : ""} selected
              </p>
            </div>
          )}
        </section>

        {/* Flight Metadata */}
        <section className="space-y-4 rounded-xl border border-zinc-800 bg-[#111111] p-6">
          <h2 className="text-lg font-semibold text-zinc-100">
            Flight Details
          </h2>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Field</label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
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
            <label className="mb-1 block text-xs text-zinc-400">
              Drone Model
            </label>
            <input
              value={droneModel}
              onChange={(e) => setDroneModel(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-[#0a0a0a] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#22C55E]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">
              Altitude (ft)
            </label>
            <input
              type="number"
              value={altitude}
              onChange={(e) => setAltitude(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-[#0a0a0a] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#22C55E]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-800 bg-[#0a0a0a] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#22C55E]"
              placeholder="Weather conditions, observations..."
            />
          </div>

          <button
            disabled={files.length === 0}
            className="w-full rounded-lg bg-[#22C55E] px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-[#16A34A] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Process {files.length} Image{files.length !== 1 ? "s" : ""}
          </button>
        </section>
      </div>

      {/* Uploaded Files Preview */}
      {files.length > 0 && (
        <section className="rounded-xl border border-zinc-800 bg-[#111111] p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-100">
            Selected Images
          </h2>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 hidden rounded bg-black/70 p-1 text-xs text-zinc-300 group-hover:block"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
