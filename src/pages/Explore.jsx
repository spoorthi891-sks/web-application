import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchTrendingModels } from "../utils/hfHub.js";
import { recommendModels, unitPrice } from "../utils/matchmakerAlgo.js";
import ModelCard from "../components/ModelCard.jsx";
import FilterSidebar from "../components/FilterSidebar.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";

const SORT_OPTIONS = [
  { id: "trending", label: "Trending" },
  { id: "downloads", label: "Most downloaded" },
  { id: "likes", label: "Most liked" },
  { id: "price", label: "Price · low to high" },
];

function readListParam(searchParams, key) {
  return (searchParams.get(key) ?? "").split(",").filter(Boolean);
}

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [models, setModels] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  // Single source of truth: the URL. Every filter is a shareable param.
  const query = searchParams.get("q") ?? "";
  const sortBy = searchParams.get("sort") ?? "trending";
  const selectedCategories = useMemo(
    () => readListParam(searchParams, "cat"),
    [searchParams],
  );
  const selectedProviders = useMemo(
    () => readListParam(searchParams, "prov"),
    [searchParams],
  );
  const selectedPrivacy = useMemo(
    () => readListParam(searchParams, "privacy"),
    [searchParams],
  );
  const parsedMax = searchParams.has("max")
    ? Number(searchParams.get("max"))
    : Infinity;
  const maxPrice = Number.isFinite(parsedMax) ? parsedMax : Infinity;

  function updateParam(key, value) {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (value == null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
        return params;
      },
      { replace: true },
    );
  }

  function toggleListParam(key) {
    return (value) => {
      const current = readListParam(searchParams, key);
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      updateParam(key, next.join(","));
    };
  }

  function load() {
    setStatus("loading");
    setError(null);
    fetchTrendingModels()
      .then((data) => {
        setModels(data);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err.message ?? "Something went wrong");
        setStatus("error");
      });
  }

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(
    () => [...new Set(models.map((model) => model.category))],
    [models],
  );
  const providers = useMemo(
    () => [...new Set(models.map((model) => model.provider))].sort(),
    [models],
  );
  const privacyStandards = useMemo(
    () => [
      ...new Set(
        models.flatMap((model) =>
          model.privacyRating.split("·").map((part) => part.trim()),
        ),
      ),
    ],
    [models],
  );
  const priceCeiling = useMemo(
    () => Math.max(...models.map(unitPrice), 0),
    [models],
  );

  const activeFilterCount =
    selectedCategories.length +
    selectedProviders.length +
    selectedPrivacy.length +
    (maxPrice < priceCeiling ? 1 : 0);

  function clearFilters() {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        params.delete("cat");
        params.delete("prov");
        params.delete("privacy");
        params.delete("max");
        return params;
      },
      { replace: true },
    );
  }

  function handleMaxPriceChange(value) {
    if (value >= priceCeiling) {
      updateParam("max", "");
    } else {
      updateParam("max", String(Math.round(value * 1e6) / 1e6));
    }
  }

  const results = useMemo(() => {
    const candidates = models.filter(
      (model) =>
        (selectedCategories.length === 0 ||
          selectedCategories.includes(model.category)) &&
        (selectedProviders.length === 0 ||
          selectedProviders.includes(model.provider)) &&
        (selectedPrivacy.length === 0 ||
          selectedPrivacy.every((standard) =>
            model.privacyRating.includes(standard),
          )) &&
        unitPrice(model) <= maxPrice,
    );

    const trimmed = query.trim();
    if (trimmed) {
      return recommendModels(trimmed, candidates, { limit: 12 });
    }
    if (sortBy === "downloads") {
      return [...candidates].sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0));
    }
    if (sortBy === "likes") {
      return [...candidates].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
    }
    if (sortBy === "price") {
      return [...candidates].sort((a, b) => unitPrice(a) - unitPrice(b));
    }
    return candidates;
  }, [
    models,
    query,
    sortBy,
    selectedCategories,
    selectedProviders,
    selectedPrivacy,
    maxPrice,
  ]);

  return (
    <div className="relative min-h-screen bg-[#080C0E]">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      <div className="pointer-events-none absolute top-10 right-1/4 h-[350px] w-[500px] rounded-full bg-[#00FF9D]/[0.04] blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-semibold tracking-widest text-[#00FF9D] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00FF9D]" />
              FOUNDATION MODEL CATALOG
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Explore the <span className="text-[#00FF9D]">marketplace</span>
            </h1>
            <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">
              Live foundation models and open weights benchmarked for enterprise production.
            </p>
          </div>
          <div className="w-full md:max-w-md">
            <div className="flex items-center gap-2">
              <Link
                to="/compare"
                className="hidden shrink-0 items-center gap-1 rounded-full border border-[#00FF9D]/40 bg-[#00FF9D]/[0.06] px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[#00FF9D] transition-all hover:bg-[#00FF9D]/15 hover:shadow-[0_0_20px_-4px_rgba(0,255,157,0.4)] sm:inline-flex"
              >
                Compare costs
                <span>→</span>
              </Link>
              <div className="flex min-w-0 flex-1 items-center rounded-full border border-white/[0.1] bg-[#0E141B]/90 px-4 py-2 shadow-inner focus-within:border-[#00FF9D]/50 focus-within:shadow-[0_0_24px_-4px_rgba(0,255,157,0.25)] transition-all">
                <span className="text-slate-500 mr-2.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => updateParam("q", event.target.value)}
                  placeholder="Search by task, provider, or keyword..."
                  aria-label="Search models"
                  className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {status === "loading" && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }, (_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="mt-8 rounded-2xl border border-dashed border-rose-500/30 bg-[#0E141B]/50 p-16 text-center">
            <p className="text-sm font-semibold text-rose-300">
              Couldn&apos;t load models from the Hugging Face Hub
            </p>
            <p className="mt-1 text-xs text-slate-500">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-6 rounded-full bg-[#00FF9D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#080C0E] shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all hover:bg-[#10B981]"
            >
              Try again
            </button>
          </div>
        )}

        {status === "ready" && (
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[270px_1fr]">
            <div className="space-y-8 lg:contents">
              {categories.length > 1 && (
                <div className="lg:col-span-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                      Category:
                    </span>
                    <button
                      type="button"
                      onClick={() => updateParam("cat", "")}
                      aria-pressed={selectedCategories.length === 0}
                      className={`rounded-full border px-3.5 py-1 font-mono text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                        selectedCategories.length === 0
                          ? "border-[#00FF9D]/60 bg-[#00FF9D]/10 text-[#00FF9D] shadow-[0_0_12px_rgba(0,255,157,0.15)]"
                          : "border-white/[0.08] bg-[#0E141B]/70 text-slate-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      All
                    </button>
                    {categories.map((category) => {
                      const active = selectedCategories.includes(category);
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleListParam("cat")(category)}
                          aria-pressed={active}
                          className={`rounded-full border px-3.5 py-1 font-mono text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                            active
                              ? "border-[#00FF9D]/60 bg-[#00FF9D]/10 text-[#00FF9D] shadow-[0_0_12px_rgba(0,255,157,0.15)]"
                              : "border-white/[0.08] bg-[#0E141B]/70 text-slate-400 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <FilterSidebar
                categories={categories}
                providers={providers}
                privacyStandards={privacyStandards}
                selectedCategories={selectedCategories}
                selectedProviders={selectedProviders}
                selectedPrivacy={selectedPrivacy}
                onToggleCategory={toggleListParam("cat")}
                onToggleProvider={toggleListParam("prov")}
                onTogglePrivacy={toggleListParam("privacy")}
                maxPrice={maxPrice}
                priceCeiling={priceCeiling}
                onMaxPriceChange={handleMaxPriceChange}
              />

              <section>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-xs text-slate-400">
                    SHOWING <span className="font-bold text-white">{results.length}</span> MODEL{results.length === 1 ? "" : "S"}
                  </p>
                  <div className="flex items-center gap-4">
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="font-mono text-xs font-semibold text-[#00FF9D] transition-colors hover:text-emerald-300 cursor-pointer"
                      >
                        RESET FILTERS ({activeFilterCount})
                      </button>
                    )}
                    <label
                      htmlFor="explore-sort"
                      className="font-mono text-[10px] uppercase tracking-wider text-slate-500"
                    >
                      Sort
                    </label>
                    <select
                      id="explore-sort"
                      value={sortBy}
                      onChange={(event) => updateParam("sort", event.target.value === "trending" ? "" : event.target.value)}
                      className="rounded-full border border-white/[0.1] bg-[#0E141B]/90 px-3 py-1.5 font-mono text-xs text-slate-200 outline-none transition focus:border-[#00FF9D]/50 cursor-pointer"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {results.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-[#0E141B]/40 p-16 text-center">
                    <p className="text-sm font-semibold text-slate-300">
                      No models match your current filters
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try broadening your filters or clearing search terms.
                    </p>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-4 rounded-full border border-white/10 bg-[#131B24] px-4 py-2 text-xs font-mono text-slate-300 hover:text-white cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {results.map((model) => (
                      <ModelCard key={model.id} model={model} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

