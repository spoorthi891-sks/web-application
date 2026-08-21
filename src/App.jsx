import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Explore from "./pages/Explore.jsx";
import ModelDetails from "./pages/ModelDetails.jsx";
import Checkout from "./pages/Checkout.jsx";
import Sandbox from "./pages/Sandbox.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 antialiased selection:bg-cyan-400/30">
      <Navbar />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/models/:id" element={<ModelDetails />} />
          <Route path="/models/:id/checkout" element={<Checkout />} />
          <Route path="/sandbox" element={<Sandbox />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-600">
        © 2026 Highrise — Enterprise AI Marketplace
      </footer>
    </div>
  );
}
