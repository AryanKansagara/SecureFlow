import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import type { TransactionResult } from "../types";

interface TransactionStreamProps {
  results: TransactionResult[];
  onSelectFlagged: (result: TransactionResult) => void;
}

const ROW_HEIGHT = 48;

export default function TransactionStream({ results, onSelectFlagged }: TransactionStreamProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 flex flex-col h-full min-h-0">
      <div className="border-b border-slate-700 px-4 py-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Live stream — {results.length} transactions
        </h3>
      </div>
      <div ref={parentRef} className="flex-1 overflow-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const r = results[virtualRow.index];
            if (!r) return null;
            const { response, payload } = r;
            return (
              <div
                key={r.response.transaction_id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${ROW_HEIGHT}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={`flex items-center gap-4 border-b border-slate-800/80 px-4 text-sm ${
                  response.flagged ? "cursor-pointer bg-red-950/30 hover:bg-red-950/50" : ""
                }`}
                onClick={() => response.flagged && onSelectFlagged(r)}
              >
                <span className="w-8 shrink-0 font-mono text-xs text-slate-500">{virtualRow.index + 1}</span>
                <span className="w-20 shrink-0 font-mono tabular-nums text-slate-300">
                  {payload.currency} {payload.amount.toFixed(2)}
                </span>
                <span className="min-w-0 truncate text-slate-400">{payload.merchant_id}</span>
                <span className="shrink-0 rounded bg-slate-700 px-1.5 py-0.5 font-mono text-xs text-slate-300">
                  {response.score.toFixed(0)}
                </span>
                <span className="shrink-0 font-mono text-xs text-slate-500">{response.latency_ms.toFixed(0)} ms</span>
                {response.flagged ? (
                  <span className="shrink-0 rounded bg-red-500/30 px-2 py-0.5 text-xs font-medium text-red-300">
                    Flagged
                  </span>
                ) : (
                  <span className="shrink-0 text-slate-600">OK</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
