import { useCallback, useEffect, useRef, useState } from "react";
import {
  generateSyntheticTransaction,
  maybeInjectFraud,
} from "../lib/synthetic";
import { evaluateTransaction } from "../api/client";
import type { TransactionResult } from "../types";
import TransactionStream from "./TransactionStream";
import LatencyMeter from "./LatencyMeter";
import RiskGauge from "./RiskGauge";
import FlaggedSidePanel from "./FlaggedSidePanel";

const MAX_RESULTS = 500;
const DEFAULT_INTERVAL_MS = 800;

function computeP95(latencies: number[]): number {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, idx)];
}

export default function Dashboard() {
  const [results, setResults] = useState<TransactionResult[]>([]);
  const [selectedFlagged, setSelectedFlagged] = useState<TransactionResult | null>(null);
  const [running, setRunning] = useState(false);
  const [intervalMs, setIntervalMs] = useState(DEFAULT_INTERVAL_MS);
  const latenciesRef = useRef<number[]>([]);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [p95Latency, setP95Latency] = useState<number | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runOne = useCallback(async () => {
    const fraud = maybeInjectFraud(demoMode);
    const payload = generateSyntheticTransaction(
      fraud ? { injectFraud: fraud } : undefined
    );
    const clientTimestamp = Date.now();
    try {
      const response = await evaluateTransaction(payload);
      const result: TransactionResult = {
        payload,
        response,
        clientTimestamp,
      };
      latenciesRef.current.push(response.latency_ms);
      if (latenciesRef.current.length > 100) {
        latenciesRef.current = latenciesRef.current.slice(-100);
      }
      setLastLatency(response.latency_ms);
      setP95Latency(computeP95(latenciesRef.current));
      setLastScore(response.score);
      setResults((prev) => {
        const next = [result, ...prev].slice(0, MAX_RESULTS);
        return next;
      });
    } catch {
      // skip on error; could add error state
    }
  }, [demoMode]);

  useEffect(() => {
    if (!running) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }
    intervalIdRef.current = setInterval(runOne, intervalMs);
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [running, intervalMs, runOne, demoMode]);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-700 bg-slate-900/90 px-6 py-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            SecureFlow
          </h1>
          <p className="text-sm text-slate-400">
            Real-time fraud detection at the point of transaction
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={demoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            <span>Demo mode</span>
            <span className="text-slate-500">(more flags)</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-400">
            Interval (ms)
            <input
              type="number"
              min={200}
              max={3000}
              step={100}
              value={intervalMs}
              onChange={(e) => setIntervalMs(Number(e.target.value))}
              className="w-20 rounded border border-slate-600 bg-slate-800 px-2 py-1 font-mono text-slate-200"
            />
          </label>
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              running
                ? "bg-red-600 text-white hover:bg-red-500"
                : "bg-emerald-600 text-white hover:bg-emerald-500"
            }`}
          >
            {running ? "Stop" : "Start"} stream
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 gap-4 p-4">
        <div className="flex flex-1 flex-col gap-4 min-w-0">
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <LatencyMeter
              lastLatencyMs={lastLatency}
              p95LatencyMs={p95Latency}
              targetMs={100}
            />
            <RiskGauge lastScore={lastScore} threshold={35} />
          </div>
          <div className="flex-1 min-h-0">
            <TransactionStream
              results={results}
              onSelectFlagged={setSelectedFlagged}
            />
          </div>
        </div>
        {selectedFlagged && (
          <div className="w-96 shrink-0">
            <FlaggedSidePanel
              result={selectedFlagged}
              onClose={() => setSelectedFlagged(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
