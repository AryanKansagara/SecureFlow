import type { TransactionResult } from "../types";

interface FlaggedSidePanelProps {
  result: TransactionResult | null;
  onClose: () => void;
}

export default function FlaggedSidePanel({ result, onClose }: FlaggedSidePanelProps) {
  if (!result) return null;

  const { response, payload } = result;
  const { explanation, recommendation, signals, score, transaction_id } = response;

  return (
    <div className="flex h-full flex-col border-l border-slate-700 bg-slate-900/95">
      <div className="flex items-center justify-between border-b border-slate-700 p-4">
        <h2 className="font-semibold text-slate-100">Flagged transaction</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Transaction ID</p>
          <p className="mt-0.5 font-mono text-sm text-slate-300">{transaction_id}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Amount & merchant</p>
          <p className="mt-0.5 font-mono text-slate-200">
            {payload.currency} {payload.amount.toFixed(2)} — {payload.merchant_id} ({payload.merchant_category})
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Risk score</p>
          <p className="mt-0.5 text-lg font-semibold text-red-400">{score}</p>
        </div>
        {recommendation && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Recommendation</p>
            <p className="mt-0.5 rounded bg-red-500/20 px-2 py-1 font-medium text-red-300">{recommendation}</p>
          </div>
        )}
        {explanation && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Explanation</p>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-300">{explanation}</p>
          </div>
        )}
        {signals && signals.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Signals</p>
            <ul className="mt-1 space-y-1">
              {signals.map((s) => (
                <li
                  key={s.name}
                  className="flex items-start justify-between gap-2 rounded border border-slate-700 bg-slate-800/50 px-2 py-1.5 text-sm"
                >
                  <span className="text-slate-300">{s.description}</span>
                  {s.contribution > 0 && (
                    <span className="shrink-0 font-mono text-amber-400">+{s.contribution.toFixed(0)}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
