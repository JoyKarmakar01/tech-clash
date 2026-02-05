import Link from "next/link";

function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
          🛡️ FakeNewsAI
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600">
            Lite MVP
          </span>
        </Link>

        <div className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
          <a href="#why" className="hover:text-slate-900">Why</a>
          <a href="#usecases" className="hover:text-slate-900">Use cases</a>
          <a href="#how" className="hover:text-slate-900">How it works</a>
          <a href="#demo" className="hover:text-slate-900">Demo</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/analyze"
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm"
          >
            Analyze Now
          </Link>
        </div>
      </div>
    </nav>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-3xl font-extrabold text-indigo-600">{value}</div>
      <div className="mt-1 text-sm text-slate-600">{label}</div>
    </div>
  );
}

function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
    </div>
  );
}

function MiniBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-sky-600"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-indigo-400/25 blur-[130px]" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-sky-400/25 blur-[130px]" />

        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                ⚡ Fast • 🧠 AI signals • 🔒 Server-side key
              </div>

              <h1 className="mt-6 text-5xl font-extrabold leading-tight">
                Detect fake-news risk{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-sky-600 bg-clip-text text-transparent">
                  in seconds
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-lg text-slate-600">
                Paste any news text or social post. Get a risk score, label, and practical next steps.
                This is a decision-support tool—not absolute truth verification.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/analyze"
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 px-6 py-3 font-semibold text-white shadow-sm"
                >
                  Start Analyzing →
                </Link>

                <a
                  href="#how"
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 hover:bg-slate-50"
                >
                  How it works
                </a>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4">
                <StatCard value="~2s" label="Avg analysis time" />
                <StatCard value="20" label="History saved locally" />
                <StatCard value="0" label="Keys in browser" />
              </div>
            </div>

            {/* Right: glossy product mock */}
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-700">Sample Result</div>
                  <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    Model: logreg_v1
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-full bg-rose-50 px-4 py-1 text-sm font-semibold text-rose-700">
                    LIKELY_FAKE
                  </span>
                  <span className="rounded-full border border-slate-200 px-4 py-1 text-sm">
                    Fake Probability: <b>82%</b>
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-xs font-semibold text-slate-600">Risk bar</div>
                  <MiniBar pct={82} />
                </div>

                <div className="mt-5">
                  <div className="text-xs font-semibold text-slate-600">Why it flagged</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                    <li>Sensational wording + urgency cues</li>
                    <li>No credible source mentioned</li>
                    <li>High claim density, low evidence</li>
                  </ul>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                * UI mock for presentation. Real results depend on your backend response.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section id="why" className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-bold">Why this matters</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Fake news spreads fast, triggers panic, damages reputations, and harms public decisions.
          A lightweight risk-checker reduces accidental sharing and improves media literacy.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon="🧯"
            title="Reduce harm"
            desc="Catch high-risk claims before they spread across groups, communities, or channels."
          />
          <FeatureCard
            icon="💸"
            title="Avoid scams"
            desc="Many scams look like breaking news. This helps users slow down and verify."
          />
          <FeatureCard
            icon="🧭"
            title="Better decisions"
            desc="Support smarter choices in health, finance, civic events, and emergencies."
          />
        </div>
      </section>

      {/* USE CASES */}
      <section id="usecases" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold">Use cases</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              ["📰 Journalists", "Quick triage before publishing or sharing leads."],
              ["🎓 Students", "Learn verification habits; detect red flags."],
              ["🏢 Teams", "Internal comms: reduce rumor & misinformation."],
              ["👥 Public", "Check viral posts before forwarding to others."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="font-semibold">{t}</div>
                <div className="mt-2 text-sm text-slate-600">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-bold">How it works</h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            ["1", "Paste text", "Insert the article/post text into the analyzer."],
            ["2", "Model scoring", "Backend model scores misinformation risk signals."],
            ["3", "Explain & act", "Get notes + suggestions (model-driven or fallback)."],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xl font-extrabold text-indigo-600">{n}</div>
              <div className="mt-2 font-semibold">{t}</div>
              <div className="mt-2 text-sm text-slate-600">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DEMO CTA */}
      <section id="demo" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <h3 className="text-2xl font-bold">Ready to test a viral post?</h3>
                <p className="mt-3 text-slate-600">
                  Open the analyzer, paste a news snippet, and review the risk score with guidance.
                </p>
              </div>
              <div className="flex md:justify-end">
                <Link
                  href="/analyze"
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 px-7 py-3 font-semibold text-white shadow-sm"
                >
                  Go to Analyzer →
                </Link>
              </div>
            </div>

            <p className="mt-6 text-xs text-slate-500">
              Disclaimer: This MVP estimates risk signals. Always cross-check with reliable sources.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-10 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} FakeNewsAI — AI-assisted risk analysis.
      </footer>
    </main>
  );
}
