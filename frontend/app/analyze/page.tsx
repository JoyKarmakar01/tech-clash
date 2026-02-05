"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Result = {
  label: "LIKELY_FAKE" | "LIKELY_REAL";
  probability_fake: number;
  model_label: string;
  notes: string[];
  suggestions?: string[]; // optional: backend may or may not send it
};

type HistoryItem = {
  id: string;
  text: string;
  result: Result;
  createdAt: string;
};

const STORAGE_KEY = "fake-news-history";
const MAX_HISTORY = 20;

function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-extrabold">
          🛡️ FakeNewsAI
        </Link>
        <div className="flex items-center gap-6 text-sm text-slate-600">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          <Link
            href="/analyze"
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-sky-600 px-4 py-2 font-semibold text-white"
          >
            Analyze
          </Link>
        </div>
      </div>
    </nav>
  );
}

function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function safeParseHistory(raw: string | null): HistoryItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // soft-validate
    return parsed
      .filter((x) => x && typeof x === "object" && typeof x.id === "string")
      .slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

function multiLineClampStyle(lines: number) {
  return {
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  };
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const tone =
    clamped >= 75 ? "from-rose-600 to-orange-500" :
    clamped >= 45 ? "from-amber-500 to-orange-500" :
    "from-emerald-600 to-teal-500";

  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${tone}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export default function AnalyzePage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const didInit = useRef(false);

  // Load history once (guard against dev double-invoke)
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const initial = safeParseHistory(localStorage.getItem(STORAGE_KEY));
    setHistory(initial);
  }, []);

  function persistHistory(next: HistoryItem[]) {
    setHistory(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function addHistory(item: HistoryItem) {
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function deleteHistory(id: string) {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function clearHistory() {
    persistHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  function resetAnalysis() {
    setText("");
    setResult(null);
    setError(null);
  }

  async function pasteFromClipboard() {
    try {
      // Works only on HTTPS / localhost
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText || clipboardText.trim().length === 0) {
        setError("Clipboard is empty.");
        return;
      }
      setText(clipboardText);
      setResult(null);
      setError(null);
    } catch {
      setError("Clipboard access denied. Please allow permission (or use Ctrl+V).");
    }
  }

  async function copyResultToClipboard() {
    if (!result) return;
    const pct = Math.round(clamp01(result.probability_fake) * 100);
    const payload = [
      `Verdict: ${result.label}`,
      `Fake Probability: ${pct}%`,
      `Model: ${result.model_label}`,
      result.notes?.length ? `Notes:\n- ${result.notes.join("\n- ")}` : `Notes: (none)`,
      (result.suggestions?.length ? result.suggestions : null)
        ? `Suggestions:\n- ${(result.suggestions ?? []).join("\n- ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(payload);
      setError(null);
    } catch {
      setError("Copy failed. Please copy manually.");
    }
  }

  async function onAnalyze() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!r.ok) throw new Error(await r.text());

      const raw = await r.json();

      // Normalize shape defensively
      const normalized: Result = {
        label: raw.label,
        probability_fake: clamp01(Number(raw.probability_fake ?? 0)),
        model_label: String(raw.model_label ?? "unknown"),
        notes: Array.isArray(raw.notes) ? raw.notes : [],
        suggestions: Array.isArray(raw.suggestions) ? raw.suggestions : [],
      };

      setResult(normalized);

      addHistory({
        id: (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        text,
        result: normalized,
        createdAt: new Date().toISOString(),
      });
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const fakePct = useMemo(() => {
    if (!result) return 0;
    return Math.round(clamp01(result.probability_fake) * 100);
  }, [result]);

  const fallbackSuggestions = useMemo(() => {
    if (!result) return [];
    const p = clamp01(result.probability_fake);
    // practical, non-LLM fallback guidance
    if (result.label === "LIKELY_FAKE" || p >= 0.6) {
      return [
        "Verify the claim with at least 2 trusted news outlets",
        "Search for official statements (government/agency/company)",
        "Check date, location, and source credibility",
        "Be cautious with emotional/urgent headlines—avoid sharing immediately",
      ];
    }
    return [
      "Still cross-check with reliable sources before sharing",
      "Read the full content (not just the headline) for context",
      "Look for primary sources, citations, and author identity",
    ];
  }, [result]);

  const suggestionsToShow = useMemo(() => {
    if (!result) return [];
    const s = Array.isArray(result.suggestions) ? result.suggestions : [];
    return s.length ? s : fallbackSuggestions;
  }, [result, fallbackSuggestions]);

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Nav />

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[2fr_1fr]">
        {/* LEFT */}
        <div>
          <h1 className="text-4xl font-extrabold">Analyze News Text</h1>
          <p className="mt-2 text-slate-600">
            AI-based misinformation risk analysis (MVP). Use as decision support.
          </p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <textarea
              className="min-h-[180px] w-full rounded-xl border border-slate-300 p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Paste article or post text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={onAnalyze}
                disabled={loading || text.trim().length < 20}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 px-6 py-3 font-semibold text-white disabled:opacity-40"
              >
                {loading ? "Analyzing..." : "Run Detection"}
              </button>

              <button
                onClick={pasteFromClipboard}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                📋 Paste
              </button>

              <button
                onClick={resetAnalysis}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reset
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Tip: Clipboard paste works on HTTPS/localhost. Otherwise use Ctrl+V.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {/* RESULT */}
          {result && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-indigo-100 px-4 py-1 text-sm font-semibold text-indigo-700">
                  {result.label}
                </span>

                <span className="rounded-full border border-slate-200 px-4 py-1 text-sm">
                  Fake Probability: <b>{fakePct}%</b>
                </span>

                <span className="rounded-full border border-slate-200 px-4 py-1 text-sm">
                  Model: <b>{result.model_label}</b>
                </span>

                <button
                  onClick={copyResultToClipboard}
                  className="ml-auto rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  📄 Copy Result
                </button>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-600">Risk bar</div>
                <ProgressBar pct={fakePct} />
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {/* Notes */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="font-semibold">Analysis Notes</h2>
                  {Array.isArray(result.notes) && result.notes.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {result.notes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">
                      No detailed notes provided by the model.
                    </p>
                  )}
                </div>

                {/* Suggestions */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="font-semibold">Suggestions</h2>
                  {suggestionsToShow.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {suggestionsToShow.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">
                      No suggestions available.
                    </p>
                  )}
                  <p className="mt-3 text-xs text-slate-500">
                Suggestions are generated for safer verification.
                </p>

                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: HISTORY */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">History</h2>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No previous analyses yet.</p>
          ) : (
            <ul className="mt-4 max-h-[520px] space-y-3 overflow-auto pr-2">
              {history.map((h) => {
                const pct = Math.round(clamp01(h.result?.probability_fake ?? 0) * 100);
                return (
                  <li key={h.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                    <div className="flex justify-between gap-2">
                      <button
                        onClick={() => {
                          setText(h.text);
                          setResult(h.result);
                          setError(null);
                        }}
                        className="text-left"
                        title="Load this analysis"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{h.result?.label ?? "UNKNOWN"}</span>
                          <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-600">
                            {pct}%
                          </span>
                        </div>

                        <p className="mt-1 text-slate-600" style={multiLineClampStyle(2)}>
                          {h.text}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(h.createdAt).toLocaleString()}
                        </p>
                      </button>

                      <button
                        onClick={() => deleteHistory(h.id)}
                        className="text-xs font-semibold text-red-500 hover:underline"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </main>
  );
}
