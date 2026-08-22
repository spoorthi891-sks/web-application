import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ChatAssistant from "./components/ChatAssistant.jsx";
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
import Docs from "./pages/Docs.jsx";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Start every route change at the top (hash links handle their own scrolling)
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Press "/" anywhere to jump into marketplace search
  useEffect(() => {
    function handleSlashKey(event) {
      if (event.key !== "/") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      if (location.pathname === "/explore") {
        document.getElementById("explore-search")?.focus({ preventScroll: true });
      } else {
        navigate("/explore", { state: { autoFocusSearch: true } });
      }
    }
    window.addEventListener("keydown", handleSlashKey);
    return () => window.removeEventListener("keydown", handleSlashKey);
  }, [location.pathname, navigate]);

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
            <Route path="/docs" element={<Docs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <ChatAssistant />
      </ErrorBoundary>
    </div>
  );
}
