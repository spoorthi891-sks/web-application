import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Home from "./pages/Home.jsx";
import Explore from "./pages/Explore.jsx";
import ModelDetails from "./pages/ModelDetails.jsx";
import Checkout from "./pages/Checkout.jsx";
import Sandbox from "./pages/Sandbox.jsx";
import Account from "./pages/Account.jsx";
import Matchmaker from "./pages/Matchmaker.jsx";
import Compare from "./pages/Compare.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#080C0E] font-sans text-slate-100 antialiased selection:bg-[#00FF9D]/30 selection:text-[#00FF9D]">
      <ErrorBoundary location={location}>
        <Navbar />
        <main key={location.pathname} className="page-enter pt-16">
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/matchmaker" element={<Matchmaker />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/models/:id" element={<ModelDetails />} />
            <Route path="/models/:id/checkout" element={<Checkout />} />
            <Route path="/sandbox" element={<Sandbox />} />
            <Route path="/account" element={<Account />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="border-t border-white/[0.06] bg-[#06090B] py-10 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#00FF9D] shadow-[0_0_8px_#00FF9D]" />
              <span className="font-mono text-[11px] text-slate-400 tracking-wider">ALL SYSTEMS OPERATIONAL · 99.95% SLA</span>
            </div>
            <p className="font-mono text-[11px] text-slate-500 tracking-wider">
              © 2026 HIGHRISE · ENTERPRISE AI INFRASTRUCTURE
            </p>
          </div>
        </footer>
      </ErrorBoundary>
    </div>
  );
}
