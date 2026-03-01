import { useEffect, useRef, useState } from "react";

/** Animated counter for stats – eases from current to target. */
function useAnimatedCounter(target, enabled = true) {
  const [display, setDisplay] = useState(typeof target === "number" ? target : 0);
  const prevTarget = useRef(target);
  useEffect(() => {
    if (typeof target !== "number" || !enabled) return;
    if (prevTarget.current === target) return;
    const start = display;
    const end = target;
    prevTarget.current = target;
    const duration = 600;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplay(Math.round(start + (end - start) * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, enabled]);
  return display;
}

/** Mini sparkline – single line that draws in for forecast feel. */
function Sparkline({ className = "", points = [30, 45, 40, 60, 55, 80, 70] }) {
  const pathD = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 100 - (p / 100) * 80;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      fill="none"
    >
      <defs>
        <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path
        d={pathD}
        stroke="url(#sparkGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="120"
        strokeDashoffset="120"
        className="animate-spark-draw"
      />
    </svg>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [impact, setImpact] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [activeHub, setActiveHub] = useState("list");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("Good");
  const [location, setLocation] = useState("Azad Hall");
  const [categoryManuallyEdited, setCategoryManuallyEdited] = useState(false);
  const [claimSuccessId, setClaimSuccessId] = useState(null);

  const animItemsClaimed = useAnimatedCounter(impact?.total_items_claimed ?? 0, !!impact);
  const animCo2Saved = useAnimatedCounter(impact?.total_co2_saved ?? 0, !!impact);
  const animWasteReduced = useAnimatedCounter(impact?.total_waste_reduced ?? 0, !!impact);

  // ✅ Fetch items function
  const fetchItems = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/items");
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  const handleClaim = async (id) => {
    try {
      await fetch(`http://127.0.0.1:8000/items/${id}/claim`, {
        method: "PATCH",
      });
      setClaimSuccessId(id);
      setTimeout(() => setClaimSuccessId(null), 1200);
      fetchItems();
      fetchImpact();
      fetchLeaderboard();
    } catch (err) {
      console.error("Error claiming item:", err);
    }
  };

  const fetchImpact = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/impact");
      const data = await res.json();
      setImpact(data);
    } catch (err) {
      console.error("Error fetching impact:", err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/leaderboard");
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  };

  // ✅ Load items on page load
  useEffect(() => {
    fetchItems();
    fetchImpact();
    fetchLeaderboard();
  }, []);

  // ✅ Auto-suggest category based on item name
  useEffect(() => {
    if (!name || categoryManuallyEdited) return;

    const lowerName = name.toLowerCase();
    let suggestedCategory = "";

    if (
      lowerName.includes("laptop") ||
      lowerName.includes("phone") ||
      lowerName.includes("charger")
    ) {
      suggestedCategory = "Electronics";
    } else if (
      lowerName.includes("chair") ||
      lowerName.includes("table") ||
      lowerName.includes("bed")
    ) {
      suggestedCategory = "Furniture";
    } else if (
      lowerName.includes("book") ||
      lowerName.includes("notebook")
    ) {
      suggestedCategory = "Books";
    }

    if (suggestedCategory && suggestedCategory !== category) {
      setCategory(suggestedCategory);
    }
  }, [name, category, categoryManuallyEdited]);

  const handleAddItem = async (e) => {
    e.preventDefault();

    try {
      await fetch("http://127.0.0.1:8000/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          category,
          condition,
          location,
        }),
      });

      setName("");
      setCategory("");
      setCondition("Good");
      setLocation("Azad Hall");
      setCategoryManuallyEdited(false);

      fetchItems();
      fetchImpact();
    } catch (err) {
      console.error("Error adding item:", err);
    }
  };

  // ✅ Delete function
  const handleDelete = async (id) => {
    try {
      await fetch(`http://127.0.0.1:8000/items/${id}`, {
        method: "DELETE",
      });
      fetchItems(); // refresh items after delete
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const totalItems = items.length;
  const claimedItems = items.filter((i) => i.status === "claimed").length;
  const availableItems = items.filter((i) => i.status === "available").length;
  const topMatches = items.slice(0, 3);

  return (
    <div className="min-h-screen bg-[var(--eco-surface)]">
      {/* Layered depth: soft gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-teal-200/25 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-emerald-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-28 pt-5 sm:px-6 lg:px-8">
        {/* TOP NAV / BRAND */}
        <header className="mb-5 flex items-center justify-between animate-fade-in opacity-0 [animation-fill-mode:forwards]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.12)] ring-1 ring-emerald-100 backdrop-blur-sm">
              <span className="text-xl">🌱</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                EcoMatch
              </h1>
              <p className="text-xs text-slate-500 sm:text-sm">
                AI-powered circular campus reuse
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/80 shadow-[0_2px_12px_-4px_rgba(16,185,129,0.1)] backdrop-blur-sm">
              Climate-tech
            </span>
          </div>
        </header>

        {/* LIVE CAMPUS IMPACT PULSE */}
        <div className="mb-4 flex justify-center animate-fade-in opacity-0 [animation-delay:0.08s] [animation-fill-mode:forwards]">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.12)] ring-1 ring-emerald-100/80 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-pulse-dot" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-slate-600">
              Live campus impact
            </span>
            <span className="text-[0.65rem] text-slate-400">
              Sustainability engine running
            </span>
          </div>
        </div>

        {/* HERO / OVERVIEW – elevation 1 */}
        <section className="mb-6 animate-fade-in opacity-0 [animation-delay:0.12s] [animation-fill-mode:forwards]">
          <div className="overflow-hidden rounded-[1.5rem] bg-white/70 p-[1px] shadow-[0_20px_50px_-16px_rgba(16,185,129,0.14)] ring-1 ring-slate-200/60 backdrop-blur-md">
            <div className="relative flex flex-col gap-6 rounded-[1.4rem] bg-gradient-to-br from-white/95 to-emerald-50/30 px-5 py-6 sm:flex-row sm:px-8 sm:py-8">
              <div className="flex-1">
                <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-emerald-600/90">
                  EcoMatch OS
                </p>
                <h2 className="mb-3 text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
                  Turn forgotten items into measurable climate impact.
                </h2>
                <p className="mb-4 text-sm font-normal text-slate-600 sm:text-base">
                  List smarter, match faster, and watch your hostel&apos;s
                  sustainability score climb — calm, intelligent, and always on.
                </p>
                <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 ring-1 ring-emerald-200/60 shadow-[0_2px_12px_-4px_rgba(16,185,129,0.1)]">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="font-medium text-slate-700">Listing</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 ring-1 ring-emerald-200/60 shadow-[0_2px_12px_-4px_rgba(16,185,129,0.1)]">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    <span className="font-medium text-slate-700">Intelligence</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 ring-1 ring-emerald-200/60 shadow-[0_2px_12px_-4px_rgba(16,185,129,0.1)]">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="font-medium text-slate-700">Impact</span>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col justify-between gap-4 rounded-2xl bg-white/80 p-4 ring-1 ring-emerald-100/80 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.1)] sm:w-56 backdrop-blur-sm">
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">
                    Today&apos;s snapshot
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-600/80">
                        Active items
                      </p>
                      <p className="text-3xl font-bold text-slate-800 tabular-nums">
                        {availableItems}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[0.65rem] text-slate-400">Total listed</span>
                      <span className="text-base font-semibold text-slate-700 tabular-nums">
                        {totalItems}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50/90 px-3 py-2.5 ring-1 ring-emerald-200/50">
                  <div>
                    <p className="font-medium text-slate-700">
                      {claimedItems} items reused
                    </p>
                    <p className="text-[0.65rem] text-slate-500">
                      Every claim boosts the campus score.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[0.65rem] font-semibold text-emerald-700">
                    Live
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN HUBS – tab content with fade */}
        <main className="flex-1 space-y-6 pb-4">
          {activeHub === "list" && (
            <section key="list" className="space-y-5 animate-fade-in opacity-0 [animation-fill-mode:forwards]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">
                  Smart Listing Hub
                </h3>
                <p className="mt-0.5 text-sm font-normal text-slate-500">
                  AI-guided listing with clarity and confidence.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-[1.1fr_1.1fr]">
                <div className="rounded-[1.5rem] bg-white/80 p-[1px] shadow-[0_8px_30px_-8px_rgba(16,185,129,0.1)] ring-1 ring-emerald-100/80 backdrop-blur-sm">
                  <div className="rounded-[1.35rem] bg-white/95 px-5 py-5 sm:px-6 sm:py-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-emerald-600/90">
                          AI listing assistant
                        </p>
                        <p className="mt-1 text-sm font-normal text-slate-600">
                          Describe your item — we suggest the best category.
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[0.7rem] font-medium text-emerald-700 ring-1 ring-emerald-200/60">
                        Smart fill on
                      </span>
                    </div>

                    <form onSubmit={handleAddItem} className="space-y-4">
                      <div>
                        <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wider text-slate-600">
                          Item name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. MacBook charger, wooden study chair"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 focus:outline-none"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[0.65rem] text-emerald-600/80">
                            AI listening…
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wider text-slate-600">
                            Category
                          </label>
                          <input
                            type="text"
                            value={category}
                            onChange={(e) => {
                              setCategory(e.target.value);
                              setCategoryManuallyEdited(true);
                            }}
                            placeholder="Electronics, Furniture, Books…"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 focus:outline-none"
                          />
                          <p className="mt-1 text-[0.65rem] text-slate-500">
                            AI suggested from name — you can adjust.
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wider text-slate-600">
                              Condition
                            </label>
                            <input
                              type="text"
                              value={condition}
                              onChange={(e) => setCondition(e.target.value)}
                              placeholder="Good, Like New…"
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wider text-slate-600">
                              Hostel / Location
                            </label>
                            <input
                              type="text"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder="Azad Hall, Nehru Hall…"
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-medium text-emerald-700 ring-1 ring-emerald-200/50">
                            + Electronics
                          </span>
                          <span className="rounded-full bg-emerald-50/80 px-2.5 py-1 text-[0.65rem] font-medium text-emerald-700 ring-1 ring-emerald-200/40">
                            + Furniture
                          </span>
                          <span className="rounded-full bg-emerald-50/60 px-2.5 py-1 text-[0.65rem] font-medium text-emerald-700 ring-1 ring-emerald-200/30">
                            + Books
                          </span>
                        </div>
                        <button
                          type="submit"
                          className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-4px_rgba(16,185,129,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-4px_rgba(16,185,129,0.45)] active:translate-y-0"
                        >
                          Publish listing
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.08)] ring-1 ring-slate-200/60 backdrop-blur-sm">
                    <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
                      Listing preview
                    </p>
                    <div className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-emerald-100/60">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {name || "Your item name appears here"}
                            </p>
                            <p className="text-[0.7rem] text-slate-500">
                              {category || "Category"} · {condition || "Condition"}
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[0.65rem] font-medium text-emerald-700">
                            {location || "Hostel"}
                          </span>
                        </div>
                        <p className="text-[0.7rem] text-slate-500">
                          How it appears to others on the campus network.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] bg-white/80 p-4 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.08)] ring-1 ring-slate-200/60 backdrop-blur-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
                        Your live listings
                      </p>
                      <span className="text-[0.7rem] text-slate-500">
                        {availableItems} available · {claimedItems} claimed
                      </span>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-sm font-normal text-slate-500">
                        Publish an item to see it here with match scores.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50/90 p-3 ring-1 ring-slate-200/50"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {item.name}
                              </p>
                              <p className="text-[0.7rem] text-slate-500">
                                {item.category} · {item.condition} · {item.location}
                              </p>
                              <p className="mt-1 text-[0.7rem] font-medium text-emerald-600">
                                Match:{" "}
                                <span className="tabular-nums">
                                  {item.match_score?.toFixed?.(0) ?? item.match_score}
                                </span>
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${
                                  item.status === "available"
                                    ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/60"
                                    : "bg-teal-100 text-teal-800 ring-1 ring-teal-200/60"
                                }`}
                              >
                                {item.status === "available" ? "Available" : "Claimed"}
                              </span>
                              <div className="flex gap-1.5">
                                {item.status === "available" && (
                                  <button
                                    onClick={() => handleClaim(item.id)}
                                    className={`rounded-xl px-2.5 py-1 text-[0.7rem] font-semibold transition-all duration-200 ${
                                      claimSuccessId === item.id
                                        ? "bg-emerald-500 text-white ring-2 ring-emerald-300"
                                        : "bg-emerald-500 text-white hover:-translate-y-0.5 active:translate-y-0"
                                    }`}
                                  >
                                    {claimSuccessId === item.id ? "Claimed ✓" : "Claim"}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="rounded-xl bg-white px-2.5 py-1 text-[0.7rem] font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 transition-all duration-200"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeHub === "intelligence" && (
            <section key="intelligence" className="space-y-5 animate-fade-in opacity-0 [animation-fill-mode:forwards]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">
                  AI Intelligence Hub
                </h3>
                <p className="mt-0.5 text-sm font-normal text-slate-500">
                  Predictive view of how items move through the reuse ecosystem.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-[1.1fr_1.1fr]">
                <div className="space-y-4 rounded-[1.5rem] bg-white/80 p-5 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.1)] ring-1 ring-slate-200/60 backdrop-blur-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
                      Smart demand forecast
                    </p>
                  </div>

                  {/* Mini sparkline + grid overlay feel */}
                  <div className="relative h-20 overflow-hidden rounded-2xl bg-slate-50/80 p-3 ring-1 ring-emerald-100/60">
                    <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] [background-size:12px_12px]" />
                    <div className="relative h-full w-32">
                      <Sparkline points={[30, 45, 40, 60, 55, 75, 70]} />
                    </div>
                    <p className="absolute bottom-2 right-3 text-[0.65rem] font-medium text-slate-500">
                      Reuse trend
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-emerald-100/60 shadow-[0_2px_12px_-4px_rgba(16,185,129,0.08)]">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                        High-interest
                      </p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800">
                        {topMatches.length}
                      </p>
                      <p className="mt-1 text-[0.65rem] font-normal text-slate-500">
                        Match score &amp; proximity.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-emerald-100/60 shadow-[0_2px_12px_-4px_rgba(16,185,129,0.08)]">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                        Claim likelihood
                      </p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800">
                        {availableItems > 0
                          ? `${Math.min(95, 40 + availableItems * 8)}%`
                          : "—"}
                      </p>
                      <p className="mt-1 text-[0.65rem] font-normal text-slate-500">
                        This week projection.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-emerald-100/60 shadow-[0_2px_12px_-4px_rgba(16,185,129,0.08)]">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                        Impact rank
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-800">
                        {leaderboard?.length > 0 ? "#1–3" : "—"}
                      </p>
                      <p className="mt-1 text-[0.65rem] font-normal text-slate-500">
                        Hostel leaderboard.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
                        Smart matches
                      </p>
                      <span className="text-[0.65rem] text-slate-500">
                        By score &amp; proximity
                      </span>
                    </div>
                    {items.length === 0 ? (
                      <p className="rounded-2xl bg-slate-50/80 px-4 py-3 text-sm font-normal text-slate-500 ring-1 ring-slate-200/50">
                        List items to see AI-ranked matches here.
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {topMatches.map((item) => (
                          <div
                            key={item.id}
                            className="group rounded-2xl bg-white/90 p-4 ring-1 ring-slate-200/50 shadow-[0_4px_20px_-6px_rgba(16,185,129,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:ring-emerald-200/80 hover:shadow-[0_8px_28px_-6px_rgba(16,185,129,0.15)]"
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">
                                    {item.name}
                                  </p>
                                  <p className="text-[0.7rem] text-slate-500">
                                    {item.category} · {item.location}
                                  </p>
                                </div>
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.65rem] font-bold tabular-nums text-emerald-800 ring-1 ring-emerald-200/60">
                                  {item.match_score?.toFixed?.(0) ?? item.match_score}/100
                                </span>
                              </div>
                              <p className="text-[0.7rem] font-normal text-slate-500">
                                Strong match in {item.location}. Higher score = faster reuse.
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 rounded-[1.5rem] bg-white/80 p-5 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.08)] ring-1 ring-slate-200/60 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
                      Urgent reuse opportunities
                    </p>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[0.65rem] font-semibold text-amber-700 ring-1 ring-amber-200/60">
                      Beta
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-200/50">
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                        1
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Electronics move fastest from Azad Hall
                        </p>
                        <p className="mt-1 text-[0.7rem] font-normal text-slate-500">
                          Chargers, lamps, laptops — list these first for best reuse.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-200/50">
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                        2
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Evening listings get more engagement
                        </p>
                        <p className="mt-1 text-[0.7rem] font-normal text-slate-500">
                          Post between 7–10 PM for better visibility.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeHub === "impact" && (
            <section key="impact" className="space-y-5 animate-fade-in opacity-0 [animation-fill-mode:forwards]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">
                  Green Impact Hub
                </h3>
                <p className="mt-0.5 text-sm font-normal text-slate-500">
                  Your reuse habits, visible. The campus sustainability engine in real time.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-[1.1fr_1.1fr]">
                <div className="space-y-4 rounded-[1.5rem] bg-white/80 p-5 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.1)] ring-1 ring-slate-200/60 backdrop-blur-sm">
                  {impact === null ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-8">
                      <div className="h-12 w-12 animate-[spin_1s_linear_infinite] rounded-full border-2 border-emerald-200 border-t-emerald-500" />
                      <p className="text-sm font-normal text-slate-500">
                        Loading your impact…
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr]">
                        {/* Progress ring – CO₂ saved */}
                        <div className="relative flex items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-emerald-50/80 to-white p-6 ring-1 ring-emerald-100/80">
                          <div className="relative flex flex-col items-center justify-center gap-2">
                            <div className="relative h-36 w-36">
                              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="44"
                                  fill="none"
                                  stroke="rgb(209, 250, 229)"
                                  strokeWidth="8"
                                />
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="44"
                                  fill="none"
                                  stroke="rgb(16, 185, 129)"
                                  strokeWidth="8"
                                  strokeLinecap="round"
                                  strokeDasharray={277}
                                  strokeDashoffset={277 - Math.min((animCo2Saved / 60) * 277, 277)}
                                  className="transition-[stroke-dashoffset] duration-700 ease-out"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                                  CO₂ saved
                                </span>
                                <span className="text-2xl font-bold tabular-nums text-slate-800 animate-count-up">
                                  {animCo2Saved}
                                </span>
                                <span className="text-[0.65rem] text-slate-500">
                                  kg avoided
                                </span>
                              </div>
                            </div>
                            <p className="text-[0.7rem] font-normal text-slate-500 text-center">
                              Every reuse moves the campus toward zero waste.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-emerald-100/60 shadow-[0_2px_12px_-4px_rgba(16,185,129,0.08)]">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                              Items reused
                            </p>
                            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800 animate-count-up">
                              {animItemsClaimed}
                            </p>
                            <p className="mt-1 text-[0.65rem] font-normal text-slate-500">
                              Life extended, materials in circulation.
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-emerald-100/60 shadow-[0_2px_12px_-4px_rgba(16,185,129,0.08)]">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                              Waste prevented
                            </p>
                            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800 animate-count-up">
                              {animWasteReduced} kg
                            </p>
                            <p className="mt-1 text-[0.65rem] font-normal text-slate-500">
                              Landfill diverted by your community.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-emerald-50/90 p-3 ring-1 ring-emerald-200/60">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-700/90">
                            Eco score
                          </p>
                          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">
                            {Math.min(100, 40 + impact.total_items_claimed * 8)}
                          </p>
                          <p className="mt-1 text-[0.65rem] font-normal text-slate-600">
                            Your reuse index.
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-slate-200/60">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                            Green points
                          </p>
                          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800">
                            {impact.total_items_claimed * 25}
                          </p>
                          <p className="mt-1 text-[0.65rem] font-normal text-slate-500">
                            Credits toward a climate-positive campus.
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white/90 p-3 ring-1 ring-slate-200/60">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                            Campus tier
                          </p>
                          <p className="mt-1 text-xl font-bold text-slate-800">
                            {impact.total_items_claimed > 10
                              ? "Emerald"
                              : impact.total_items_claimed > 0
                              ? "Sage"
                              : "Seed"}
                          </p>
                          <p className="mt-1 text-[0.65rem] font-normal text-slate-500">
                            Collective impact tier.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4 rounded-[1.5rem] bg-white/80 p-5 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.08)] ring-1 ring-slate-200/60 backdrop-blur-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
                      🏆 Greenest hostels
                    </p>
                    <span className="text-[0.65rem] text-slate-500">
                      By CO₂ saved
                    </span>
                  </div>
                  {leaderboard === null ? (
                    <p className="text-sm font-normal text-slate-500">
                      Loading leaderboard…
                    </p>
                  ) : leaderboard.length === 0 ? (
                    <p className="text-sm font-normal text-slate-500">
                      Claim items across hostels to see collective impact here.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {leaderboard.map((entry, index) => {
                        const isTop = index === 0;
                        return (
                          <div
                            key={entry.hostel}
                            className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-3 ring-1 transition-all ${
                              isTop
                                ? "bg-emerald-50/90 ring-emerald-200/80 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.2)]"
                                : "bg-slate-50/80 ring-slate-200/60"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                                  isTop
                                    ? "bg-emerald-500 text-white"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                #{index + 1}
                              </div>
                              <div>
                                <p
                                  className={`font-semibold ${
                                    isTop ? "text-slate-800 text-base" : "text-slate-700 text-sm"
                                  }`}
                                >
                                  {entry.hostel}
                                </p>
                                <p className="text-[0.7rem] text-slate-500">
                                  {entry.items_reused} reused · {entry.co2_saved} kg CO₂
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>

        {/* FLOATING BOTTOM NAVIGATION */}
        <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center">
          <div className="pointer-events-auto inline-flex items-center gap-1 rounded-[1.25rem] bg-white/95 px-2 py-2 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.12)] ring-1 ring-slate-200/80 backdrop-blur-xl sm:gap-2">
            {[
              { id: "list", label: "Listing", emoji: "✨" },
              { id: "intelligence", label: "Intelligence", emoji: "🧠" },
              { id: "impact", label: "Impact", emoji: "🌍" },
            ].map((tab) => {
              const isActive = activeHub === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveHub(tab.id)}
                  className={`flex items-center gap-1.5 rounded-2xl px-3 py-2 text-[0.7rem] font-semibold transition-all duration-250 sm:px-4 sm:text-xs ${
                    isActive
                      ? "bg-emerald-500 text-white shadow-[0_8px_24px_-4px_rgba(16,185,129,0.45)] ring-2 ring-emerald-300/60 animate-glow-pulse"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}