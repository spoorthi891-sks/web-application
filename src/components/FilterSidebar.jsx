import { formatUSD } from "../utils/costCalculator.js";

function FilterGroup({ title, options, selected, onToggle, last = false }) {
  return (
    <div className={last ? "" : "border-b border-white/5 pb-6"}>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      <ul className="space-y-2">
        {options.map((option) => {
          const checked = selected.includes(option);
          return (
            <li key={option}>
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-300 transition-colors hover:text-white">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(option)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-slate-800 accent-cyan-400"
                />
                <span className={checked ? "text-white" : undefined}>
                  {option}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function FilterSidebar({
  categories,
  providers,
  privacyStandards,
  selectedCategories,
  selectedProviders,
  selectedPrivacy,
  onToggleCategory,
  onToggleProvider,
  onTogglePrivacy,
  maxPrice,
  priceCeiling,
  onMaxPriceChange,
}) {
  return (
    <aside className="h-fit space-y-6 rounded-2xl border border-white/5 bg-slate-900/60 p-6 lg:sticky lg:top-24">
      <h2 className="text-sm font-semibold text-white">Filters</h2>

      <div className="border-b border-white/5 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Max unit price
          </h3>
          <span className="text-xs font-semibold text-cyan-300">
            {maxPrice >= priceCeiling ? "Any" : formatUSD(maxPrice)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={priceCeiling}
          step="0.0005"
          value={maxPrice}
          onChange={(event) => onMaxPriceChange(parseFloat(event.target.value))}
          aria-label="Maximum unit price"
          className="w-full accent-cyan-400"
        />
        <p className="mt-1.5 text-[11px] text-slate-600">
          Per 1K tokens or per request
        </p>
      </div>

      <FilterGroup
        title="Category"
        options={categories}
        selected={selectedCategories}
        onToggle={onToggleCategory}
      />
      <FilterGroup
        title="Provider"
        options={providers}
        selected={selectedProviders}
        onToggle={onToggleProvider}
      />
      <FilterGroup
        last
        title="Privacy & Compliance"
        options={privacyStandards}
        selected={selectedPrivacy}
        onToggle={onTogglePrivacy}
      />
    </aside>
  );
}
