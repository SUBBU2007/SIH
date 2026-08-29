"use client";

import { useState } from "react";
import { Info } from "lucide-react";

export default function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-[var(--ink-dim)] hover:text-[var(--ink)]"
        aria-label="How this is calculated"
      >
        <Info size={14} />
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-10 w-64 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-3 text-xs text-[var(--ink-dim)] shadow-lg">
          {text}
        </div>
      )}
    </span>
  );
}