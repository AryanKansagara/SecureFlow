import { useMemo } from "react";

interface RiskGaugeProps {
  lastScore: number | null;
  threshold?: number;
}

export default function RiskGauge({
  lastScore,
  threshold = 35,
}: RiskGaugeProps) {
  const score = lastScore ?? 0;
  const pct = Math.min(100, Math.max(0, score));
  const color = score >= threshold ? "rgb(239, 68, 68)" : score >= 50 ? "rgb(245, 158, 11)" : "rgb(34, 197, 94)";

  const segments = useMemo(() => {
    const n = 20;
    return Array.from({ length: n }, (_, i) => {
      const start = (i / n) * 100;
      const end = ((i + 1) / n) * 100;
      const active = pct >= start;
      return { start, end, active };
    });
  }, [pct]);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">
        Risk score
      </h3>
      <div className="mt-2 flex items-center gap-4">
        <div className="flex h-8 flex-1 gap-0.5 overflow-hidden rounded-full bg-slate-800">
          {segments.map((seg, i) => (
            <div
              key={i}
              className="flex-1 transition-colors"
              style={{
                backgroundColor: seg.active ? color : "rgb(30, 41, 59)",
              }}
            />
          ))}
        </div>
        <span className="w-12 text-right font-mono text-lg font-semibold tabular-nums">
          {lastScore != null ? lastScore.toFixed(0) : "—"}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Threshold: {threshold} — {score >= threshold ? "Flagged" : "OK"}
      </p>
    </div>
  );
}
