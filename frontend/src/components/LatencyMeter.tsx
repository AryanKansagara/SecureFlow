interface LatencyMeterProps {
  lastLatencyMs: number | null;
  p95LatencyMs: number | null;
  targetMs?: number;
}

export default function LatencyMeter({
  lastLatencyMs,
  p95LatencyMs,
  targetMs = 100,
}: LatencyMeterProps) {
  const lastOk = lastLatencyMs != null && lastLatencyMs <= targetMs;
  const p95Ok = p95LatencyMs != null && p95LatencyMs <= targetMs;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">
        Latency
      </h3>
      <div className="mt-2 flex items-baseline gap-4">
        <div>
          <span className="text-2xl font-mono font-semibold tabular-nums">
            {lastLatencyMs != null ? `${lastLatencyMs.toFixed(1)}` : "—"}
          </span>
          <span className="ml-1 text-sm text-slate-500">ms (last)</span>
        </div>
        <div className="h-6 w-px bg-slate-600" />
        <div>
          <span className="text-xl font-mono tabular-nums">
            {p95LatencyMs != null ? `${p95LatencyMs.toFixed(1)}` : "—"}
          </span>
          <span className="ml-1 text-sm text-slate-500">ms (P95)</span>
        </div>
        <span className="text-sm text-slate-500">target &lt;{targetMs}ms</span>
      </div>
      <div className="mt-2 flex gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
            lastOk ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${lastOk ? "bg-emerald-400" : "bg-amber-400"}`} />
          Last
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
            p95Ok ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${p95Ok ? "bg-emerald-400" : "bg-amber-400"}`} />
          P95
        </span>
      </div>
    </div>
  );
}
