import { formatUSD } from "../utils/costCalculator.js";

function FilterGroup({ title, options, selected, onToggle, last = false }) {
  return (
    <div className={last ? "" : "border-b border-white/[0.07] pb-6"}>
      <h3 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </h3>
      <ul className="space-y-2">
        {options.map((option) => {
          const checked = selected.includes(option);
          return (
            <li key={option}>
              <label className="group flex cursor-pointer items-center gap-2.5 text-xs text-slate-300 transition-colors hover:text-white">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(option)}
                  className="h-4 w-4 shrink-0 rounded border-white/20 bg-[#080C0E] accent-[#00FF9D] transition focus:ring-0 focus:ring-offset-0"
                />
                <span className={`transition-colors ${checked ? "font-medium text-white" : "group-hover:text-slate-200"}`}>
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
    <aside className="h-fit space-y-6 rounded-2xl border border-white/[0.08] bg-[#0E141B]/90 p-6 backdrop-blur-md lg:sticky lg:top-24 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-white">Filters</h2>
        <span className="flex h-2 w-2 rounded-full bg-[#00FF9D] shadow-[0_0_6px_#00FF9D]" />
      </div>

      <div className="border-b border-white/[0.07] pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Max unit price
          </h3>
          <span className="font-mono text-xs font-bold text-[#00FF9D]">
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
          className="w-full accent-[#00FF9D] cursor-pointer"
        />
        <p className="mt-1.5 font-mono text-[10px] text-slate-500">
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
