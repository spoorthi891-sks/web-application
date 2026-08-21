# AGENTS.md — Highrise

Enterprise AI marketplace frontend. Read this before making changes.

## Stack

- React 19 + Vite 7 + React Router 7
- **Tailwind CSS v4** (CSS-first config via `@theme` in `src/index.css`)
  - There is NO `tailwind.config.js` — never create one
  - Use v4 syntax: `bg-linear-to-r`, `shadow-[...]`, arbitrary values
- No backend: data comes from `src/data/modelsRegistry.js` and live Hugging Face Hub API (`src/utils/hfHub.js`)

## Commands

```bash
npm install     # first time
npm run dev     # dev server at localhost:5173
npm run build   # production build — run this to verify changes
```

## Project layout

- `src/pages/` — Home, Explore, ModelDetails, Checkout, Sandbox
- `src/components/` — Navbar, ModelCard, FilterSidebar, PricingSection, CodeGenerator, SkeletonCard, HfModelDetail
- `src/utils/` — costCalculator, pricingPlans, matchmakerAlgo, hfHub (Hugging Face API)
- Routes: `/`, `/explore`, `/models/:id`, `/models/:id/checkout`, `/sandbox`

## Design language

- Dark theme only: slate-950 background, white/5 borders, glassy `bg-slate-900/60` panels
- Accent gradient: neon-blue (#22d3ee) → neon-emerald (#34d399), defined as theme tokens
- Inter font; uppercase micro-labels in slate-500; rounded-xl/2xl radii
- Hover language: `-translate-y-0.5` lift + cyan glow shadows on cards

## Rules for agents

1. Design/styling tasks: do NOT touch logic, routing, state, or files in `src/utils/` and `src/data/`
2. Keep all model links using `encodeURIComponent(model.id)` (HF ids contain slashes)
3. Verify with `npm run build` after every change batch
4. Do not commit or push unless explicitly asked
