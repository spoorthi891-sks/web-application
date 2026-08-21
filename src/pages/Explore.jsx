import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchTrendingModels } from "../utils/hfHub.js";
import { recommendModels, unitPrice } from "../utils/matchmakerAlgo.js";
import ModelCard from "../components/ModelCard.jsx";
import FilterSidebar from "../components/FilterSidebar.jsx";
import SkeletonCard from "../components/SkeletonCard.jsx";

export default function Explore() {
  const [searchParams] = useSearchParams();
  const [models, setModels] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [selectedPrivacy, setSelectedPrivacy] = useState([]);
  const [maxPrice, setMaxPrice] = useState(Infinity);

  function load() {
    setStatus("loading");
    setError(null);
    fetchTrendingModels()
      .then((data) => {
        setModels(data);
        setMaxPrice(Math.max(...data.map(unitPrice), 0));
        setSelectedCategories([]);
        setSelectedProviders([]);
        setSelectedPrivacy([]);
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

  function toggle(setter) {
    return (value) =>
      setter((current) =>
        current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      );
  }

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
    setSelectedCategories([]);
    setSelectedProviders([]);
    setSelectedPrivacy([]);
    setMaxPrice(priceCeiling);
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
    return candidates;
  }, [models, query, selectedCategories, selectedProviders, selectedPrivacy, maxPrice]);

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
            <div className="flex items-center rounded-full border border-white/[0.1] bg-[#0E141B]/90 px-4 py-2 shadow-inner focus-within:border-[#00FF9D]/50 focus-within:shadow-[0_0_24px_-4px_rgba(0,255,157,0.25)] transition-all">
              <span className="text-slate-500 mr-2.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by task, provider, or keyword..."
                className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-500 outline-none"
              />
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
            <FilterSidebar
              categories={categories}
              providers={providers}
              privacyStandards={privacyStandards}
              selectedCategories={selectedCategories}
              selectedProviders={selectedProviders}
              selectedPrivacy={selectedPrivacy}
              onToggleCategory={toggle(setSelectedCategories)}
              onToggleProvider={toggle(setSelectedProviders)}
              onTogglePrivacy={toggle(setSelectedPrivacy)}
              maxPrice={maxPrice}
              priceCeiling={priceCeiling}
              onMaxPriceChange={setMaxPrice}
            />

            <section>
              <div className="mb-5 flex items-center justify-between">
                <p className="font-mono text-xs text-slate-400">
                  SHOWING <span className="font-bold text-white">{results.length}</span> MODEL{results.length === 1 ? "" : "S"}
                </p>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="font-mono text-xs font-semibold text-[#00FF9D] transition-colors hover:text-emerald-300 cursor-pointer"
                  >
                    RESET FILTERS ({activeFilterCount})
                  </button>
                )}
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
        )}
      </div>
    </div>
  );
}
