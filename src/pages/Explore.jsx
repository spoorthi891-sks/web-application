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
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Explore the marketplace
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Trending open-weights models, live from the Hugging Face Hub.
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by keyword — e.g. reasoning, code, chat"
          className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 md:max-w-md"
        />
      </div>

      {status === "loading" && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="mt-8 rounded-2xl border border-dashed border-red-400/30 p-16 text-center">
          <p className="text-sm font-medium text-red-300">
            Couldn&apos;t load models from the Hugging Face Hub
          </p>
          <p className="mt-1 text-xs text-slate-500">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-6 rounded-xl bg-linear-to-r from-neon-blue to-neon-emerald px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Try again
          </button>
        </div>
      )}

      {status === "ready" && (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[260px_1fr]">
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
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {results.length} model{results.length === 1 ? "" : "s"} found
              </p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-cyan-300 transition-colors hover:text-cyan-200"
                >
                  Clear filters ({activeFilterCount})
                </button>
              )}
            </div>

            {results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-16 text-center">
                <p className="text-sm font-medium text-slate-300">
                  No models match your criteria
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Try broadening the filters or rephrasing the search.
                </p>
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
  );
}
